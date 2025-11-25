// src/services/authService.js
import api from "../config/api";

export const authService = {
  // Register
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });

      if (response.success && response.data) {
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

  // 🔥 FUNGSI BARU: Update Profile 🔥
  updateProfile: async (data) => {
    try {
      const response = await api.put("/auth/update-profile", data);

      if (response.success) {
        // Update data user di LocalStorage biar langsung berubah di layar
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = { ...currentUser, ...response.data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      return response;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  // Get User
  getUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },
};
