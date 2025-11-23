// src/pages/MissionDetail.tsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { orderService } from "@/services/orderService";
import { runnerService } from "@/services/runnerService";
import {
  ArrowLeft,
  User,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  DollarSign,
  Camera,
  Upload,
  CheckCircle,
  Package,
  Truck,
  Loader2,
  Star,
  AlertCircle,
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
  consumer: {
    _id: string;
    name: string;
    phoneNumber: string;
    campus: string;
    whatsappLink: string;
    profilePhoto?: string;
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
}

const MissionDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const fileInput1Ref = useRef<HTMLInputElement>(null);
  const fileInput2Ref = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Upload Proof 1 States
  const [showUpload1Dialog, setShowUpload1Dialog] = useState(false);
  const [photo1Preview, setPhoto1Preview] = useState<string | null>(null);
  const [photo1Base64, setPhoto1Base64] = useState<string>("");
  const [notes1, setNotes1] = useState("");
  const [uploading1, setUploading1] = useState(false);

  // Upload Proof 2 States
  const [showUpload2Dialog, setShowUpload2Dialog] = useState(false);
  const [photo2Preview, setPhoto2Preview] = useState<string | null>(null);
  const [photo2Base64, setPhoto2Base64] = useState<string>("");
  const [notes2, setNotes2] = useState("");
  const [uploading2, setUploading2] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setError("Mission ID tidak ditemukan");
      setLoading(false);
      return;
    }
    fetchMissionDetail();
  }, [orderId]);

  const fetchMissionDetail = async () => {
    if (!orderId) return;

    try {
      const response = await orderService.getOrderDetail(orderId);
      if (response.success) {
        setOrder(response.data);
      }
    } catch (err: any) {
      setError(err.message || "Gagal memuat data misi");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    proofType: 1 | 2
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB");
      return;
    }

    // Read file as base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (proofType === 1) {
        setPhoto1Preview(base64);
        setPhoto1Base64(base64);
        setShowUpload1Dialog(true);
      } else {
        setPhoto2Preview(base64);
        setPhoto2Base64(base64);
        setShowUpload2Dialog(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProof1 = async () => {
    if (!photo1Base64) {
      alert("Silakan pilih foto terlebih dahulu");
      return;
    }

    setUploading1(true);
    try {
      const response = await runnerService.uploadProof1(
        orderId!,
        photo1Base64,
        notes1
      );
      if (response.success) {
        alert("Bukti pembelian berhasil diupload! ✅");
        setShowUpload1Dialog(false);
        setPhoto1Preview(null);
        setPhoto1Base64("");
        setNotes1("");
        await fetchMissionDetail();
      }
    } catch (err: any) {
      alert(err.message || "Gagal upload bukti pembelian");
    } finally {
      setUploading1(false);
    }
  };

  const handleUploadProof2 = async () => {
    if (!photo2Base64) {
      alert("Silakan pilih foto terlebih dahulu");
      return;
    }

    setUploading2(true);
    try {
      const response = await runnerService.uploadProof2(
        orderId!,
        photo2Base64,
        notes2
      );
      if (response.success) {
        alert("Bukti pengantaran berhasil diupload! ✅");
        setShowUpload2Dialog(false);
        setPhoto2Preview(null);
        setPhoto2Base64("");
        setNotes2("");
        await fetchMissionDetail();
      }
    } catch (err: any) {
      alert(err.message || "Gagal upload bukti pengantaran");
    } finally {
      setUploading2(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${parseInt(amount.toString()).toLocaleString("id-ID")}`;
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; color: string; icon: any }
    > = {
      diambil: {
        label: "Diambil - Perlu Beli Barang",
        color: "bg-purple-500",
        icon: Package,
      },
      sudah_dibeli: {
        label: "Sudah Dibeli - Perlu Antar",
        color: "bg-yellow-500",
        icon: Truck,
      },
      sedang_diantar: {
        label: "Sedang Diantar - Tunggu Konfirmasi",
        color: "bg-orange-500",
        icon: Clock,
      },
      selesai: {
        label: "Selesai",
        color: "bg-green-500",
        icon: CheckCircle,
      },
    };
    return statusMap[status] || statusMap.diambil;
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
        <Card className="max-w-2xl mx-auto p-6">
          <p className="text-red-600">{error || "Misi tidak ditemukan"}</p>
          <Button
            onClick={() => navigate("/runner-dashboard")}
            className="mt-4"
          >
            Kembali ke Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(order.status);
  const StatusIcon = statusInfo.icon;
  const canUploadProof1 =
    order.status === "diambil" && !order.workflowProofs.proof1Purchase.photoUrl;
  const canUploadProof2 =
    order.status === "sudah_dibeli" &&
    !order.workflowProofs.proof2Delivery.photoUrl;

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/runner-dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-teal-600">Detail Misi</h1>
        </div>

        {/* Status Card */}
        <Card className="p-6 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-full ${statusInfo.color}`}>
              <StatusIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-lg font-bold text-gray-900">
                {statusInfo.label}
              </p>
            </div>
            {order.isUrgent && <Badge variant="destructive">URGENT</Badge>}
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
                {formatCurrency(order.estimatedItemCost)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Cuan Anda 💰</p>
              <p className="text-2xl font-bold text-teal-800">
                {formatCurrency(order.serviceFeeCuan)}
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
        </Card>

        {/* Consumer Info */}
        <Card className="p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Info Consumer
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
              {order.consumer.profilePhoto ? (
                <img
                  src={order.consumer.profilePhoto}
                  alt={order.consumer.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="h-8 w-8 text-teal-600" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{order.consumer.name}</p>
              <p className="text-sm text-gray-600">{order.consumer.campus}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                {order.consumer.phoneNumber}
              </p>
            </div>
          </div>
          <a
            href={order.consumer.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full bg-green-600 hover:bg-green-700">
              <MessageCircle className="h-4 w-4 mr-2" />
              Chat via WhatsApp
            </Button>
          </a>
        </Card>

        {/* Locations */}
        <Card className="p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Lokasi</h3>
          <div className="space-y-4">
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
            <Separator />
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
        </Card>

        {/* Notes */}
        {order.notes && (
          <Card className="p-6 mb-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Catatan Consumer
            </h3>
            <p className="text-sm text-gray-600">{order.notes}</p>
          </Card>
        )}

        {/* Proof Upload Section */}
        <Card className="p-6 mb-4">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Bukti Foto</h3>

          {/* Proof 1 - Purchase */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-teal-600" />
                <p className="font-semibold text-gray-900">
                  1. Bukti Pembelian/Pengambilan
                </p>
              </div>
              {order.workflowProofs.proof1Purchase.photoUrl && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>

            {order.workflowProofs.proof1Purchase.photoUrl ? (
              <div>
                <img
                  src={order.workflowProofs.proof1Purchase.photoUrl}
                  alt="Bukti pembelian"
                  className="rounded-lg max-w-full h-auto max-h-60 object-cover border-2 border-teal-200 mb-2"
                />
                {order.workflowProofs.proof1Purchase.notes && (
                  <p className="text-sm text-gray-600">
                    📝 {order.workflowProofs.proof1Purchase.notes}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Diupload:{" "}
                  {new Date(
                    order.workflowProofs.proof1Purchase.uploadedAt!
                  ).toLocaleString("id-ID")}
                </p>
              </div>
            ) : canUploadProof1 ? (
              <div>
                <input
                  type="file"
                  ref={fileInput1Ref}
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 1)}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInput1Ref.current?.click()}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Bukti Pembelian
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Upload foto barang yang sudah dibeli
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600 text-sm">
                Belum bisa upload bukti pembelian
              </div>
            )}
          </div>

          <Separator className="my-4" />

          {/* Proof 2 - Delivery */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <p className="font-semibold text-gray-900">
                  2. Bukti Pengantaran
                </p>
              </div>
              {order.workflowProofs.proof2Delivery.photoUrl && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
            </div>

            {order.workflowProofs.proof2Delivery.photoUrl ? (
              <div>
                <img
                  src={order.workflowProofs.proof2Delivery.photoUrl}
                  alt="Bukti pengantaran"
                  className="rounded-lg max-w-full h-auto max-h-60 object-cover border-2 border-orange-200 mb-2"
                />
                {order.workflowProofs.proof2Delivery.notes && (
                  <p className="text-sm text-gray-600">
                    📝 {order.workflowProofs.proof2Delivery.notes}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Diupload:{" "}
                  {new Date(
                    order.workflowProofs.proof2Delivery.uploadedAt!
                  ).toLocaleString("id-ID")}
                </p>
              </div>
            ) : canUploadProof2 ? (
              <div>
                <input
                  type="file"
                  ref={fileInput2Ref}
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, 2)}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInput2Ref.current?.click()}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Upload Bukti Pengantaran
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Upload foto saat handover ke consumer
                </p>
              </div>
            ) : (
              <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-600 text-sm">
                {!order.workflowProofs.proof1Purchase.photoUrl
                  ? "Upload bukti pembelian terlebih dahulu"
                  : "Belum bisa upload bukti pengantaran"}
              </div>
            )}
          </div>
        </Card>

        {/* Status sedang_diantar */}
        {order.status === "sedang_diantar" && (
          <Card className="p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 mb-1">
                  Menunggu Konfirmasi Consumer
                </p>
                <p className="text-sm text-blue-700">
                  Consumer akan konfirmasi penerimaan barang. Setelah itu, cuan
                  Anda akan masuk!
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Status selesai */}
        {order.status === "selesai" && (
          <Card className="p-6 bg-green-50 border-green-200">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900 mb-1">
                  Misi Selesai! 🎉
                </p>
                <p className="text-sm text-green-700">
                  Cuan sebesar {formatCurrency(order.serviceFeeCuan)} sudah
                  masuk ke statistik Anda!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Upload Proof 1 Dialog */}
      <Dialog open={showUpload1Dialog} onOpenChange={setShowUpload1Dialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Bukti Pembelian</DialogTitle>
            <DialogDescription>
              Upload foto barang yang sudah dibeli
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {photo1Preview && (
              <img
                src={photo1Preview}
                alt="Preview"
                className="w-full rounded-lg border-2 border-teal-200"
              />
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Catatan (opsional)
              </label>
              <Textarea
                placeholder="Contoh: Nasi goreng sudah dibeli"
                value={notes1}
                onChange={(e) => setNotes1(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUpload1Dialog(false);
                setPhoto1Preview(null);
                setPhoto1Base64("");
                setNotes1("");
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleUploadProof1}
              disabled={uploading1}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {uploading1 ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Proof 2 Dialog */}
      <Dialog open={showUpload2Dialog} onOpenChange={setShowUpload2Dialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Bukti Pengantaran</DialogTitle>
            <DialogDescription>
              Upload foto saat handover ke consumer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {photo2Preview && (
              <img
                src={photo2Preview}
                alt="Preview"
                className="w-full rounded-lg border-2 border-orange-200"
              />
            )}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Catatan (opsional)
              </label>
              <Textarea
                placeholder="Contoh: Makanan sudah diantar ke Ahmad"
                value={notes2}
                onChange={(e) => setNotes2(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUpload2Dialog(false);
                setPhoto2Preview(null);
                setPhoto2Base64("");
                setNotes2("");
              }}
            >
              Batal
            </Button>
            <Button
              onClick={handleUploadProof2}
              disabled={uploading2}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {uploading2 ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MissionDetail;
