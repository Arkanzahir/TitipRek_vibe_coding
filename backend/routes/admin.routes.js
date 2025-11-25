// backend/routes/admin.routes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Order = require("../models/Order.model");
const { protect, requireAdmin } = require("../middleware/auth.middleware");

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private + Admin Only
router.get("/stats", protect, requireAdmin, async (req, res) => {
  try {
    // User stats
    const totalUsers = await User.countDocuments();
    const totalRunners = await User.countDocuments({
      roles: "runner",
    });
    const pendingVerifications = await User.countDocuments({
      "runnerVerification.status": "pending",
    });

    // 🔥 FIX: Pastikan hitungan Verified Runner benar dari status, bukan role 🔥
    const verifiedRunners = await User.countDocuments({
      "runnerVerification.status": "verified",
    });

    // Order stats
    const totalOrders = await Order.countDocuments();
    const activeOrders = await Order.countDocuments({
      status: { $in: ["terbuka", "diambil", "sudah_dibeli", "sedang_diantar"] },
    });
    const completedOrders = await Order.countDocuments({ status: "selesai" });

    // Revenue calculation (sum of all serviceFeeCuan from completed orders)
    const revenueAgg = await Order.aggregate([
      { $match: { status: "selesai" } },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$serviceFeeCuan" } },
        },
      },
    ]);

    const totalPlatformFees = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          totalRunners,
          pendingVerifications,
          verifiedRunners, // Kirim data yang benar
        },
        orders: {
          total: totalOrders,
          active: activeOrders,
          completed: completedOrders,
        },
        revenue: {
          totalPlatformFees,
        },
      },
    });
  } catch (error) {
    console.error("Get Admin Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil statistik",
    });
  }
});

// @route   GET /api/admin/pending-verifications
// @desc    Get pending runner verifications
// @access  Private + Admin Only
router.get(
  "/pending-verifications",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const pendingRunners = await User.find({
        "runnerVerification.status": "pending",
      }).sort({ "runnerVerification.submittedAt": -1 });

      res.json({
        success: true,
        count: pendingRunners.length,
        data: pendingRunners,
      });
    } catch (error) {
      console.error("Get Pending Verifications Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil data verifikasi",
      });
    }
  }
);

// @route   POST /api/admin/approve-runner/:userId
// @desc    Approve runner verification
// @access  Private + Admin Only
router.post(
  "/approve-runner/:userId",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Update verification status ke verified
      user.runnerVerification.status = "verified";
      user.runnerVerification.verifiedAt = new Date();

      // 🔥 FIX: Pastikan Role Runner juga ditambahkan 🔥
      if (!user.roles.includes("runner")) {
        user.roles.push("runner");
      }

      await user.save();

      res.json({
        success: true,
        message: `Runner ${user.name} berhasil diverifikasi`,
        data: user,
      });
    } catch (error) {
      console.error("Approve Runner Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat approve runner",
      });
    }
  }
);

// @route   POST /api/admin/reject-runner/:userId
// @desc    Reject runner verification
// @access  Private + Admin Only
router.post(
  "/reject-runner/:userId",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Alasan penolakan harus diisi",
        });
      }

      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Update verification status
      user.runnerVerification.status = "rejected";
      user.runnerVerification.rejectionReason = reason;

      // Hapus role runner jika ada (karena ditolak)
      user.roles = user.roles.filter((role) => role !== "runner");

      await user.save();

      res.json({
        success: true,
        message: `Verifikasi ${user.name} ditolak`,
        data: user,
      });
    } catch (error) {
      console.error("Reject Runner Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat reject runner",
      });
    }
  }
);

// @route   GET /api/admin/users
// @desc    Get all users with filters
// @access  Private + Admin Only
router.get("/users", protect, requireAdmin, async (req, res) => {
  try {
    const { role, status, search, limit = 50, page = 1 } = req.query;

    const query = {};

    if (role) query.roles = role;
    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data users",
    });
  }
});

// @route   GET /api/admin/users/:userId
// @desc    Get user detail
// @access  Private + Admin Only
router.get("/users/:userId", protect, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get User Detail Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data user",
    });
  }
});

// @route   PUT /api/admin/users/:userId/toggle-status
// @desc    Toggle user active status
// @access  Private + Admin Only
router.put(
  "/users/:userId/toggle-status",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User tidak ditemukan",
        });
      }

      // Toggle status
      user.isActive = !user.isActive;
      await user.save();

      res.json({
        success: true,
        message: `User ${user.name} ${
          user.isActive ? "diaktifkan" : "dinonaktifkan"
        }`,
        data: user,
      });
    } catch (error) {
      console.error("Toggle User Status Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat toggle user status",
      });
    }
  }
);

// @route   GET /api/admin/orders
// @desc    Get all orders with filters
// @access  Private + Admin Only
router.get("/orders", protect, requireAdmin, async (req, res) => {
  try {
    const { status, orderType, search, limit = 50, page = 1 } = req.query;

    const query = {};

    if (status) query.status = status;
    if (orderType) query.orderType = orderType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await Order.find(query)
      .populate("consumer", "name email campus")
      .populate("runner", "name email runnerStats")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      count: orders.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: orders,
    });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data orders",
    });
  }
});

// @route   POST /api/admin/orders/:orderId/cancel
// @desc    Cancel order (admin override)
// @access  Private + Admin Only
router.post(
  "/orders/:orderId/cancel",
  protect,
  requireAdmin,
  async (req, res) => {
    try {
      const { reason } = req.body;
      const order = await Order.findById(req.params.orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order tidak ditemukan",
        });
      }

      if (["selesai", "dibatalkan"].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: "Order tidak dapat dibatalkan",
        });
      }

      order.status = "dibatalkan";
      order.canceledAt = new Date();
      order.cancellationReason = reason || "Dibatalkan oleh admin";
      await order.save();

      res.json({
        success: true,
        message: "Order berhasil dibatalkan",
        data: order,
      });
    } catch (error) {
      console.error("Cancel Order Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat membatalkan order",
      });
    }
  }
);

module.exports = router;
