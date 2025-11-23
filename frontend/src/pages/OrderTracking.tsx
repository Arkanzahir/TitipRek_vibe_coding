// src/pages/OrderTracking.tsx
import { useState, useEffect } from "react";
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
import { orderService } from "@/services/orderService";
import {
  MapPin,
  Clock,
  DollarSign,
  User,
  Phone,
  MessageCircle,
  CheckCircle,
  Package,
  Truck,
  Star,
  AlertCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";

interface Order {
  _id: string;
  title: string;
  description: string;
  orderType: string;
  estimatedItemCost: number;
  serviceFeeCuan: number;
  totalCost: number;
  status: string;
  pickupLocation: {
    name: string;
    address: string;
  };
  deliveryLocation: {
    name: string;
    address: string;
  };
  deadline: string;
  notes: string;
  isUrgent: boolean;
  runner?: {
    _id: string;
    name: string;
    phoneNumber: string;
    campus: string;
    whatsappLink: string;
    profilePhoto?: string;
    runnerStats: {
      averageRating: number;
      totalReviews: number;
      completedMissions: number;
    };
  };
  workflowProofs: {
    proof1Purchase: {
      photoUrl?: string;
      uploadedAt?: string;
      notes?: string;
    };
    proof2Delivery: {
      photoUrl?: string;
      uploadedAt?: string;
      notes?: string;
    };
  };
  createdAt: string;
  takenAt?: string;
  rating?: {
    stars: number;
    comment: string;
  };
}

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("Order ID tidak ditemukan");
      setLoading(false);
      return;
    }
    fetchOrderDetail();
    const interval = setInterval(fetchOrderDetail, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [orderId]);

  const fetchOrderDetail = async () => {
    if (!orderId) return;

    try {
      const response = await orderService.getOrderDetail(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data pesanan");
    } finally {
      setLoading(false);
    }
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
      alert(err.message || "Gagal konfirmasi pesanan");
    } finally {
      setConfirming(false);
    }
  };

  const handleSubmitRating = async () => {
    if (rating === 0) {
      alert("Silakan pilih rating bintang");
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
        alert("Terima kasih atas rating Anda! ⭐");
      }
    } catch (err: any) {
      alert(err.message || "Gagal memberikan rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: any }
    > = {
      terbuka: {
        label: "Menunggu Runner",
        color: "bg-blue-500",
        icon: Clock,
      },
      diambil: {
        label: "Diambil Runner",
        color: "bg-purple-500",
        icon: User,
      },
      sudah_dibeli: {
        label: "Barang Sudah Dibeli",
        color: "bg-yellow-500",
        icon: Package,
      },
      sedang_diantar: {
        label: "Sedang Diantar",
        color: "bg-orange-500",
        icon: Truck,
      },
      selesai: {
        label: "Selesai",
        color: "bg-green-500",
        icon: CheckCircle,
      },
      dibatalkan: {
        label: "Dibatalkan",
        color: "bg-red-500",
        icon: AlertCircle,
      },
    };
    return statusMap[status] || statusMap.terbuka;
  };

  const formatCurrency = (amount: any) => {
    if (!amount) return "0";

    let numAmount: number;

    // Handle different types of amount from MongoDB
    if (typeof amount === "object" && amount.$numberDecimal) {
      // Decimal128 with $numberDecimal property
      numAmount = parseFloat(amount.$numberDecimal);
    } else if (typeof amount === "number") {
      // Already a number
      numAmount = amount;
    } else if (typeof amount === "string") {
      // String number
      numAmount = parseFloat(amount);
    } else if (amount.toString) {
      // Has toString method (Decimal128 object)
      numAmount = parseFloat(amount.toString());
    } else {
      numAmount = 0;
    }

    return numAmount.toLocaleString("id-ID");
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        label: "Pesanan Dibuat",
        time: order?.createdAt,
        completed: true,
      },
      {
        label: "Diambil Runner",
        time: order?.takenAt,
        completed: order?.status !== "terbuka",
        runner: order?.runner,
      },
      {
        label: "Barang Dibeli",
        time: order?.workflowProofs.proof1Purchase.uploadedAt,
        completed: !!order?.workflowProofs.proof1Purchase.photoUrl,
        photo: order?.workflowProofs.proof1Purchase.photoUrl,
        notes: order?.workflowProofs.proof1Purchase.notes,
      },
      {
        label: "Sedang Diantar",
        time: order?.workflowProofs.proof2Delivery.uploadedAt,
        completed: !!order?.workflowProofs.proof2Delivery.photoUrl,
        photo: order?.workflowProofs.proof2Delivery.photoUrl,
        notes: order?.workflowProofs.proof2Delivery.notes,
      },
      {
        label: "Selesai",
        time:
          order?.status === "selesai"
            ? order?.workflowProofs.proof2Delivery.uploadedAt
            : undefined,
        completed: order?.status === "selesai",
      },
    ];
    return steps;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-6">
          <p className="text-red-600">{error || "Pesanan tidak ditemukan"}</p>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-teal-600">Tracking Pesanan</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${statusInfo.color}`}>
                <StatusIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="text-lg font-bold text-gray-900">
                  {statusInfo.label}
                </p>
              </div>
            </div>
            {order.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                URGENT
              </Badge>
            )}
          </div>

          <Separator className="my-4" />

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {order.title}
          </h2>
          <p className="text-gray-600 text-sm mb-4">{order.description}</p>

          {/* Financial Info */}
          <div className="grid grid-cols-2 gap-4 bg-teal-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-600">Dana Talangan</p>
              <p className="text-lg font-bold text-teal-700">
                Rp {formatCurrency(order.estimatedItemCost)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Biaya Jasa</p>
              <p className="text-lg font-bold text-teal-700">
                Rp {formatCurrency(order.serviceFeeCuan)}
              </p>
            </div>
            <div className="col-span-2 pt-2 border-t border-teal-200">
              <p className="text-sm text-gray-600">Total Biaya</p>
              <p className="text-2xl font-bold text-teal-800">
                Rp{" "}
                {formatCurrency(
                  parseFloat(order.estimatedItemCost?.toString() || "0") +
                    parseFloat(order.serviceFeeCuan?.toString() || "0")
                )}
              </p>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>
              Deadline:{" "}
              {new Date(order.deadline).toLocaleString("id-ID", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        </div>

        {/* Runner Info (if taken) */}
        {order.runner && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Info Runner
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                {order.runner.profilePhoto ? (
                  <img
                    src={order.runner.profilePhoto}
                    alt={order.runner.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-teal-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{order.runner.name}</p>
                <p className="text-sm text-gray-600">{order.runner.campus}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-semibold">
                    {order.runner.runnerStats.averageRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({order.runner.runnerStats.totalReviews} review)
                  </span>
                </div>
              </div>
            </div>
            <a
              href={order.runner.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat via WhatsApp
              </Button>
            </a>
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-6">
            {getTimelineSteps().map((step, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
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
                      className={`w-0.5 h-full min-h-[40px] ${
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
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(step.time).toLocaleString("id-ID", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  )}
                  {step.photo && (
                    <div className="mt-2">
                      <img
                        src={step.photo}
                        alt="Bukti foto"
                        className="rounded-lg max-w-full h-auto max-h-60 object-cover border-2 border-teal-200"
                      />
                      {step.notes && (
                        <p className="text-sm text-gray-600 mt-2">
                          📝 {step.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locations */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Lokasi</h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Lokasi Pengambilan
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {order.pickupLocation.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {order.pickupLocation.address}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Lokasi Pengantaran
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {order.deliveryLocation.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {order.deliveryLocation.address}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Catatan</h3>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </div>
        )}

        {/* Confirm Complete Button */}
        {order.status === "sedang_diantar" && !order.rating && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
            <div className="max-w-2xl mx-auto">
              <Button
                onClick={() => setShowConfirmDialog(true)}
                className="w-full bg-green-600 hover:bg-green-700 h-12 text-base font-semibold"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
                Konfirmasi Pesanan Diterima
              </Button>
            </div>
          </div>
        )}

        {/* Show Rating if Already Rated */}
        {order.rating && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
              Rating Anda
            </h3>
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 ${
                    star <= order.rating!.stars
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            {order.rating.comment && (
              <p className="text-sm text-gray-600 mt-2">
                "{order.rating.comment}"
              </p>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penerimaan</DialogTitle>
            <DialogDescription>
              Apakah pesanan sudah diterima dengan baik?
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
              className="bg-green-600 hover:bg-green-700"
            >
              {confirming ? "Memproses..." : "Ya, Sudah Terima"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beri Rating Runner</DialogTitle>
            <DialogDescription>
              Bagaimana pengalaman Anda dengan runner?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= rating
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Tulis komentar Anda (opsional)"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRatingDialog(false)}
            >
              Lewati
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={submittingRating || rating === 0}
              className="bg-teal-600 hover:bg-teal-700"
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
