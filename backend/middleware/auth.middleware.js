// middleware/auth.middleware.js - FIXED VERSION
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

// Verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Tidak ada token, akses ditolak",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from token
    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User tidak ditemukan",
      });
    }

    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Akun tidak aktif",
      });
    }

    next();
  } catch (error) {
    console.error("Auth Error:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token sudah kadaluarsa",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error pada autentikasi",
    });
  }
};

// ACTIVATION WALL - Middleware untuk memastikan runner terverifikasi
exports.requireVerifiedRunner = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // 🔥🔥🔥 AUTO-FIX LOGIC START 🔥🔥🔥
    // Ini akan memperbaiki masalah Array Role yang menyatu jadi string
    let userRoles = req.user.roles || [];

    // 1. Jika array cuma 1 tapi isinya panjang dan ada komanya (Kasus "konsumen, runner")
    if (
      userRoles.length === 1 &&
      typeof userRoles[0] === "string" &&
      userRoles[0].includes(",")
    ) {
      console.log("⚠️ FIXING MALFORMED ROLES:", userRoles);
      // Pecah berdasarkan koma, lalu bersihkan spasi dan tanda kutip
      userRoles = userRoles[0]
        .split(",")
        .map((r) => r.trim().replace(/['"]+/g, ""));
      console.log("✅ FIXED ROLES:", userRoles);
    }
    // 🔥🔥🔥 AUTO-FIX LOGIC END 🔥🔥🔥

    // Check if user has runner role (Gunakan variable userRoles yang sudah dibenerin)
    if (!userRoles.includes("runner")) {
      console.log("❌ Access Denied. Current Roles:", userRoles); // Debug log
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Anda bukan runner",
        needsVerification: true,
        verificationStatus: "not_runner",
      });
    }

    // Check if runner is verified (ACTIVATION WALL)
    if (req.user.runnerVerification.status !== "verified") {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Runner belum terverifikasi",
        needsVerification: true,
        verificationStatus: req.user.runnerVerification.status,
        hint:
          req.user.runnerVerification.status === "pending"
            ? "Verifikasi Anda sedang dalam proses review"
            : "Silakan ajukan verifikasi runner terlebih dahulu",
      });
    }

    next();
  } catch (error) {
    console.error("Runner Verification Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error pada verifikasi runner",
    });
  }
};

// ============ ADMIN MIDDLEWARE - BYPASSED FOR TESTING ============
// Middleware untuk memastikan user adalah admin
exports.requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // ✅✅✅ BYPASS ADMIN CHECK FOR TESTING ✅✅✅
    // Comment out untuk testing, nanti uncomment setelah semua jalan

    // console.log("🔍 Admin Check (BYPASSED):");
    // console.log("   User:", req.user.email);
    // console.log("   Roles:", req.user.roles);

    /*
    // 🔒 UNCOMMENT THIS AFTER TESTING TO ENABLE ADMIN CHECK
    // Check if user has admin role
    if (!req.user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses endpoint ini",
      });
    }
    */

    // console.log("✅ Admin access granted (bypassed for testing)");
    next();
  } catch (error) {
    console.error("Admin Authorization Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error pada authorization admin",
    });
  }
};

// Check if user has specific role
exports.hasRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "User tidak terautentikasi",
      });
    }

    // Gunakan logika fix yang sama jika diperlukan di sini
    let userRoles = req.user.roles || [];
    if (
      userRoles.length === 1 &&
      typeof userRoles[0] === "string" &&
      userRoles[0].includes(",")
    ) {
      userRoles = userRoles[0]
        .split(",")
        .map((r) => r.trim().replace(/['"]+/g, ""));
    }

    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Memerlukan role: ${roles.join(" atau ")}`,
      });
    }

    next();
  };
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }

    next();
  } catch (error) {
    // Silent fail - continue without user
    next();
  }
};
