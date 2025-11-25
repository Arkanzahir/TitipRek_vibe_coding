// backend/utils/upload.util.js

// 🔥 VERSI SIMPAN DI DATABASE (UNTUK DEMO VERCEL) 🔥
// Kita tidak menyimpan file ke folder karena Vercel tidak punya harddisk permanen.
// Kita akan mengembalikan string Base64 agar disimpan langsung di MongoDB.

const UPLOAD_DIR = ""; // Tidak dipakai

const uploadToCloud = async (base64Data, folder = "uploads") => {
  try {
    // Cek validitas data
    if (!base64Data || !base64Data.includes("base64,")) {
      throw new Error("Invalid base64 data");
    }

    // LANGSUNG KEMBALIKAN STRING BASE64-NYA
    // Agar disimpan mentah-mentah di Database
    return base64Data;
  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error("Failed to upload file");
  }
};

const deleteFile = async (fileUrl) => {
  return;
};

module.exports = {
  uploadToCloud,
  deleteFile,
  UPLOAD_DIR,
};
