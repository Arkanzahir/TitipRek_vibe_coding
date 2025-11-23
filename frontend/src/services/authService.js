// src/services/authService.js
import api from "../config/api";

export const authService = {
  // Register - TIDAK menyimpan token
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);

      // JANGAN SIMPAN TOKEN di localStorage saat register!
      // User harus login manual

      return response;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  // Login - SIMPAN token
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      // HANYA LOGIN yang simpan token ke localStorage
      if (response.success && response.data && response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get current user from localStorage
  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  // Get token from localStorage
  getToken: () => {
    return localStorage.getItem("token");
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};
