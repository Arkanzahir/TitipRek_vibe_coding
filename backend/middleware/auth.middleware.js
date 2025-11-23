// backend/middleware/auth.middleware.js
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
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
        message: "Akun Anda tidak aktif",
      });
    }

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(401).json({
      success: false,
      message: "Token tidak valid",
    });
  }
};

// Require verified runner
const requireVerifiedRunner = async (req, res, next) => {
  try {
    if (!req.user.isVerifiedRunner()) {
      return res.status(403).json({
        success: false,
        message: "Anda harus menjadi runner terverifikasi untuk mengakses ini",
        requiresVerification: true,
      });
    }

    next();
  } catch (error) {
    console.error("Require Verified Runner Error:", error);
    return res.status(403).json({
      success: false,
      message: "Akses ditolak",
    });
  }
};

// Require admin role
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user.roles.includes("admin")) {
      return res.status(403).json({
        success: false,
        message: "Akses ditolak. Hanya admin yang dapat mengakses",
      });
    }

    next();
  } catch (error) {
    console.error("Require Admin Error:", error);
    return res.status(403).json({
      success: false,
      message: "Akses ditolak",
    });
  }
};

module.exports = {
  protect,
  requireVerifiedRunner,
  requireAdmin,
};
