// controllers/auth.controller.js
const User = require("../models/User"); // Import model User untuk interaksi database
const bcrypt = require("bcryptjs"); // Import bcryptjs untuk hashing password
const jwt = require("jsonwebtoken"); // Import jsonwebtoken untuk membuat token

// --- FUNGSI REGISTRASI (DAFTAR) ---
exports.register = async (req, res) => {
  try {
    // 1. Ambil data dari body request (data yang dikirim dari Postman/Frontend)
    const { fullName, email, password, phoneNumber } = req.body;

    // 2. Validasi dasar: Cek apakah semua data penting diisi
    if (!fullName || !email || !password || !phoneNumber) {
      return res
        .status(400)
        .json({
          message: "Mohon isi semua data (nama, email, password, nomor HP)",
        });
    }

    // 3. Cek apakah email sudah terdaftar di database
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email sudah terdaftar, silakan login." });
    }

    // 4. Hash password agar aman (jangan simpan password mentah!)
    const salt = await bcrypt.genSalt(10); // Membuat "bumbu" untuk hash
    const hashedPassword = await bcrypt.hash(password, salt); // Membuat password ter-hash

    // 5. Buat user baru menggunakan model User
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword, // Simpan password yang sudah di-hash
      phoneNumber,
      // roles akan menggunakan nilai default dari schema (isConsumer: true, runnerStatus: 'none')
    });

    // 6. Simpan user baru ke database MongoDB
    const savedUser = await newUser.save();

    // 7. (Opsional tapi disarankan) Langsung buatkan token agar user bisa langsung dianggap login
    const token = jwt.sign(
      { id: savedUser._id, roles: savedUser.roles }, // Payload: Data yang disimpan dalam token
      process.env.JWT_SECRET, // Secret Key dari file .env
      { expiresIn: "30d" } // Masa berlaku token
    );

    // 8. Kirim respon sukses ke client
    res.status(201).json({
      message: "Registrasi berhasil!",
      token, // Kirim token
      user: {
        // Kirim data user (tanpa password)
        id: savedUser._id,
        fullName: savedUser.fullName,
        email: savedUser.email,
        roles: savedUser.roles,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan server saat registrasi." });
  }
};

// --- FUNGSI LOGIN (MASUK) ---
exports.login = async (req, res) => {
  try {
    // 1. Ambil email & password dari body request
    const { email, password } = req.body;

    // 2. Validasi: Cek apakah email & password diisi
    if (!email || !password) {
      return res.status(400).json({ message: "Mohon isi email dan password." });
    }

    // 3. Cari user di database berdasarkan email
    // Kita perlu field password juga untuk pengecekan, jadi gunakan .select('+password')
    const user = await User.findOne({ email }).select("+password");

    // 4. Cek apakah user ditemukan
    if (!user) {
      return res.status(401).json({ message: "Email atau password salah." }); // Gunakan pesan umum untuk keamanan
    }

    // 5. Bandingkan password mentah yang dikirim dengan password hash di DB
    const isMatch = await bcrypt.compare(password, user.password);

    // 6. Jika password tidak cocok
    if (!isMatch) {
      return res.status(401).json({ message: "Email atau password salah." });
    }

    // --- JIKA SAMPAI SINI, LOGIN SUKSES ---

    // 7. Buat Token JWT ("Kartu Akses")
    const token = jwt.sign(
      { id: user._id, roles: user.roles }, // Payload
      process.env.JWT_SECRET, // Secret Key
      { expiresIn: "30d" } // Masa berlaku
    );

    // 8. Kirim respon sukses beserta token
    res.json({
      message: "Login berhasil!",
      token, // Token ini PENTING, akan dipakai untuk request selanjutnya
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Terjadi kesalahan server saat login." });
  }
};
