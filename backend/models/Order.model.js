// models/Order.model.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: ["makanan", "jasa"],
      required: [true, "Tipe pesanan harus diisi"],
    },
    title: {
      type: String,
      required: [true, "Judul pesanan harus diisi"],
      trim: true,
      minlength: [5, "Judul minimal 5 karakter"],
    },
    description: {
      type: String,
      required: [true, "Deskripsi harus diisi"],
      minlength: [10, "Deskripsi minimal 10 karakter"],
    },

    // Pemisahan Finansial Total (CRITICAL)
    estimatedItemCost: {
      type: mongoose.Types.Decimal128,
      required: [true, "Estimasi dana talangan barang harus diisi"],
      min: [0, "Dana talangan tidak boleh negatif"],
    },
    serviceFeeCuan: {
      type: mongoose.Types.Decimal128,
      required: [true, "Biaya jasa runner (cuan) harus diisi"],
      min: [0, "Biaya jasa tidak boleh negatif"],
    },

    // Location data
    pickupLocation: {
      name: {
        type: String,
        required: [true, "Lokasi pengambilan harus diisi"],
      },
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },
    deliveryLocation: {
      name: {
        type: String,
        required: [true, "Lokasi pengantaran harus diisi"],
      },
      address: {
        type: String,
        required: true,
      },
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Deadline
    deadline: {
      type: Date,
      required: [true, "Deadline harus diisi"],
      validate: {
        validator: function (value) {
          return value > new Date();
        },
        message: "Deadline harus di masa depan",
      },
    },

    // User references
    consumer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    runner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // State Machine untuk Status (CRITICAL)
    status: {
      type: String,
      enum: [
        "terbuka", // Available for runners
        "diambil", // Runner accepted
        "sudah_dibeli", // Proof 1 uploaded
        "sedang_diantar", // Proof 2 uploaded
        "selesai", // Completed
        "dibatalkan", // Canceled
      ],
      default: "terbuka",
    },

    // Stepped Workflow Proofs (Embedded)
    workflowProofs: {
      proof1Purchase: {
        photoUrl: {
          type: String,
          default: null,
        },
        uploadedAt: {
          type: Date,
          default: null,
        },
        notes: String,
      },
      proof2Delivery: {
        photoUrl: {
          type: String,
          default: null,
        },
        uploadedAt: {
          type: Date,
          default: null,
        },
        notes: String,
      },
    },

    // Timestamps untuk tracking
    takenAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: null,
    },

    // Rating & Review System
    rating: {
      stars: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      comment: {
        type: String,
        default: null,
      },
      ratedAt: {
        type: Date,
        default: null,
      },
    },

    // Additional metadata
    notes: {
      type: String,
      default: "",
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
orderSchema.index({ status: 1, deadline: 1 });
orderSchema.index({ consumer: 1 });
orderSchema.index({ runner: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual untuk total biaya
orderSchema.virtual("totalCost").get(function () {
  const itemCost = parseFloat(this.estimatedItemCost.toString());
  const serviceFee = parseFloat(this.serviceFeeCuan.toString());
  return itemCost + serviceFee;
});

// Method to check if order can be taken
orderSchema.methods.canBeTaken = function () {
  return (
    this.status === "terbuka" && new Date() < this.deadline && !this.runner
  );
};

// Method to check if proof 1 can be uploaded
orderSchema.methods.canUploadProof1 = function () {
  return (
    this.status === "diambil" && !this.workflowProofs.proof1Purchase.photoUrl
  );
};

// Method to check if proof 2 can be uploaded
orderSchema.methods.canUploadProof2 = function () {
  return (
    this.status === "sudah_dibeli" &&
    this.workflowProofs.proof1Purchase.photoUrl &&
    !this.workflowProofs.proof2Delivery.photoUrl
  );
};

// Ensure virtuals are included
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

// PENTING: Export with check to prevent overwrite
module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
