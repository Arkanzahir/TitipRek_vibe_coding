// routes/order.routes.js
const express = require("express");
const router = express.Router();
const Order = require("../models/Order.model");
const User = require("../models/User.model");
const {
  protect,
  requireVerifiedRunner,
} = require("../middleware/auth.middleware");
const { uploadToCloud } = require("../utils/upload.util");

// @route   POST /api/orders
// @desc    Create new order
// @access  Private (Consumer)
router.post("/", protect, async (req, res) => {
  try {
    const {
      orderType,
      title,
      description,
      estimatedItemCost,
      serviceFeeCuan,
      pickupLocation,
      deliveryLocation,
      deadline,
      notes,
      isUrgent,
    } = req.body;

    // Validation
    if (
      !orderType ||
      !title ||
      !description ||
      estimatedItemCost === undefined ||
      serviceFeeCuan === undefined ||
      !pickupLocation ||
      !deliveryLocation ||
      !deadline
    ) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib harus diisi",
      });
    }

    // Validate deadline is in future
    if (new Date(deadline) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "Deadline harus di masa depan",
      });
    }

    // Create order
    const order = await Order.create({
      orderType,
      title,
      description,
      estimatedItemCost,
      serviceFeeCuan,
      pickupLocation,
      deliveryLocation,
      deadline,
      notes: notes || "",
      isUrgent: isUrgent || false,
      consumer: req.user.id,
    });

    // Update consumer stats
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { "consumerStats.totalOrders": 1 },
    });

    res.status(201).json({
      success: true,
      message: "Pesanan berhasil dibuat",
      data: order,
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat membuat pesanan",
    });
  }
});

// @route   GET /api/orders
// @desc    Get orders (with filters)
// @access  Public/Private
router.get("/", async (req, res) => {
  try {
    const { status, orderType, search, limit = 20, page = 1 } = req.query;

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
      .populate("consumer", "name campus profilePhoto")
      .populate("runner", "name profilePhoto runnerStats")
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
      message: "Terjadi kesalahan saat mengambil data pesanan",
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order by ID
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("consumer", "name phoneNumber campus whatsappLink profilePhoto")
      .populate(
        "runner",
        "name phoneNumber campus whatsappLink profilePhoto runnerStats"
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data pesanan",
    });
  }
});

// @route   GET /api/orders/my/consumer
// @desc    Get user's orders as consumer
// @access  Private
router.get("/my/consumer", protect, async (req, res) => {
  try {
    const { status } = req.query;

    const query = { consumer: req.user.id };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate(
        "runner",
        "name phoneNumber campus whatsappLink profilePhoto runnerStats"
      )
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    console.error("Get My Consumer Orders Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil pesanan Anda",
    });
  }
});

// @route   PUT /api/orders/:id
// @desc    Update order (only by consumer, only if status = terbuka)
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    // Check ownership
    if (order.consumer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk mengupdate pesanan ini",
      });
    }

    // Can only update if status is 'terbuka'
    if (order.status !== "terbuka") {
      return res.status(400).json({
        success: false,
        message: "Pesanan hanya dapat diupdate jika statusnya masih terbuka",
      });
    }

    const allowedFields = [
      "title",
      "description",
      "estimatedItemCost",
      "serviceFeeCuan",
      "pickupLocation",
      "deliveryLocation",
      "deadline",
      "notes",
      "isUrgent",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        order[field] = req.body[field];
      }
    });

    await order.save();

    res.json({
      success: true,
      message: "Pesanan berhasil diupdate",
      data: order,
    });
  } catch (error) {
    console.error("Update Order Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat mengupdate pesanan",
    });
  }
});

// @route   DELETE /api/orders/:id
// @desc    Cancel order
// @access  Private
router.delete("/:id", protect, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Pesanan tidak ditemukan",
      });
    }

    // Check ownership (consumer or runner can cancel)
    const isConsumer = order.consumer.toString() === req.user.id;
    const isRunner = order.runner && order.runner.toString() === req.user.id;

    if (!isConsumer && !isRunner) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki akses untuk membatalkan pesanan ini",
      });
    }

    // Can only cancel if not yet completed
    if (["selesai", "dibatalkan"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "Pesanan tidak dapat dibatalkan",
      });
    }

    order.status = "dibatalkan";
    order.canceledAt = new Date();
    order.cancellationReason = reason || "Tidak ada alasan";
    await order.save();

    // Update stats if runner was involved
    if (order.runner) {
      await User.findByIdAndUpdate(order.runner, {
        $inc: { "runnerStats.canceledMissions": 1 },
      });
    }

    res.json({
      success: true,
      message: "Pesanan berhasil dibatalkan",
      data: order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membatalkan pesanan",
    });
  }
});

module.exports = router;
