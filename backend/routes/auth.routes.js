// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { protect } = require("../middleware/auth.middleware");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, campus, address } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phoneNumber || !campus) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib harus diisi",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message:
          existingUser.email === email
            ? "Email sudah terdaftar"
            : "Nomor telepon sudah terdaftar",
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      campus,
      address: address || "",
    });

    // ❌ JANGAN GENERATE TOKEN SAAT REGISTER!
    // const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    // ✅ KIRIM RESPONSE TANPA TOKEN
    res.status(201).json({
      success: true,
      message: "Registrasi berhasil! Silakan login untuk melanjutkan.",
      data: {
        user,
        // NO TOKEN HERE! ✅
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat registrasi",
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password harus diisi",
      });
    }

    // Find user (include password for comparison)
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Akun Anda tidak aktif. Hubungi admin",
      });
    }

    // ✅ HANYA LOGIN YANG GENERATE TOKEN
    const token = generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    res.json({
      success: true,
      message: "Login berhasil",
      data: {
        user,
        token, // ✅ TOKEN ADA DI LOGIN
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat login",
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data user",
    });
  }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile
// @access  Private
router.put("/update-profile", protect, async (req, res) => {
  try {
    const { name, phoneNumber, campus, address, profilePhoto } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber;
    if (campus) fieldsToUpdate.campus = campus;
    if (address !== undefined) fieldsToUpdate.address = address;
    if (profilePhoto) fieldsToUpdate.profilePhoto = profilePhoto;

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Profil berhasil diupdate",
      data: user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Terjadi kesalahan saat update profil",
    });
  }
});

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Password lama dan baru harus diisi",
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Password lama tidak sesuai",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password berhasil diubah",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengubah password",
    });
  }
});

module.exports = router;
