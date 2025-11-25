// backend/controllers/auth.controller.js
const User = require("../models/User.model"); // Pastikan path model benar
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- FUNGSI REGISTRASI (DAFTAR) ---
exports.register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber, campus, address } = req.body;

    // Validasi
    if (!name || !email || !password || !phoneNumber || !campus) {
      return res.status(400).json({
        success: false, // 🔥 Tambah success: false
        message:
          "Mohon isi semua data wajib (nama, email, password, nomor HP, kampus)",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false, // 🔥 Tambah success: false
        message: "Email atau Nomor HP sudah terdaftar.",
      });
    }

    const user = await User.create({
      name,
      email,
      password, // Password akan di-hash oleh pre-save hook di model
      phoneNumber,
      campus,
      address: address || "",
    });

    // Hapus password dari respon
    user.password = undefined;

    // 🔥 UPDATE FORMAT RESPON AGAR SESUAI FRONTEND 🔥
    res.status(201).json({
      success: true, // ✅ Wajib ada
      message: "Registrasi berhasil!",
      data: {
        user,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat registrasi.",
    });
  }
};

// --- FUNGSI LOGIN (MASUK) ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Mohon isi email dan password.",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Email atau password salah.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Akun dinonaktifkan. Hubungi admin.",
      });
    }

    // Buat Token
    const token = jwt.sign(
      { id: user._id, roles: user.roles },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    user.password = undefined;

    // 🔥🔥 PERBAIKAN UTAMA DI SINI 🔥🔥
    // Kita bungkus user & token ke dalam properti 'data'
    res.json({
      success: true, // ✅ Frontend mengecek flag ini
      message: "Login berhasil!",
      data: {
        // ✅ Frontend mengambil data dari sini
        token,
        user,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat login.",
    });
  }
};
