// src/pages/OrderTracking.tsx - FINAL FIX IMAGE & UPLOAD
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { orderService } from "@/services/orderService";
import { authService } from "@/services/authService";
import { runnerService } from "@/services/runnerService";
import {
  MapPin,
  Clock,
  User,
  MessageCircle,
  CheckCircle,
  Star,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Camera,
  Upload,
} from "lucide-react";

// URL Backend Produksi
const API_URL = "https://titip-rek-vibe-coding.vercel.app";

interface Order {
  _id: string;
  title: string;
  description: string;
  status: string;
  estimatedItemCost: any;
  serviceFeeCuan: any;
  deadline: string;
  pickupLocation: { name: string; address: string };
  deliveryLocation: { name: string; address: string };
  notes: string;
  isUrgent: boolean;
  runner?: {
    _id: string;
    id?: string;
    name: string;
    campus: string;
    profilePhoto?: string;
    whatsappLink: string;
    runnerStats: { averageRating: number; totalReviews: number };
  };
  consumer: {
    name: string;
    profilePhoto?: string;
    whatsappLink?: string;
  };
  workflowProofs: {
    proof1Purchase: { photoUrl?: string; uploadedAt?: string; notes?: string };
    proof2Delivery: { photoUrl?: string; uploadedAt?: string; notes?: string };
  };
  createdAt: string;
  takenAt?: string;
  rating?: { stars: number; comment: string };
}

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = authService.getUser();

  useEffect(() => {
    if (!orderId) {
      setError("Order ID tidak ditemukan");
      return;
    }
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      const response = await orderService.getOrderDetail(orderId!);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    const isMyMission =
      order?.runner?._id === currentUser?.id ||
      order?.runner?.id === currentUser?.id;
    if (isMyMission) {
      navigate("/runner-dashboard");
    } else {
      navigate("/dashboard");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file terlalu besar (Max 5MB)");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        let response;
        if (order.status === "diambil") {
          response = await runnerService.uploadProof1(
            order._id,
            base64String,
            "Bukti Pembelian"
          );
        } else if (order.status === "sudah_dibeli") {
          response = await runnerService.uploadProof2(
            order._id,
            base64String,
            "Bukti Pengantaran"
          );
        }

        if (response?.success) {
          alert("Bukti berhasil diupload! ✅");
          fetchOrderDetail();
        } else {
          alert("Gagal upload: " + response?.message);
        }
      } catch (error) {
        alert("Terjadi kesalahan saat upload");
      } finally {
        setUploading(false);
      }
    };
  };

  const handleConfirmComplete = async () => {
    setConfirming(true);
    try {
      const response = await orderService.confirmComplete(orderId!);
      if (response.success) {
        await fetchOrderDetail();
        setShowConfirmDialog(false);
        setShowRatingDialog(true);
      }
    } catch (err: any) {
      alert(err.message || "Gagal konfirmasi");
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert("Pilih bintang dulu");
      return;
    }
    setSubmittingRating(true);
    try {
      const response = await orderService.rateOrder(
        orderId!,
        rating,
        ratingComment
      );
      if (response.success) {
        await fetchOrderDetail();
        setShowRatingDialog(false);
        alert("Pesanan Selesai! Terima kasih ⭐");
        navigate("/order-history");
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingRating(false);
    }
  };

  const formatCurrency = (amount: any) => {
    if (!amount) return "0";
    let num = parseFloat(amount.toString());
    if (amount.$numberDecimal) num = parseFloat(amount.$numberDecimal);
    return num.toLocaleString("id-ID");
  };

  // 🔥 FUNGSI SMART IMAGE URL (Biar Gak Pecah) 🔥
  const getImageSrc = (photoData: string) => {
    if (!photoData) return "";
    // Kalau Base64 (Data Gambar Langsung), pakai langsung
    if (photoData.startsWith("data:")) return photoData;
    // Kalau URL lengkap (http...), pakai langsung
    if (photoData.startsWith("http")) return photoData;
    // Kalau path file (/uploads...), gabung dengan URL Backend
    return `${API_URL}${photoData}`;
  };

  const getTimelineSteps = () => {
    if (!order) return [];
    return [
      { label: "Pesanan Dibuat", time: order.createdAt, completed: true },
      {
        label: "Diambil Runner",
        time: order.takenAt,
        completed: order.status !== "terbuka",
      },
      {
        label: "Barang Dibeli",
        time: order.workflowProofs.proof1Purchase.uploadedAt,
        completed: !!order.workflowProofs.proof1Purchase.photoUrl,
        photo: order.workflowProofs.proof1Purchase.photoUrl,
      },
      {
        label: "Sedang Diantar",
        time: order.workflowProofs.proof2Delivery.uploadedAt,
        completed: !!order.workflowProofs.proof2Delivery.photoUrl,
        photo: order.workflowProofs.proof2Delivery.photoUrl,
      },
      {
        label: "Selesai",
        time:
          order.status === "selesai"
            ? order.workflowProofs.proof2Delivery.uploadedAt
            : undefined,
        completed: order.status === "selesai",
      },
    ];
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" />
      </div>
    );
  if (!order)
    return <div className="text-center py-20">Pesanan tidak ditemukan</div>;

  const isMyMission =
    order.runner?._id === currentUser?.id ||
    order.runner?.id === currentUser?.id;
  const showUploadAction =
    isMyMission &&
    (order.status === "diambil" || order.status === "sudah_dibeli");
  const showConfirmButton = !isMyMission && order.status === "sedang_diantar";
  const showRateButton =
    !isMyMission &&
    order.status === "selesai" &&
    (!order.rating || !order.rating.stars);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold text-gray-800">Tracking Pesanan</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <Badge className="bg-teal-600 text-white">
              {order.status.replace("_", " ").toUpperCase()}
            </Badge>
            {order.isUrgent && <Badge variant="destructive">URGENT</Badge>}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {order.title}
          </h2>
          <p className="text-gray-600 text-sm mb-4">{order.description}</p>
          <div className="grid grid-cols-2 gap-4 bg-teal-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Dana Talangan</p>
              <p className="text-lg font-bold text-teal-700">
                Rp {formatCurrency(order.estimatedItemCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Jasa Runner</p>
              <p className="text-lg font-bold text-teal-700">
                Rp {formatCurrency(order.serviceFeeCuan)}
              </p>
            </div>
          </div>
        </div>

        {showUploadAction && (
          <Card className="mb-4 border-orange-200 bg-orange-50 shadow-md p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-orange-600" />
              <div className="w-full">
                <h3 className="font-bold text-orange-800">Aksi Diperlukan</h3>
                <p className="text-sm text-orange-700 mb-3">
                  Upload foto bukti{" "}
                  {order.status === "diambil" ? "pembelian" : "pengantaran"}.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                >
                  {uploading ? (
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  ) : (
                    <Camera className="mr-2 h-4 w-4" />
                  )}{" "}
                  Upload Bukti
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-6">
            {getTimelineSteps().map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step.completed
                        ? "bg-teal-500 text-white"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  {index < getTimelineSteps().length - 1 && (
                    <div
                      className={`w-0.5 h-full min-h-[30px] ${
                        step.completed ? "bg-teal-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 pb-6">
                  <p
                    className={`font-semibold ${
                      step.completed ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.time && (
                    <p className="text-xs text-gray-500">
                      {new Date(step.time).toLocaleString()}
                    </p>
                  )}

                  {/* 🔥 MENAMPILKAN GAMBAR BUKTI (ANTI PECAH) 🔥 */}
                  {step.photo && (
                    <div className="mt-2">
                      <img
                        src={getImageSrc(step.photo)}
                        alt="Bukti"
                        className="rounded-lg h-32 w-auto object-cover border border-gray-200 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://placehold.co/400x300?text=No+Image";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-teal-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">
                Ambil
              </span>
            </div>
            <p className="font-semibold">{order.pickupLocation.name}</p>
          </div>
          <Separator />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-orange-600" />
              <span className="text-xs font-bold text-gray-500 uppercase">
                Antar
              </span>
            </div>
            <p className="font-semibold">{order.deliveryLocation.name}</p>
          </div>
        </div>

        {showConfirmButton && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-5px_10px_rgba(0,0,0,0.1)] z-50">
            <div className="max-w-2xl mx-auto">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-bold shadow-lg"
              >
                <CheckCircle className="h-5 w-5 mr-2" /> Konfirmasi Pesanan
                Diterima
              </Button>
            </div>
          </div>
        )}

        {showRateButton && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-5px_10px_rgba(0,0,0,0.1)] z-50">
            <div className="max-w-2xl mx-auto">
              <Button
                onClick={() => setShowRatingDialog(true)}
                className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-base font-bold shadow-lg"
              >
                <Star className="h-5 w-5 mr-2" /> Beri Rating Runner
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penerimaan</DialogTitle>
            <DialogDescription>
              Pesanan sudah diterima dengan baik?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Belum
            </Button>
            <Button
              onClick={handleConfirmComplete}
              disabled={confirming}
              className="bg-green-600 text-white"
            >
              {confirming ? "Memproses..." : "Ya, Sudah Terima"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beri Rating Runner</DialogTitle>
            <DialogDescription>Gimana kinerja runnernya?</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-center">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} onClick={() => setRating(star)}>
                  <Star
                    className={`h-8 w-8 ${
                      star <= rating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Tulis komentar..."
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <DialogFooter>
            <Button
              onClick={handleSubmitRating}
              disabled={submittingRating || rating === 0}
              className="bg-teal-600 text-white"
            >
              {submittingRating ? "Mengirim..." : "Kirim Rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderTracking;
