// backend/utils/upload.util.js
const fs = require("fs");
const path = require("path");

/**
 * Simple local file upload utility
 * Saves base64 images to /backend/uploads folder
 *
 * For production, replace with cloud storage (AWS S3, Cloudinary, etc.)
 */

const UPLOAD_DIR = path.join(__dirname, "../uploads");

// Create uploads directory if not exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Create subdirectories
const SUBDIRS = ["ktm", "proof-purchase", "proof-delivery", "profiles"];
SUBDIRS.forEach((dir) => {
  const dirPath = path.join(UPLOAD_DIR, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

/**
 * Upload base64 image to local storage
 * @param {string} base64Data - Base64 encoded image (with data:image/... prefix)
 * @param {string} folder - Subfolder: 'ktm', 'proof-purchase', 'proof-delivery', 'profiles'
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToCloud = async (base64Data, folder = "uploads") => {
  try {
    // Validate base64 data
    if (!base64Data || !base64Data.includes("base64,")) {
      throw new Error("Invalid base64 data");
    }

    // Extract mime type and base64 string
    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error("Invalid base64 format");
    }

    const mimeType = matches[1];
    const base64String = matches[2];

    // Get file extension from mime type
    const extension = mimeType.split("/")[1] || "jpg";

    // Generate unique filename
    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}.${extension}`;

    // Determine subfolder path
    const subfolderPath = path.join(UPLOAD_DIR, folder);
    const filePath = path.join(subfolderPath, filename);

    // Convert base64 to buffer and save
    const buffer = Buffer.from(base64String, "base64");
    fs.writeFileSync(filePath, buffer);

    // Return public URL
    // In production, return cloud storage URL
    // For now, return local path relative to server
    const publicUrl = `/uploads/${folder}/${filename}`;

    console.log(`✅ File uploaded: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("Upload Error:", error);
    throw new Error("Failed to upload file");
  }
};

/**
 * Delete file from local storage
 * @param {string} fileUrl - File URL to delete
 */
const deleteFile = async (fileUrl) => {
  try {
    if (!fileUrl || !fileUrl.startsWith("/uploads/")) {
      return;
    }

    const filePath = path.join(__dirname, "..", fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ File deleted: ${fileUrl}`);
    }
  } catch (error) {
    console.error("Delete File Error:", error);
  }
};

module.exports = {
  uploadToCloud,
  deleteFile,
  UPLOAD_DIR,
};
