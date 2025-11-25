// src/pages/CreateOrder.tsx
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Loader2, Upload } from "lucide-react"; // 🔥 Import ArrowLeft
import { orderService } from "@/services/orderService";

const CreateOrder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultType =
    searchParams.get("type") === "logistik" ? "jasa" : "makanan";

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orderType: defaultType,
    title: "",
    description: "",
    estimatedItemCost: "",
    serviceFeeCuan: "",
    pickupLocation: "",
    pickupAddress: "",
    deliveryLocation: "",
    deliveryAddress: "",
    deadlineDate: "",
    deadlineTime: "",
    notes: "",
  });

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, orderType: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Gabungkan date & time untuk deadline
      const deadline = new Date(
        `${formData.deadlineDate}T${formData.deadlineTime}`
      );

      const payload = {
        orderType: formData.orderType,
        title: formData.title,
        description: formData.description,
        estimatedItemCost: parseInt(formData.estimatedItemCost),
        serviceFeeCuan: parseInt(formData.serviceFeeCuan),
        pickupLocation: {
          name: formData.pickupLocation,
          address: formData.pickupAddress,
        },
        deliveryLocation: {
          name: formData.deliveryLocation,
          address: formData.deliveryAddress,
        },
        deadline: deadline.toISOString(),
        notes: formData.notes,
        isUrgent: false, // Bisa ditambah toggle nanti
      };

      const response = await orderService.createOrder(payload);

      if (response.success) {
        alert("Pesanan berhasil dibuat!");
        navigate("/dashboard"); // Balik ke dashboard setelah sukses
      } else {
        alert("Gagal membuat pesanan: " + response.message);
      }
    } catch (error: any) {
      console.error(error);
      alert("Terjadi kesalahan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
        {/* 🔥 HEADER DENGAN TOMBOL KEMBALI 🔥 */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700" />
          </Button>
          <h1 className="text-2xl font-bold text-teal-600">
            Buat Pesanan Baru
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipe Pesanan */}
          <div className="space-y-2">
            <Label>Tipe Pesanan *</Label>
            <Select
              defaultValue={formData.orderType}
              onValueChange={handleSelectChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="makanan">Makanan/Minuman</SelectItem>
                <SelectItem value="jasa">Jasa/Logistik</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Detail Utama */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Pesanan * (min 5 karakter)</Label>
            <Input
              id="title"
              placeholder="Contoh: Nasi Goreng Spesial Bu Sri"
              value={formData.title}
              onChange={handleChange}
              required
              minLength={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi * (min 10 karakter)</Label>
            <Textarea
              id="description"
              placeholder="Detail pesanan, varian, dll"
              value={formData.description}
              onChange={handleChange}
              required
              minLength={10}
            />
          </div>

          {/* Biaya */}
          <div className="p-4 bg-teal-50 rounded-lg space-y-4 border border-teal-100">
            <h3 className="font-bold text-teal-800">Rincian Biaya</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedItemCost">
                  Estimasi Harga Barang (Rp)*
                </Label>
                <Input
                  id="estimatedItemCost"
                  type="number"
                  placeholder="15000"
                  value={formData.estimatedItemCost}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceFeeCuan">Tip Runner (Cuan) (Rp)*</Label>
                <Input
                  id="serviceFeeCuan"
                  type="number"
                  placeholder="5000"
                  value={formData.serviceFeeCuan}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Lokasi */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Lokasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickupLocation">Nama Lokasi Ambil *</Label>
                <Input
                  id="pickupLocation"
                  placeholder="Contoh: Kantin Pusat"
                  value={formData.pickupLocation}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickupAddress">Detail Alamat Ambil *</Label>
                <Input
                  id="pickupAddress"
                  placeholder="Lantai 1, Stan No. 3"
                  value={formData.pickupAddress}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryLocation">Nama Lokasi Antar *</Label>
                <Input
                  id="deliveryLocation"
                  placeholder="Contoh: Gedung Kuliah A"
                  value={formData.deliveryLocation}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryAddress">Detail Alamat Antar *</Label>
                <Input
                  id="deliveryAddress"
                  placeholder="Ruang A-102"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Batas Waktu (Deadline) *</Label>
            <div className="flex gap-4">
              <Input
                id="deadlineDate"
                type="date"
                value={formData.deadlineDate}
                onChange={handleChange}
                required
                className="flex-1"
              />
              <Input
                id="deadlineTime"
                type="time"
                value={formData.deadlineTime}
                onChange={handleChange}
                required
                className="w-32"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan Tambahan (Opsional)</Label>
            <Textarea
              id="notes"
              placeholder="Jangan terlalu pedas, minta sendok plastik..."
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-lg h-12 font-bold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
              </>
            ) : (
              "Buat Pesanan Sekarang"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
