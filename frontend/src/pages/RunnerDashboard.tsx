// src/pages/RunnerDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { runnerService } from "@/services/runnerService";
import { authService } from "@/services/authService";
import {
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  MapPin,
  User,
  Star,
  CheckCircle,
  Loader2,
  ArrowLeft,
  AlertCircle,
  LogOut,
  Menu,
  X as CloseIcon,
} from "lucide-react";

// --- TIPE DATA ---
interface Order {
  _id: string;
  title: string;
  description: string;
  status: string;
  pickupLocation: { name: string; address: string };
  deliveryLocation: { name: string; address: string };
  deadline: string;
  estimatedItemCost: number;
  serviceFeeCuan: number;
  isUrgent: boolean;
  consumer?: {
    name: string;
    campus: string;
  };
}

interface RunnerStats {
  totalMissions: number;
  completedMissions: number;
  totalEarnings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
}

const RunnerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tersedia");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<RunnerStats | null>(null);

  // Data Misi
  const [availableMissions, setAvailableMissions] = useState<Order[]>([]);
  const [activeMissions, setActiveMissions] = useState<Order[]>([]);
  const [completedMissions, setCompletedMissions] = useState<Order[]>([]);

  const [takingMission, setTakingMission] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const user = authService.getUser();

  useEffect(() => {
    fetchAllData();
  }, [activeTab]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Ambil Statistik
      const statsResponse = await runnerService.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // 2. Ambil Misi sesuai Tab
      if (activeTab === "tersedia") {
        const res = await runnerService.getAvailableMissions({
          sortBy: "deadline",
        });
        if (res.success) setAvailableMissions(res.data);
      } else if (activeTab === "aktif") {
        const res = await runnerService.getMyMissions("active");
        if (res.success) setActiveMissions(res.data);
      } else {
        const res = await runnerService.getMyMissions("completed");
        if (res.success) setCompletedMissions(res.data);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeMission = async (orderId: string) => {
    if (!window.confirm("Yakin ingin mengambil misi ini?")) return;

    setTakingMission(orderId);
    try {
      const response = await runnerService.takeMission(orderId);
      if (response.success) {
        // Refresh data dan pindah ke tab aktif
        setActiveTab("aktif");
        fetchAllData();
      }
    } catch (error: any) {
      alert(error.message || "Gagal mengambil misi");
    } finally {
      setTakingMission(null);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Yakin ingin logout?")) {
      authService.logout();
      navigate("/auth");
    }
  };

  // --- HELPER FORMATTING ---
  const formatCurrency = (amount: any) => {
    if (amount === undefined || amount === null) return "Rp 0";
    const num = parseFloat(amount.toString());
    if (isNaN(num)) return "Rp 0";
    return `Rp ${num.toLocaleString("id-ID")}`;
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();
    if (diff < 0) return "Expired";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) return `${hours} jam lagi`;
    return `${Math.floor(hours / 24)} hari lagi`;
  };

  const getStatusBadge = (status: string) => {
    const map: any = {
      terbuka: { label: "Tersedia", variant: "default" },
      diambil: { label: "Diambil", variant: "secondary" },
      sudah_dibeli: { label: "Sudah Dibeli", variant: "secondary" },
      sedang_diantar: { label: "Sedang Diantar", variant: "secondary" },
      selesai: { label: "Selesai", variant: "default" },
    };
    const info = map[status] || map.terbuka;
    return <Badge variant={info.variant}>{info.label}</Badge>;
  };

  // --- KOMPONEN KARTU MISI ---
  const MissionCard = ({
    order,
    showActions = false,
  }: {
    order: Order;
    showActions?: boolean;
  }) => (
    <Card
      className="p-4 mb-4 hover:shadow-lg transition-shadow cursor-pointer border-gray-100 bg-white"
      onClick={() => {
        if (order.status !== "terbuka") {
          navigate(`/order-tracking/${order._id}`);
        }
      }}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-900 line-clamp-1">
              {order.title}
            </h3>
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

      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>{order.consumer?.name || "Konsumen"}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-teal-600" />
          <span className="text-xs">Ambil: {order.pickupLocation.name}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 text-orange-600" />
          <span className="text-xs">Antar: {order.deliveryLocation.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-xs text-red-500 font-medium">
            {getTimeRemaining(order.deadline)}
          </span>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-600">Modal Belanja</p>
          <p className="text-sm font-semibold text-gray-900">
            {formatCurrency(order.estimatedItemCost)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Cuan Runner ⚡</p>
          <p className="text-lg font-bold text-teal-600">
            {formatCurrency(order.serviceFeeCuan)}
          </p>
        </div>
      </div>

      {showActions && order.status === "terbuka" && (
        <Button
          onClick={(e) => {
            e.stopPropagation();
            handleTakeMission(order._id);
          }}
          disabled={takingMission === order._id}
          className="w-full mt-3 bg-teal-600 hover:bg-teal-700 text-white"
        >
          {takingMission === order._id ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengambil...
            </>
          ) : (
            "Ambil Misi"
          )}
        </Button>
      )}

      {/* Status Alert untuk Tab Aktif */}
      {order.status === "diambil" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />{" "}
          <span>Upload bukti pembelian</span>
        </div>
      )}
      {order.status === "sudah_dibeli" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-purple-600 bg-purple-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />{" "}
          <span>Upload bukti pengantaran</span>
        </div>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-white">
                <AvatarImage src={user?.profilePhoto} />
                <AvatarFallback className="bg-white text-teal-600 font-bold">
                  {user?.name?.charAt(0) || "R"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold">{user?.name || "Runner"}</h2>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                  <span className="text-sm font-semibold">
                    {stats?.averageRating.toFixed(1) || "0.0"}
                  </span>
                  <span className="text-sm opacity-80">
                    ({stats?.totalReviews || 0} review)
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="text-white hover:bg-white/20"
            >
              {showMenu ? (
                <CloseIcon className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Quick Actions Menu (Burger) - TANPA TARIK SALDO */}
          {showMenu && (
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 space-y-2 animate-in fade-in slide-in-from-top-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/20"
                onClick={() => {
                  navigate("/runner-profile");
                  setShowMenu(false);
                }}
              >
                <User className="h-5 w-5 mr-3" /> Lihat Profil
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-white hover:bg-white/20"
                onClick={() => navigate("/dashboard")} // Tombol Balik ke Konsumen
              >
                <ArrowLeft className="h-5 w-5 mr-3" /> Mode Konsumen
              </Button>
              <Separator className="bg-white/20" />
              <Button
                variant="ghost"
                className="w-full justify-start text-red-200 hover:bg-red-500/20"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5 mr-3" /> Logout
              </Button>
            </div>
          )}

          {/* Stats Cards - TANPA TOMBOL TARIK SALDO */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Card className="p-3 bg-white/90 backdrop-blur border-0 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-teal-600" />
                  <p className="text-[10px] text-gray-600 uppercase font-bold">
                    Total Misi
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalMissions}
                </p>
              </Card>

              <Card className="p-3 bg-white/90 backdrop-blur border-0 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <p className="text-[10px] text-gray-600 uppercase font-bold">
                    Selesai
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedMissions}
                </p>
              </Card>

              <Card className="p-3 bg-white/90 backdrop-blur border-0 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <p className="text-[10px] text-gray-600 uppercase font-bold">
                    Success Rate
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completionRate.toFixed(0)}%
                </p>
              </Card>

              <Card className="p-3 bg-gradient-to-br from-yellow-400 to-orange-500 border-0 shadow-lg text-white">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-white" />
                  <p className="text-[10px] uppercase font-bold text-white/90">
                    Total Pendapatan
                  </p>
                </div>
                <p className="text-xl font-bold">
                  {formatCurrency(stats.totalEarnings)}
                </p>
                <p className="text-[10px] text-white/80 mt-1">
                  (Tunai dari COD)
                </p>
              </Card>
            </div>
          )}

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 bg-white/20 backdrop-blur text-white">
              <TabsTrigger
                value="tersedia"
                className="data-[state=active]:bg-white data-[state=active]:text-teal-600"
              >
                Tersedia
              </TabsTrigger>
              <TabsTrigger
                value="aktif"
                className="data-[state=active]:bg-white data-[state=active]:text-teal-600"
              >
                Aktif
                {activeMissions.length > 0 && (
                  <Badge className="ml-2 bg-orange-500 text-white hover:bg-orange-600 border-0">
                    {activeMissions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="riwayat"
                className="data-[state=active]:bg-white data-[state=active]:text-teal-600"
              >
                Riwayat
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        ) : (
          <Tabs value={activeTab}>
            <TabsContent value="tersedia" className="space-y-4">
              {availableMissions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada misi tersedia saat ini</p>
                  <Button
                    variant="link"
                    onClick={fetchAllData}
                    className="text-teal-600"
                  >
                    Refresh
                  </Button>
                </div>
              ) : (
                availableMissions.map((order) => (
                  <MissionCard key={order._id} order={order} showActions />
                ))
              )}
            </TabsContent>

            <TabsContent value="aktif" className="space-y-4">
              {activeMissions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Kamu sedang tidak menjalankan misi</p>
                </div>
              ) : (
                activeMissions.map((order) => (
                  <MissionCard key={order._id} order={order} />
                ))
              )}
            </TabsContent>

            <TabsContent value="riwayat" className="space-y-4">
              {completedMissions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Belum ada riwayat misi selesai</p>
                </div>
              ) : (
                completedMissions.map((order) => (
                  <MissionCard key={order._id} order={order} />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default RunnerDashboard;
