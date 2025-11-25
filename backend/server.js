// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

// Import routes
const authRoutes = require("./routes/auth.routes");
const orderRoutes = require("./routes/order.routes");
const runnerRoutes = require("./routes/runner.routes");
const orderWorkflowRoutes = require("./routes/order.workflow.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());

// 🔥 PERBAIKAN DI SINI: Naikkan limit jadi 50mb biar upload foto lancar
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ✅ SERVE STATIC FILES (IMPORTANT FOR IMAGE UPLOAD)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/orders", orderWorkflowRoutes); // Workflow routes (upload proof, confirm, rate)
app.use("/api/runner", runnerRoutes);
app.use("/api/admin", adminRoutes); // Admin routes

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TitipRek API is running",
    version: "1.0.0",
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
    ╔═══════════════════════════════════════════╗
    ║   🚀 TitipRek Server is Running           ║
    ║   📡 Port: ${PORT}                         ║
    ║   🌍 URL: http://localhost:${PORT}         ║
    ║   📁 Uploads: /uploads (static serving)   ║
    ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;
