// src/pages/Auth.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import {
  formatPhoneToInternational,
  isValidIndonesianPhone,
} from "@/utils/phoneHelper";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    campus: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
    if (successMessage) setSuccessMessage("");
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError("Email dan password harus diisi");
        return false;
      }
    } else {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.phoneNumber ||
        !formData.campus
      ) {
        setError("Semua field harus diisi");
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Format email tidak valid");
        return false;
      }

      if (formData.password.length < 6) {
        setError("Password minimal 6 karakter");
        return false;
      }

      if (!isValidIndonesianPhone(formData.phoneNumber)) {
        setError(
          "Format nomor telepon tidak valid. Gunakan format 08xxx atau 628xxx"
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        // ========== LOGIN ==========
        const response = await authService.login(
          formData.email,
          formData.password
        );

        if (response.success) {
          // Login berhasil, navigate ke dashboard
          navigate("/dashboard");
        } else {
          setError(response.message || "Login gagal");
        }
      } else {
        // ========== REGISTER ==========
        const userData = {
          ...formData,
          phoneNumber: formatPhoneToInternational(formData.phoneNumber),
        };

        const response = await authService.register(userData);

        if (response.success) {
          // Registrasi berhasil
          setSuccessMessage(
            "Registrasi berhasil! Silakan login dengan akun Anda."
          );

          // Switch ke form login
          setIsLogin(true);

          // Reset form
          setFormData({
            name: "",
            email: "",
            password: "",
            phoneNumber: "",
            campus: "",
          });

          // TIDAK navigate ke dashboard!
        } else {
          setError(response.message || "Registrasi gagal");
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-400 to-teal-600 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-center text-teal-600 mb-2">
          TitipRek
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {isLogin ? "Masuk ke akun Anda" : "Buat akun baru"}
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            ⚠️ {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            ✓ {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Lengkap
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="nama@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isLogin ? "Password" : "Minimal 6 karakter"}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="081234567890"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 08xxx atau 628xxx (untuk WhatsApp)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kampus
                </label>
                <input
                  type="text"
                  name="campus"
                  value={formData.campus}
                  onChange={handleChange}
                  placeholder="Contoh: Universitas Surabaya"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccessMessage("");
              setFormData({
                name: "",
                email: "",
                password: "",
                phoneNumber: "",
                campus: "",
              });
            }}
            className="text-teal-600 hover:text-teal-700 font-medium"
          >
            {isLogin ? "Belum punya akun? Daftar" : "Sudah punya akun? Masuk"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
