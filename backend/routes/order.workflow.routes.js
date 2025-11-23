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
// @desc    Upload Proof 1 - Purchase/Pickup (STEP 2 of workflow)
// @access  Private + Verified Runner Only
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

      // Validate runner is the one who took the mission
      if (!order.runner || order.runner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message:
            "Anda tidak memiliki akses untuk mengupload bukti pesanan ini",
        });
      }

      // CRITICAL: Validate workflow step
      if (!order.canUploadProof1()) {
        return res.status(400).json({
          success: false,
          message: order.workflowProofs.proof1Purchase.photoUrl
            ? "Bukti pembelian sudah diupload sebelumnya"
            : `Status pesanan harus "diambil" untuk upload bukti pembelian. Status saat ini: ${order.status}`,
        });
      }

      // Upload photo to cloud
      const photoUrl = await uploadToCloud(photoBase64, "proof-purchase");

      // Update order with proof 1
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
        nextStep: "Upload bukti foto pengantaran setelah barang diantar",
      });
    } catch (error) {
      console.error("Upload Proof 1 Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat upload bukti pembelian",
      });
    }
  }
);

// @route   POST /api/orders/:id/upload-proof-2
// @desc    Upload Proof 2 - Delivery (STEP 3 of workflow)
// @access  Private + Verified Runner Only
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

      // Validate runner
      if (!order.runner || order.runner.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message:
            "Anda tidak memiliki akses untuk mengupload bukti pesanan ini",
        });
      }

      // CRITICAL: Validate workflow step
      if (!order.canUploadProof2()) {
        return res.status(400).json({
          success: false,
          message: !order.workflowProofs.proof1Purchase.photoUrl
            ? "Harus upload bukti pembelian terlebih dahulu"
            : order.workflowProofs.proof2Delivery.photoUrl
            ? "Bukti pengantaran sudah diupload sebelumnya"
            : `Status pesanan harus "sudah_dibeli" untuk upload bukti pengantaran. Status saat ini: ${order.status}`,
        });
      }

      // Upload photo to cloud
      const photoUrl = await uploadToCloud(photoBase64, "proof-delivery");

      // Update order with proof 2
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
        nextStep: "Tunggu konsumen konfirmasi penerimaan barang",
      });
    } catch (error) {
      console.error("Upload Proof 2 Error:", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat upload bukti pengantaran",
      });
    }
  }
);

// @route   POST /api/orders/:id/confirm-complete
// @desc    Confirm order completion by consumer (FINAL STEP)
// @access  Private (Consumer only)
router.post("/:id/confirm-complete", protect, async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    // Validate consumer
    if (order.consumer.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Hanya konsumen yang dapat konfirmasi penyelesaian pesanan",
      });
    }

    // Validate status
    if (order.status !== "sedang_diantar") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message:
          'Pesanan harus dalam status "sedang_diantar" untuk dikonfirmasi selesai',
      });
    }

    // Validate both proofs exist
    if (
      !order.workflowProofs.proof1Purchase.photoUrl ||
      !order.workflowProofs.proof2Delivery.photoUrl
    ) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Kedua bukti foto harus sudah diupload oleh runner",
      });
    }

    // Update order to completed
    order.status = "selesai";
    order.completedAt = new Date();
    await order.save({ session });

    // Update runner stats
    const serviceFee = parseFloat(order.serviceFeeCuan.toString());

    await User.findByIdAndUpdate(
      order.runner,
      {
        $inc: {
          "runnerStats.completedMissions": 1,
          "runnerStats.totalEarnings": serviceFee,
        },
      },
      { session }
    );

    // Update consumer stats
    await User.findByIdAndUpdate(
      order.consumer,
      {
        $inc: { "consumerStats.completedOrders": 1 },
      },
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message:
        "Pesanan berhasil diselesaikan! Terima kasih telah menggunakan TitipRek",
      data: order,
      nextStep: "Anda dapat memberikan rating dan review untuk runner",
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Confirm Complete Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat konfirmasi penyelesaian pesanan",
    });
  } finally {
    session.endSession();
  }
});

// @route   POST /api/orders/:id/rate
// @desc    Rate and review runner after completion
// @access  Private (Consumer only)
router.post("/:id/rate", protect, async (req, res) => {
  const session = await Order.startSession();
  session.startTransaction();

  try {
    const { stars, comment } = req.body;

    // Validate rating
    if (!stars || stars < 1 || stars > 5) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Rating harus antara 1-5 bintang",
      });
    }

    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    // Validate consumer
    if (order.consumer.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: "Hanya konsumen yang dapat memberikan rating",
      });
    }

    // Can only rate completed orders
    if (order.status !== "selesai") {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message:
          "Rating hanya dapat diberikan untuk pesanan yang sudah selesai",
      });
    }

    // Check if already rated
    if (order.rating.stars) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: "Pesanan ini sudah diberi rating sebelumnya",
      });
    }

    // Save rating to order
    order.rating = {
      stars: parseInt(stars),
      comment: comment || "",
      ratedAt: new Date(),
    };
    await order.save({ session });

    // Update runner's average rating
    const runner = await User.findById(order.runner).session(session);

    const totalReviews = runner.runnerStats.totalReviews;
    const currentAvg = runner.runnerStats.averageRating;
    const newAvg =
      (currentAvg * totalReviews + parseInt(stars)) / (totalReviews + 1);

    runner.runnerStats.averageRating = newAvg;
    runner.runnerStats.totalReviews = totalReviews + 1;
    await runner.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Terima kasih atas rating dan review Anda!",
      data: {
        order: order,
        runnerNewRating: {
          averageRating: newAvg.toFixed(2),
          totalReviews: totalReviews + 1,
        },
      },
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Rate Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memberikan rating",
    });
  } finally {
    session.endSession();
  }
});

module.exports = router;
