// src/services/adminService.js
import api from "../config/api";

export const adminService = {
  // ============ PLATFORM STATISTICS ============

  // Get platform statistics
  getStats: async () => {
    /**
     * Returns:
     * {
     *   users: { total, totalRunners, pendingVerifications, verifiedRunners },
     *   orders: { total, active, completed },
     *   revenue: { totalPlatformFees }
     * }
     */
    const response = await api.get("/admin/stats");
    return response;
  },

  // ============ RUNNER VERIFICATION ============

  // Get pending runner verifications
  getPendingVerifications: async () => {
    /**
     * Returns array of users with status "pending"
     */
    const response = await api.get("/admin/pending-verifications");
    return response;
  },

  // Approve runner verification
  approveRunner: async (userId) => {
    const response = await api.post(`/admin/approve-runner/${userId}`);
    return response;
  },

  // Reject runner verification
  rejectRunner: async (userId, reason) => {
    const response = await api.post(`/admin/reject-runner/${userId}`, {
      reason,
    });
    return response;
  },

  // ============ USER MANAGEMENT ============

  // Get all users (with filters)
  getUsers: async (filters = {}) => {
    /**
     * filters: {
     *   role?: "konsumen" | "runner" | "admin",
     *   status?: "active" | "inactive",
     *   search?: string,
     *   limit?: number,
     *   page?: number
     * }
     */
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/users?${queryParams}`);
    return response;
  },

  // Get user detail
  getUserDetail: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response;
  },

  // Toggle user active status
  toggleUserStatus: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/toggle-status`);
    return response;
  },

  // Update user role
  updateUserRole: async (userId, roles) => {
    /**
     * roles: ["konsumen", "runner", "admin"]
     */
    const response = await api.put(`/admin/users/${userId}/roles`, { roles });
    return response;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response;
  },

  // ============ ORDER MANAGEMENT ============

  // Get all orders (with filters)
  getOrders: async (filters = {}) => {
    /**
     * filters: {
     *   status?: "terbuka" | "diambil" | "sudah_dibeli" | "sedang_diantar" | "selesai" | "dibatalkan",
     *   orderType?: "makanan" | "jasa",
     *   search?: string,
     *   limit?: number,
     *   page?: number
     * }
     */
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/admin/orders?${queryParams}`);
    return response;
  },

  // Cancel order (admin override)
  cancelOrder: async (orderId, reason) => {
    const response = await api.post(`/admin/orders/${orderId}/cancel`, {
      reason,
    });
    return response;
  },

  // ============ PLATFORM SETTINGS ============

  // Get platform settings
  getSettings: async () => {
    const response = await api.get("/admin/settings");
    return response;
  },

  // Update platform settings
  updateSettings: async (settings) => {
    /**
     * settings: {
     *   platformFeePercentage?: number,
     *   minOrderAmount?: number,
     *   maxOrderAmount?: number,
     *   autoApproveRunners?: boolean
     * }
     */
    const response = await api.put("/admin/settings", settings);
    return response;
  },
};
