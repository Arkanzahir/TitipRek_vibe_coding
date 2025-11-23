// src/services/runnerService.js
import api from "../config/api";

export const runnerService = {
  // ============ RUNNER VERIFICATION ============

  // Apply Runner Verification (Upload KTM)
  applyVerification: async (ktmPhotoBase64) => {
    /**
     * ktmPhotoBase64: base64 string of KTM photo
     * Example: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
     */
    const response = await api.post("/runner/apply-verification", {
      ktmPhotoBase64,
    });
    return response;
  },

  // Get Verification Status
  getVerificationStatus: async () => {
    /**
     * Returns:
     * {
     *   isRunner: boolean,
     *   verificationStatus: "unverified" | "pending" | "verified" | "rejected",
     *   canTakeMissions: boolean,
     *   submittedAt: Date,
     *   verifiedAt: Date,
     *   rejectionReason: string
     * }
     */
    const response = await api.get("/runner/verification-status");
    return response;
  },

  // ============ MISSION MANAGEMENT ============

  // Get Available Missions (REQUIRES VERIFIED RUNNER)
  getAvailableMissions: async (filters = {}) => {
    /**
     * filters: {
     *   orderType?: "makanan" | "jasa",
     *   sortBy?: "deadline" | "newest" | "highest_pay"
     * }
     */
    const queryParams = new URLSearchParams(filters).toString();
    const response = await api.get(`/runner/available-missions?${queryParams}`);
    return response;
  },

  // Take Mission (STEP 1 of Workflow)
  takeMission: async (orderId) => {
    /**
     * Takes the mission and changes status to "diambil"
     * Returns order with consumer contact info
     */
    const response = await api.post(`/runner/take-mission/${orderId}`);
    return response;
  },

  // Get My Missions
  getMyMissions: async (status = "active") => {
    /**
     * status options:
     * - "active": diambil, sudah_dibeli, sedang_diantar
     * - "completed": selesai
     * - "all": all statuses
     * - specific status: "diambil", "sudah_dibeli", etc.
     */
    const response = await api.get(`/runner/my-missions?status=${status}`);
    return response;
  },

  // Get Runner Stats & Earnings
  getStats: async () => {
    /**
     * Returns:
     * {
     *   totalMissions: number,
     *   completedMissions: number,
     *   canceledMissions: number,
     *   averageRating: number,
     *   totalReviews: number,
     *   totalEarnings: number,
     *   completionRate: number,
     *   verificationDate: Date
     * }
     */
    const response = await api.get("/runner/stats");
    return response;
  },

  // ============ STEPPED WORKFLOW ============

  // Upload Proof 1 - Purchase/Pickup (STEP 2)
  uploadProof1: async (orderId, photoBase64, notes = "") => {
    /**
     * CRITICAL: Can only upload if status = "diambil"
     * After success, status changes to "sudah_dibeli"
     */
    const response = await api.post(`/orders/${orderId}/upload-proof-1`, {
      photoBase64,
      notes,
    });
    return response;
  },

  // Upload Proof 2 - Delivery (STEP 3)
  uploadProof2: async (orderId, photoBase64, notes = "") => {
    /**
     * CRITICAL: Can only upload if:
     * - Proof 1 already uploaded
     * - Status = "sudah_dibeli"
     * After success, status changes to "sedang_diantar"
     */
    const response = await api.post(`/orders/${orderId}/upload-proof-2`, {
      photoBase64,
      notes,
    });
    return response;
  },

  // ============ HELPER METHODS ============

  // Check if user can take missions
  canTakeMissions: async () => {
    try {
      const status = await runnerService.getVerificationStatus();
      return status.data.canTakeMissions;
    } catch (error) {
      return false;
    }
  },

  // Get active missions only
  getActiveMissions: async () => {
    return await runnerService.getMyMissions("active");
  },

  // Get completed missions
  getCompletedMissions: async () => {
    return await runnerService.getMyMissions("completed");
  },

  // Format earnings
  formatEarnings: (earnings) => {
    return `Rp ${parseInt(earnings).toLocaleString("id-ID")}`;
  },

  // Get verification status text
  getVerificationStatusText: (status) => {
    const statusTexts = {
      unverified: "Belum Mengajukan",
      pending: "Sedang Diproses",
      verified: "Terverifikasi ✓",
      rejected: "Ditolak",
    };
    return statusTexts[status] || status;
  },

  // Get verification status color
  getVerificationStatusColor: (status) => {
    const colors = {
      unverified: "gray",
      pending: "yellow",
      verified: "green",
      rejected: "red",
    };
    return colors[status] || "gray";
  },
};
