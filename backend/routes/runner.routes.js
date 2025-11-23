const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Order = require("../models/Order.model");
const {
  protect,
  requireVerifiedRunner,
} = require("../middleware/auth.middleware");
const { uploadToCloud } = require("../utils/upload.util");

// @route   POST /api/runner/apply-verification
// @desc    Submit runner verification (upload KTM)
// @access  Private
router.post("/apply-verification", protect, async (req, res) => {
  try {
    const { ktmPhotoBase64 } = req.body;

    if (!ktmPhotoBase64) {
      return res.status(400).json({
        success: false,
        message: "Foto KTM harus diupload",
      });
    }

    // Check if already pending or verified
    if (req.user.runnerVerification.status === "pending") {
      return res.status(400).json({
        success: false,
        message: "Pengajuan verifikasi Anda sedang dalam proses review",
      });
    }

    if (req.user.runnerVerification.status === "verified") {
      return res.status(400).json({
        success: false,
        message: "Anda sudah terverifikasi sebagai runner",
      });
    }

    // Upload KTM photo to cloud storage
    const ktmUrl = await uploadToCloud(ktmPhotoBase64, "ktm");

    // Update user verification status
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          "runnerVerification.status": "pending",
          "runnerVerification.ktmPhoto": ktmUrl,
          "runnerVerification.submittedAt": new Date(),
        },
        $addToSet: { roles: "runner" },
      },
      { new: true }
    );

    res.json({
      success: true,
      message:
        "Pengajuan verifikasi runner berhasil dikirim. Mohon tunggu proses review",
      data: {
        verificationStatus: user.runnerVerification.status,
        submittedAt: user.runnerVerification.submittedAt,
      },
    });
  } catch (error) {
    console.error("Apply Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengajukan verifikasi",
    });
  }
});

// @route   GET /api/runner/verification-status
// @desc    Get runner verification status
// @access  Private
router.get("/verification-status", protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        isRunner: req.user.roles.includes("runner"),
        verificationStatus: req.user.runnerVerification.status,
        canTakeMissions: req.user.isVerifiedRunner(),
        submittedAt: req.user.runnerVerification.submittedAt,
        verifiedAt: req.user.runnerVerification.verifiedAt,
        rejectionReason: req.user.runnerVerification.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Verification Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil status verifikasi",
    });
  }
});

// @route   GET /api/runner/available-missions
// @desc    Get available missions (orders) for verified runners
// @access  Private + Verified Runner Only (ACTIVATION WALL)
router.get(
  "/available-missions",
  protect,
  requireVerifiedRunner,
  async (req, res) => {
    try {
      const { orderType, sortBy = "deadline" } = req.query;

      const query = {
        status: "terbuka",
        deadline: { $gt: new Date() },
        runner: null,
      };

      if (orderType) {
        query.orderType = orderType;
      }

      const sortOptions = {
        deadline: { deadline: 1 },
        newest: { createdAt: -1 },
        highest_pay: { serviceFeeCuan: -1 },
      };

      const orders = await Order.find(query)
        .populate("consumer", "name phoneNumber campus profilePhoto")
        .sort(sortOptions[sortBy] || sortOptions.deadline)
        .limit(50);

      res.json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error) {
      console.error("Get Available Missions Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil daftar misi",
      });
    }
  }
);

// @route   POST /api/runner/take-mission/:orderId
// @desc    Take a mission (order) - STEP 1 of workflow
// @access  Private + Verified Runner Only
router.post(
  "/take-mission/:orderId",
  protect,
  requireVerifiedRunner,
  async (req, res) => {
    const session = await Order.startSession();
    session.startTransaction();

    try {
      const orderId = req.params.orderId;

      // Find and lock the order
      const order = await Order.findById(orderId).session(session);

      if (!order) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          message: "Pesanan tidak ditemukan",
        });
      }

      // Validate order can be taken
      if (!order.canBeTaken()) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: order.runner
            ? "Pesanan sudah diambil runner lain"
            : "Pesanan tidak dapat diambil (mungkin sudah lewat deadline)",
        });
      }

      // Cannot take own order
      if (order.consumer.toString() === req.user.id) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: "Anda tidak dapat mengambil pesanan sendiri",
        });
      }

      // Update order
      order.runner = req.user.id;
      order.status = "diambil";
      order.takenAt = new Date();
      await order.save({ session });

      // Update runner stats
      await User.findByIdAndUpdate(
        req.user.id,
        { $inc: { "runnerStats.totalMissions": 1 } },
        { session }
      );

      await session.commitTransaction();

      // Populate for response
      await order.populate("consumer", "name phoneNumber campus whatsappLink");

      res.json({
        success: true,
        message: "Misi berhasil diambil!",
        data: order,
        nextStep: "Upload bukti foto pembelian/pengambilan barang",
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Take Mission Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat mengambil misi",
      });
    } finally {
      session.endSession();
    }
  }
);

// @route   GET /api/runner/my-missions
// @desc    Get runner's active and completed missions
// @access  Private + Verified Runner Only
router.get("/my-missions", protect, requireVerifiedRunner, async (req, res) => {
  try {
    const { status = "active" } = req.query;

    let query = { runner: req.user.id };

    if (status === "active") {
      query.status = { $in: ["diambil", "sudah_dibeli", "sedang_diantar"] };
    } else if (status === "completed") {
      query.status = "selesai";
    } else if (status === "all") {
      // No additional filter
    } else {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate("consumer", "name phoneNumber campus whatsappLink profilePhoto")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get My Missions Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil daftar misi Anda",
    });
  }
});

// @route   GET /api/runner/stats
// @desc    Get runner statistics and earnings
// @access  Private + Verified Runner Only
router.get("/stats", protect, requireVerifiedRunner, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    // Calculate additional stats
    const completionRate =
      user.runnerStats.totalMissions > 0
        ? (
            (user.runnerStats.completedMissions /
              user.runnerStats.totalMissions) *
            100
          ).toFixed(1)
        : 0;

    res.json({
      success: true,
      data: {
        ...user.runnerStats.toObject(),
        totalEarnings: parseFloat(user.runnerStats.totalEarnings.toString()),
        completionRate: parseFloat(completionRate),
        verificationDate: user.runnerVerification.verifiedAt,
      },
    });
  } catch (error) {
    console.error("Get Runner Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil statistik runner",
    });
  }
});

module.exports = router;
