// backend/routes/auth.routes.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const { protect } = require("../middleware/auth.middleware");
const { uploadToCloud } = require("../utils/upload.util"); // 🔥 Import Upload Utility

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// @route   POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, campus, address } = req.body;

    if (!name || !email || !password || !phoneNumber || !campus) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib harus diisi",
      });
    }

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

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      campus,
      address: address || "",
    });

    user.password = undefined;

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil! Silakan login untuk melanjutkan.",
      data: { user },
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
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password harus diisi",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Akun Anda tidak aktif. Hubungi admin",
      });
    }

    const token = generateToken(user._id);
    user.password = undefined;

    res.json({
      success: true,
      message: "Login berhasil",
      data: { user, token },
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
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ success: true, data: user });
  } catch (error) {
    console.error("Get Me Error:", error);
    res.status(500).json({ success: false, message: "Error server" });
  }
});

// @route   PUT /api/auth/update-profile
// 🔥 UPDATED: Support Upload Foto Profil 🔥
router.put("/update-profile", protect, async (req, res) => {
  try {
    const { name, phoneNumber, campus, address, profilePhoto } = req.body;

    const fieldsToUpdate = {};
    if (name) fieldsToUpdate.name = name;
    if (phoneNumber) fieldsToUpdate.phoneNumber = phoneNumber;
    if (campus) fieldsToUpdate.campus = campus;
    if (address !== undefined) fieldsToUpdate.address = address;

    // 🔥 LOGIKA UPLOAD FOTO 🔥
    if (profilePhoto) {
      // Cek apakah ini data gambar Base64?
      if (profilePhoto.startsWith("data:image")) {
        try {
          const url = await uploadToCloud(profilePhoto, "profiles");
          fieldsToUpdate.profilePhoto = url;
        } catch (uploadError) {
          console.error("Profile Upload Error:", uploadError);
          return res
            .status(500)
            .json({ success: false, message: "Gagal mengupload foto profil" });
        }
      } else {
        // Kalau cuma string biasa (bukan base64), simpan langsung
        fieldsToUpdate.profilePhoto = profilePhoto;
      }
    }

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
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Password lama dan baru harus diisi",
        });
    }

    const user = await User.findById(req.user.id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Password lama tidak sesuai" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password berhasil diubah" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ success: false, message: "Error server" });
  }
});

module.exports = router;
