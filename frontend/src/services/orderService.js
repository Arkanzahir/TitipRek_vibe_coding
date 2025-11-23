// src/services/orderService.js
import api from "../config/api";

export const orderService = {
  // ============ CONSUMER ACTIONS ============

  // Create Order - SESUAI DENGAN ORDER MODEL
  createOrder: async (orderData) => {
    /**
     * orderData structure:
     * {
     *   orderType: "makanan" | "jasa",
     *   title: string (min 5 chars),
     *   description: string (min 10 chars),
     *   estimatedItemCost: number,
     *   serviceFeeCuan: number,
     *   pickupLocation: {
     *     name: string,
     *     address: string,
     *     coordinates?: { latitude: number, longitude: number }
     *   },
     *   deliveryLocation: {
     *     name: string,
     *     address: string,
     *     coordinates?: { latitude: number, longitude: number }
     *   },
     *   deadline: Date (must be in future),
     *   notes?: string,
     *   isUrgent?: boolean
     * }
     */
    const response = await api.post("/orders", orderData);
    return response;
  },

  // Get All Orders (public/filtered)
  getOrders: async (filters = {}) => {
    /**
     * filters: {
     *   status?: "terbuka" | "diambil" | "sudah_dibeli" | "sedang_diantar" | "selesai" | "dibatalkan",
     *   orderType?: "makanan" | "jasa",
     *   search?: string,
     *   limit?: number (default: 20),
     *   page?: number (default: 1)
     * }
     */
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/orders?${queryParams}`);
    return response;
  },

  // Get My Orders (as consumer)
  getMyOrders: async (status) => {
    /**
     * status?: "terbuka" | "diambil" | "sudah_dibeli" | "sedang_diantar" | "selesai" | "dibatalkan"
     */
    const query = status ? `?status=${status}` : "";
    const response = await api.get(`/orders/my/consumer${query}`);
    return response;
  },

  // Get Order Detail
  getOrderDetail: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response;
  },

  // Update Order (only if status = terbuka)
  updateOrder: async (orderId, orderData) => {
    const response = await api.put(`/orders/${orderId}`, orderData);
    return response;
  },

  // Cancel Order
  cancelOrder: async (orderId, reason) => {
    const response = await api.delete(`/orders/${orderId}`, {
      data: { reason },
    });
    return response;
  },

  // Confirm Order Complete (Consumer - FINAL STEP)
  confirmComplete: async (orderId) => {
    const response = await api.post(`/orders/${orderId}/confirm-complete`);
    return response;
  },

  // Rate Order (after completion)
  rateOrder: async (orderId, stars, comment = "") => {
    /**
     * stars: 1-5
     * comment: string (optional)
     */
    const response = await api.post(`/orders/${orderId}/rate`, {
      stars,
      comment,
    });
    return response;
  },

  // ============ HELPER METHODS ============

  // Get orders by status
  getOrdersByStatus: async (status) => {
    return await orderService.getOrders({ status });
  },

  // Get available orders (terbuka)
  getAvailableOrders: async () => {
    return await orderService.getOrders({ status: "terbuka" });
  },

  // Calculate total cost
  calculateTotalCost: (estimatedItemCost, serviceFeeCuan) => {
    return parseFloat(estimatedItemCost) + parseFloat(serviceFeeCuan);
  },

  // Format order for display
  formatOrderForDisplay: (order) => {
    return {
      ...order,
      totalCost: orderService.calculateTotalCost(
        order.estimatedItemCost,
        order.serviceFeeCuan
      ),
      estimatedItemCostFormatted: `Rp ${parseInt(
        order.estimatedItemCost
      ).toLocaleString("id-ID")}`,
      serviceFeeCuanFormatted: `Rp ${parseInt(
        order.serviceFeeCuan
      ).toLocaleString("id-ID")}`,
      totalCostFormatted: `Rp ${orderService
        .calculateTotalCost(order.estimatedItemCost, order.serviceFeeCuan)
        .toLocaleString("id-ID")}`,
      deadlineFormatted: new Date(order.deadline).toLocaleString("id-ID"),
    };
  },
};
