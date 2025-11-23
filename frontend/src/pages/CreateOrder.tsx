// src/pages/CreateOrder.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { orderService } from "@/services/orderService";

const CreateOrder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    orderType: "makanan",
    title: "",
    description: "",
    estimatedItemCost: "",
    serviceFeeCuan: "",
    pickupLocation: {
      name: "",
      address: "",
    },
    deliveryLocation: {
      name: "",
      address: "",
    },
    deadline: "",
    notes: "",
    isUrgent: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      // Handle nested objects (pickupLocation, deliveryLocation)
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    if (error) setError("");
  };

  const validateForm = () => {
    if (!formData.title || formData.title.length < 5) {
      setError("Judul minimal 5 karakter");
      return false;
    }
    if (!formData.description || formData.description.length < 10) {
      setError("Deskripsi minimal 10 karakter");
      return false;
    }
    if (
      !formData.estimatedItemCost ||
      parseFloat(formData.estimatedItemCost) <= 0
    ) {
      setError("Estimasi dana talangan harus diisi dengan benar");
      return false;
    }
    if (!formData.serviceFeeCuan || parseFloat(formData.serviceFeeCuan) <= 0) {
      setError("Biaya jasa runner harus diisi dengan benar");
      return false;
    }
    if (!formData.pickupLocation.name || !formData.pickupLocation.address) {
      setError("Lokasi pengambilan harus diisi lengkap");
      return false;
    }
    if (!formData.deliveryLocation.name || !formData.deliveryLocation.address) {
      setError("Lokasi pengantaran harus diisi lengkap");
      return false;
    }
    if (!formData.deadline) {
      setError("Deadline harus diisi");
      return false;
    }

    // Validate deadline is in future
    if (new Date(formData.deadline) <= new Date()) {
      setError("Deadline harus di masa depan");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // Prepare data sesuai dengan backend model
      const orderData = {
        ...formData,
        estimatedItemCost: parseFloat(formData.estimatedItemCost),
        serviceFeeCuan: parseFloat(formData.serviceFeeCuan),
        deadline: new Date(formData.deadline).toISOString(),
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        alert("Pesanan berhasil dibuat!");
        navigate(`/order-tracking/${response.data._id}`);
      } else {
        setError(response.message || "Gagal membuat pesanan");
      }
    } catch (err) {
      console.error("Create Order Error:", err);
      setError(err.message || "Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const totalCost =
    (parseFloat(formData.estimatedItemCost) || 0) +
    (parseFloat(formData.serviceFeeCuan) || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-teal-600 mb-6">
          Buat Pesanan Baru
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipe Pesanan *
            </label>
            <select
              name="orderType"
              value={formData.orderType}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="makanan">Makanan/Minuman</option>
              <option value="jasa">Jasa Titip</option>
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judul Pesanan * (min 5 karakter)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Contoh: Nasi Goreng Spesial Bu Sri"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi * (min 10 karakter)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Detail pesanan, varian, dll"
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Financial Separation */}
          <div className="bg-teal-50 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-teal-800">Rincian Biaya</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimasi Dana Talangan Barang * (Rp)
              </label>
              <input
                type="number"
                name="estimatedItemCost"
                value={formData.estimatedItemCost}
                onChange={handleChange}
                placeholder="15000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biaya Jasa Runner (Cuan) * (Rp)
              </label>
              <input
                type="number"
                name="serviceFeeCuan"
                value={formData.serviceFeeCuan}
                onChange={handleChange}
                placeholder="5000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-2 border-t border-teal-200">
              <p className="text-lg font-bold text-teal-800">
                Total: Rp {totalCost.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Pickup Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">
              Lokasi Pengambilan *
            </h3>
            <input
              type="text"
              name="pickupLocation.name"
              value={formData.pickupLocation.name}
              onChange={handleChange}
              placeholder="Nama tempat (contoh: Warung Bu Sri)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="pickupLocation.address"
              value={formData.pickupLocation.address}
              onChange={handleChange}
              placeholder="Alamat lengkap"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Delivery Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">
              Lokasi Pengantaran *
            </h3>
            <input
              type="text"
              name="deliveryLocation.name"
              value={formData.deliveryLocation.name}
              onChange={handleChange}
              placeholder="Nama tempat (contoh: Gedung A)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="text"
              name="deliveryLocation.address"
              value={formData.deliveryLocation.address}
              onChange={handleChange}
              placeholder="Alamat lengkap (contoh: Lantai 3, Ruang 302)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deadline *
            </label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan Tambahan
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Catatan khusus untuk runner"
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Urgent Flag */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isUrgent"
              checked={formData.isUrgent}
              onChange={handleChange}
              className="w-5 h-5 text-teal-500 rounded focus:ring-2 focus:ring-teal-500"
            />
            <label className="ml-3 text-sm font-medium text-gray-700">
              Tandai sebagai pesanan mendesak
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Memproses..." : "Buat Pesanan"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
