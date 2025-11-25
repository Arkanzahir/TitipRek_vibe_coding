// src/config/api.js
import axios from "axios";

const API_URL = "https://titip-rek-vibe-coding.vercel.app/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses - IMPROVED
api.interceptors.response.use(
  (response) => {
    const data = response.data;

    // Return response data (dengan success flag)
    return data;
  },
  (error) => {
    // Handle HTTP errors (4xx, 5xx)
    if (error.response?.data) {
      // Jika backend return error response dengan message
      const message = error.response.data.message || "Terjadi kesalahan";
      return Promise.reject(new Error(message));
    }

    if (error.message === "Network Error") {
      return Promise.reject(new Error("Tidak bisa terhubung ke server"));
    }

    return Promise.reject(error);
  }
);

export default api;
