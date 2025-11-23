// src/pages/RunnerDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { runnerService } from "@/services/runnerService";
import { authService } from "@/services/authService";
import {
  TrendingUp,
  Award,
  DollarSign,
  Package,
  Clock,
  MapPin,
  User,
  MessageCircle,
  Star,
  CheckCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Upload,
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
  consumer?: {
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

interface RunnerStats {
  totalMissions: number;
  completedMissions: number;
  canceledMissions: number;
  averageRating: number;
  totalReviews: number;
  totalEarnings: number;
  completionRate: number;
}

const RunnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tersedia");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RunnerStats | null>(null);
  const [availableMissions, setAvailableMissions] = useState<Order[]>([]);
  const [activeMissions, setActiveMissions] = useState<Order[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Order[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [takingMission, setTakingMission] = useState<string | null>(null);

  useEffect(() => {
    checkVerification();
  }, []);

  useEffect(() => {
    if (verificationStatus?.canTakeMissions) {
      fetchAllData();
    }
  }, [verificationStatus, activeTab]);

  const checkVerification = async () => {
    try {
      const response = await runnerService.getVerificationStatus();
      setVerificationStatus(response.data);

      if (!response.data.canTakeMissions) {
        // Redirect to activation if not verified
        navigate("/runner-activation");
      }
    } catch (error) {
      console.error("Verification check error:", error);
      navigate("/runner-activation");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllData = async () => {
    try {
      // Fetch stats
      const statsResponse = await runnerService.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Fetch missions based on active tab
      if (activeTab === "tersedia") {
        const missionsResponse = await runnerService.getAvailableMissions({
          sortBy: "deadline",
        });
        if (missionsResponse.success) {
          setAvailableMissions(missionsResponse.data);
        }
      } else if (activeTab === "aktif") {
        const activeMissionsResponse = await runnerService.getMyMissions(
          "active"
        );
        if (activeMissionsResponse.success) {
          setActiveMissions(activeMissionsResponse.data);
        }
      } else if (activeTab === "riwayat") {
        const completedMissionsResponse = await runnerService.getMyMissions(
          "completed"
        );
        if (completedMissionsResponse.success) {
          setCompletedMissions(completedMissionsResponse.data);
        }
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    }
  };

  const handleTakeMission = async (orderId: string) => {
    if (!window.confirm("Yakin ingin mengambil misi ini?")) return;

    setTakingMission(orderId);
    try {
      const response = await runnerService.takeMission(orderId);
      if (response.success) {
        alert("Misi berhasil diambil! 🎉");
        // Refresh data
        await fetchAllData();
        // Switch to active tab
        setActiveTab("aktif");
      }
    } catch (error: any) {
      alert(error.message || "Gagal mengambil misi");
    } finally {
      setTakingMission(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${parseInt(amount.toString()).toLocaleString("id-ID")}`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      terbuka: { label: "Tersedia", variant: "default" },
      diambil: { label: "Diambil", variant: "secondary" },
      sudah_dibeli: { label: "Sudah Dibeli", variant: "default" },
      sedang_diantar: { label: "Sedang Diantar", variant: "default" },
      selesai: { label: "Selesai", variant: "default" },
    };
    const info = statusMap[status] || statusMap.terbuka;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff < 0) return "Expired";

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours < 1) return `${minutes} menit lagi`;
    if (hours < 24) return `${hours} jam lagi`;
    const days = Math.floor(hours / 24);
    return `${days} hari lagi`;
  };

  const MissionCard = ({
    order,
    showActions = false,
  }: {
    order: Order;
    showActions?: boolean;
  }) => (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => {
        if (order.status !== "terbuka") {
          navigate(`/mission-detail/${order._id}`);
        }
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900">{order.title}</h3>
            {order.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                URGENT
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">
            {order.description}
          </p>
        </div>
        {getStatusBadge(order.status)}
      </div>

      <div className="space-y-2 text-sm">
        {/* Consumer Info (for active missions) */}
        {order.consumer && (
          <div className="flex items-center gap-2 text-gray-700">
            <User className="h-4 w-4" />
            <span>
              {order.consumer.name} ({order.consumer.campus})
            </span>
          </div>
        )}

        {/* Locations */}
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin className="h-4 w-4 mt-0.5 text-teal-600" />
          <span className="text-xs">{order.pickupLocation.name}</span>
        </div>
        <div className="flex items-start gap-2 text-gray-700">
          <MapPin className="h-4 w-4 mt-0.5 text-orange-600" />
          <span className="text-xs">{order.deliveryLocation.name}</span>
        </div>

        {/* Deadline */}
        <div className="flex items-center gap-2 text-gray-700">
          <Clock className="h-4 w-4" />
          <span className="text-xs">
            {getTimeRemaining(order.deadline)} •{" "}
            {new Date(order.deadline).toLocaleString("id-ID", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </span>
        </div>
      </div>

      <Separator className="my-3" />

      {/* Financial Info */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-600">Dana Talangan</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(order.estimatedItemCost)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Cuan Runner 💰</p>
          <p className="text-lg font-bold text-teal-600">
            {formatCurrency(order.serviceFeeCuan)}
          </p>
        </div>
      </div>

      {/* Actions */}
      {showActions && order.status === "terbuka" && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleTakeMission(order._id);
          }}
          disabled={takingMission === order._id}
          className="w-full mt-3 bg-teal-600 hover:bg-teal-700"
        >
          {takingMission === order._id ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Mengambil...
            </>
          ) : (
            "Ambil Misi"
          )}
        </Button>
      )}

      {/* Upload Status (for active missions) */}
      {order.status === "diambil" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
          <AlertCircle className="h-4 w-4" />
          <span>Perlu upload bukti pembelian</span>
        </div>
      )}
      {order.status === "sudah_dibeli" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-orange-600">
          <AlertCircle className="h-4 w-4" />
          <span>Perlu upload bukti pengantaran</span>
        </div>
      )}
      {order.status === "sedang_diantar" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
          <Clock className="h-4 w-4" />
          <span>Menunggu konfirmasi consumer</span>
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-teal-600">
              Runner Dashboard
            </h1>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="p-3 bg-gradient-to-br from-teal-50 to-teal-100">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-teal-600" />
                  <p className="text-xs text-gray-600">Total Misi</p>
                </div>
                <p className="text-2xl font-bold text-teal-700">
                  {stats.totalMissions}
                </p>
              </Card>

              <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-gray-600">Selesai</p>
                </div>
                <p className="text-2xl font-bold text-green-700">
                  {stats.completedMissions}
                </p>
              </Card>

              <Card className="p-3 bg-gradient-to-br from-yellow-50 to-yellow-100">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-4 w-4 text-yellow-600" />
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
                <p className="text-2xl font-bold text-yellow-700">
                  {stats.averageRating.toFixed(1)} ⭐
                </p>
                <p className="text-xs text-gray-600">
                  {stats.totalReviews} review
                </p>
              </Card>

              <Card className="p-3 bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-gray-600">Total Cuan</p>
                </div>
                <p className="text-lg font-bold text-blue-700">
                  {formatCurrency(stats.totalEarnings)}
                </p>
              </Card>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tersedia">Misi Tersedia</TabsTrigger>
              <TabsTrigger value="aktif">
                Misi Aktif
                {activeMissions.length > 0 && (
                  <Badge className="ml-2 bg-teal-600">
                    {activeMissions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="riwayat">Riwayat</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab}>
          {/* Misi Tersedia */}
          <TabsContent value="tersedia" className="space-y-4">
            {availableMissions.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  Belum ada misi tersedia saat ini
                </p>
                <Button
                  onClick={fetchAllData}
                  variant="outline"
                  className="mt-4"
                >
                  Refresh
                </Button>
              </Card>
            ) : (
              availableMissions.map((order) => (
                <MissionCard key={order._id} order={order} showActions />
              ))
            )}
          </TabsContent>

          {/* Misi Aktif */}
          <TabsContent value="aktif" className="space-y-4">
            {activeMissions.length === 0 ? (
              <Card className="p-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Belum ada misi aktif</p>
              </Card>
            ) : (
              activeMissions.map((order) => (
                <MissionCard key={order._id} order={order} />
              ))
            )}
          </TabsContent>

          {/* Riwayat */}
          <TabsContent value="riwayat" className="space-y-4">
            {completedMissions.length === 0 ? (
              <Card className="p-8 text-center">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Belum ada riwayat misi</p>
              </Card>
            ) : (
              completedMissions.map((order) => (
                <MissionCard key={order._id} order={order} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RunnerDashboard;
