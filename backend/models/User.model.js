// models/User.model.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nama harus diisi"],
      trim: true,
      minlength: [2, "Nama minimal 2 karakter"],
    },
    email: {
      type: String,
      required: [true, "Email harus diisi"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Format email tidak valid"],
    },
    password: {
      type: String,
      required: [true, "Password harus diisi"],
      minlength: [6, "Password minimal 6 karakter"],
      select: false,
    },
    phoneNumber: {
      type: String,
      required: [true, "Nomor telepon harus diisi"],
      match: [
        /^62\d{8,15}$/,
        "Format nomor telepon harus 62xxx (format internasional)",
      ],
      unique: true,
    },
    profilePhoto: {
      type: String,
      default: null,
    },
    campus: {
      type: String,
      required: [true, "Kampus harus diisi"],
    },
    address: {
      type: String,
      default: "",
    },

    // Dual Role System + ADMIN
    roles: {
      type: [String],
      enum: ["konsumen", "runner", "admin"],
      default: ["konsumen"],
    },

    // Runner Verification Data
    runnerVerification: {
      status: {
        type: String,
        enum: ["unverified", "pending", "verified", "rejected"],
        default: "unverified",
      },
      ktmPhoto: {
        type: String,
        default: null,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
      rejectionReason: {
        type: String,
        default: null,
      },
    },

    // Runner Stats
    runnerStats: {
      totalMissions: {
        type: Number,
        default: 0,
      },
      completedMissions: {
        type: Number,
        default: 0,
      },
      canceledMissions: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      totalReviews: {
        type: Number,
        default: 0,
      },
      totalEarnings: {
        type: mongoose.Types.Decimal128,
        default: 0,
      },
    },

    // Consumer Stats
    consumerStats: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      completedOrders: {
        type: Number,
        default: 0,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user is verified runner
userSchema.methods.isVerifiedRunner = function () {
  return (
    this.roles.includes("runner") &&
    this.runnerVerification.status === "verified"
  );
};

// Method to check if user is admin
userSchema.methods.isAdmin = function () {
  return this.roles.includes("admin");
};

// Virtual for WhatsApp link
userSchema.virtual("whatsappLink").get(function () {
  return `https://wa.me/${this.phoneNumber}`;
});

// Ensure virtuals are included
userSchema.set("toJSON", { virtuals: true });
userSchema.set("toObject", { virtuals: true });

// PENTING: Export model with check to prevent overwrite
module.exports = mongoose.models.User || mongoose.model("User", userSchema);
