// backend/routes/order.workflow.routes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order.model");
const User = require("../models/User.model");
const {
  protect,
  requireVerifiedRunner,
} = require("../middleware/auth.middleware");
const { uploadToCloud } = require("../utils/upload.util");

// @route   POST /api/orders/:id/upload-proof-1
// @desc    Upload Proof 1 - Purchase/Pickup (STEP 2)
router.post(
  "/:id/upload-proof-1",
  protect,
  requireVerifiedRunner,
  async (req, res) => {
    try {
      const { photoBase64, notes } = req.body;

      if (!photoBase64) {
        return res.status(400).json({
          success: false,
          message: "Foto bukti pembelian harus diupload",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Pesanan tidak ditemukan",
        });
      }

      if (!order.runner || order.runner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Anda tidak memiliki akses",
        });
      }

      if (!order.canUploadProof1()) {
        return res.status(400).json({
          success: false,
          message: "Status pesanan tidak sesuai untuk upload bukti ini",
        });
      }

      const photoUrl = await uploadToCloud(photoBase64, "proof-purchase");

      order.workflowProofs.proof1Purchase = {
        photoUrl,
        uploadedAt: new Date(),
        notes: notes || "",
      };
      order.status = "sudah_dibeli";

      await order.save();

      res.json({
        success: true,
        message: "Bukti pembelian berhasil diupload!",
        data: order,
      });
    } catch (error) {
      console.error("Upload Proof 1 Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat upload bukti",
      });
    }
  }
);

// @route   POST /api/orders/:id/upload-proof-2
// @desc    Upload Proof 2 - Delivery (STEP 3)
router.post(
  "/:id/upload-proof-2",
  protect,
  requireVerifiedRunner,
  async (req, res) => {
    try {
      const { photoBase64, notes } = req.body;

      if (!photoBase64) {
        return res.status(400).json({
          success: false,
          message: "Foto bukti pengantaran harus diupload",
        });
      }

      const order = await Order.findById(req.params.id);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Pesanan tidak ditemukan",
        });
      }

      if (!order.runner || order.runner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: "Anda tidak memiliki akses",
        });
      }

      if (!order.canUploadProof2()) {
        return res.status(400).json({
          success: false,
          message: "Status pesanan tidak sesuai untuk upload bukti ini",
        });
      }

      const photoUrl = await uploadToCloud(photoBase64, "proof-delivery");

      order.workflowProofs.proof2Delivery = {
        photoUrl,
        uploadedAt: new Date(),
        notes: notes || "",
      };
      order.status = "sedang_diantar";

      await order.save();

      res.json({
        success: true,
        message: "Bukti pengantaran berhasil diupload!",
        data: order,
      });
    } catch (error) {
      console.error("Upload Proof 2 Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat upload bukti",
      });
    }
  }
);

// @route   POST /api/orders/:id/confirm-complete
// @desc    Confirm order completion by consumer (FINAL STEP)
router.post("/:id/confirm-complete", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    if (order.consumer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Hanya konsumen yang dapat konfirmasi penyelesaian pesanan",
      });
    }

    if (order.status !== "sedang_diantar") {
      return res.status(400).json({
        success: false,
        message: 'Pesanan harus dalam status "sedang_diantar"',
      });
    }

    order.status = "selesai";
    order.completedAt = new Date();

    await order.save();

    const serviceFee = parseFloat(order.serviceFeeCuan.toString());

    // Update runner stats (Safely with updateOne)
    if (order.runner) {
      await User.updateOne(
        { _id: order.runner },
        {
          $inc: {
            "runnerStats.completedMissions": 1,
            "runnerStats.totalEarnings": serviceFee,
          },
        }
      );
    }

    // Update consumer stats (Safely with updateOne)
    await User.updateOne(
      { _id: order.consumer },
      {
        $inc: { "consumerStats.completedOrders": 1 },
      }
    );

    res.json({
      success: true,
      message:
        "Pesanan berhasil diselesaikan! Terima kasih telah menggunakan TitipRek",
      data: order,
    });
  } catch (error) {
    console.error("Confirm Complete Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat konfirmasi penyelesaian pesanan",
    });
  }
});

// @route   POST /api/orders/:id/rate
// @desc    Rate and review runner after completion
// 🔥 VERSI ANTI-CRASH / ROBUST (Fix Error 500)
router.post("/:id/rate", protect, async (req, res) => {
  try {
    const { stars, comment } = req.body;

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating harus antara 1-5 bintang",
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    if (order.consumer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Hanya konsumen yang dapat memberikan rating",
      });
    }

    if (order.status !== "selesai") {
      return res.status(400).json({
        success: false,
        message:
          "Rating hanya dapat diberikan untuk pesanan yang sudah selesai",
      });
    }

    if (order.rating && order.rating.stars) {
      return res.status(400).json({
        success: false,
        message: "Pesanan ini sudah diberi rating sebelumnya",
      });
    }

    // 1. Simpan Rating ke Order (Update Order saja)
    order.rating = {
      stars: parseInt(stars),
      comment: comment || "",
      ratedAt: new Date(),
    };
    await order.save();

    // 2. Update Rating Runner (SAFE UPDATE)
    if (order.runner) {
      const runner = await User.findById(order.runner);

      if (runner) {
        // Ambil data lama (pakai 0 kalau null/undefined)
        const currentReviews = runner.runnerStats?.totalReviews || 0;
        const currentAvg = parseFloat(runner.runnerStats?.averageRating || 0);
        const newStars = parseInt(stars);

        // Rumus Rata-rata Baru
        const newAvg =
          (currentAvg * currentReviews + newStars) / (currentReviews + 1);

        // 🔥 GUNAKAN updateOne AGAR TIDAK VALIDASI FIELD LAIN
        await User.updateOne(
          { _id: order.runner },
          {
            $set: {
              "runnerStats.averageRating": newAvg,
              "runnerStats.totalReviews": currentReviews + 1,
            },
          }
        );
      }
    }

    res.json({
      success: true,
      message: "Terima kasih atas rating dan review Anda!",
      data: order,
    });
  } catch (error) {
    console.error("Rate Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memberikan rating",
    });
  }
});

module.exports = router;
