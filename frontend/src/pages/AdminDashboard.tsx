// src/pages/AdminDashboard.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { adminService } from "@/services/adminService";
import {
  Users,
  Package,
  DollarSign,
  Clock,
  X,
  Loader2,
  ArrowLeft,
  Shield,
  CheckCircle,
  Eye,
} from "lucide-react";

// URL Backend (Gunakan link Vercel kamu)
const API_URL = "https://titip-rek-vibe-coding.vercel.app";

interface PlatformStats {
  users: {
    total: number;
    totalRunners: number;
    pendingVerifications: number;
    verifiedRunners: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
  };
  revenue: {
    totalPlatformFees: number;
  };
}

interface PendingRunner {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  campus: string;
  runnerVerification: {
    status: string;
    ktmPhoto: string;
    submittedAt: string;
  };
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  campus: string;
  roles: string[];
  isActive: boolean;
  runnerVerification: {
    status: string;
  };
  createdAt: string;
}

interface Order {
  _id: string;
  title: string;
  description: string;
  orderType: string;
  status: string;
  estimatedItemCost: any;
  serviceFeeCuan: any;
  consumer: {
    name: string;
    email: string;
  };
  runner?: {
    name: string;
  };
  createdAt: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pendingRunners, setPendingRunners] = useState<PendingRunner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Ambil Statistik
      const statsResponse = await adminService.getStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // 2. Ambil Data Pending
      const pendingResponse = await adminService.getPendingVerifications();
      if (pendingResponse.success) {
        setPendingRunners(pendingResponse.data);
      }

      // 3. Ambil Semua Users
      const usersResponse = await adminService.getUsers({ limit: 100 });
      if (usersResponse.success) {
        setUsers(usersResponse.data);
      }

      // 4. Ambil Order
      const ordersResponse = await adminService.getOrders({ limit: 50 });
      if (ordersResponse.success) {
        setOrders(ordersResponse.data);
      }
    } catch (error: any) {
      console.error("Fetch data error:", error);
      setError(error.message || "Gagal memuat data admin");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRunner = async (userId: string, name: string) => {
    if (!window.confirm(`Approve runner ${name}?`)) return;

    setProcessing(userId);
    try {
      const response = await adminService.approveRunner(userId);
      if (response.success) {
        alert(`✅ ${name} berhasil diverifikasi!`);
        await fetchData();
      } else {
        alert(`Gagal approve: ${response.message}`);
      }
    } catch (error: any) {
      alert(error.message || "Gagal approve runner");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRunner = async (userId: string, name: string) => {
    const reason = prompt(`Masukkan alasan penolakan untuk ${name}:`);
    if (!reason) return;

    setProcessing(userId);
    try {
      const response = await adminService.rejectRunner(userId, reason);
      if (response.success) {
        alert(`❌ Verifikasi ${name} ditolak`);
        await fetchData();
      } else {
        alert(`Gagal reject: ${response.message}`);
      }
    } catch (error: any) {
      alert(error.message || "Gagal reject runner");
    } finally {
      setProcessing(null);
    }
  };

  const handleToggleUserStatus = async (
    userId: string,
    name: string,
    isActive: boolean
  ) => {
    if (
      !window.confirm(`${isActive ? "Nonaktifkan" : "Aktifkan"} user ${name}?`)
    )
      return;

    try {
      const response = await adminService.toggleUserStatus(userId);
      if (response.success) {
        alert(response.message);
        await fetchData();
      }
    } catch (error: any) {
      alert(error.message || "Gagal toggle user status");
    }
  };

  const openKtmPhoto = (path: string) => {
    if (!path) return;
    const fullUrl = path.startsWith("http") ? path : `${API_URL}${path}`;
    window.open(fullUrl, "_blank");
  };

  const formatCurrency = (amount: any) => {
    if (!amount) return "Rp 0";
    let num = parseFloat(amount.toString());
    if (amount.$numberDecimal) num = parseFloat(amount.$numberDecimal);
    return `Rp ${num.toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Shield className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>

          {/* Stats Cards - UPDATED */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="p-4 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-purple-600" />
                  <p className="text-sm text-gray-600">Total Users</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.users.total}
                </p>

                {/* 🔥 UPDATE: Tampilkan Verified Runner agar datanya valid dan sinkron 🔥 */}
                <p className="text-xs mt-1 text-green-600 font-medium">
                  {stats.users.verifiedRunners} Verified Runners
                </p>
              </Card>
              <Card className="p-4 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.users.pendingVerifications}
                </p>
                <p className="text-xs mt-1 text-gray-500">verifikasi</p>
              </Card>
              <Card className="p-4 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <p className="text-sm text-gray-600">Orders</p>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.orders.total}
                </p>
                <p className="text-xs mt-1 text-gray-500">
                  {stats.orders.active} aktif
                </p>
              </Card>
              <Card className="p-4 bg-white border-0 shadow-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.revenue.totalPlatformFees)}
                </p>
              </Card>
            </div>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4 bg-white/10">
              <TabsTrigger
                value="overview"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="verifications"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600"
              >
                Verifikasi
                {pendingRunners.length > 0 && (
                  <Badge className="ml-2 bg-yellow-500 text-white">
                    {pendingRunners.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600"
              >
                Users
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="text-white data-[state=active]:bg-white data-[state=active]:text-purple-600"
              >
                Orders
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab}>
          <TabsContent value="overview" className="space-y-4">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-4">Platform Overview</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">User Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Users:</span>
                      <span className="font-bold">{stats?.users.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified Runners:</span>
                      <span className="font-bold text-green-600">
                        {stats?.users.verifiedRunners}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Verifications:</span>
                      <span className="font-bold text-yellow-600">
                        {stats?.users.pendingVerifications}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Order Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Orders:</span>
                      <span className="font-bold">{stats?.orders.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Orders:</span>
                      <span className="font-bold text-blue-600">
                        {stats?.orders.active}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Completed:</span>
                      <span className="font-bold text-green-600">
                        {stats?.orders.completed}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="verifications" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Verifikasi Runner Pending</h2>
              <Button onClick={() => fetchData()} variant="outline" size="sm">
                🔄 Refresh
              </Button>
            </div>

            {pendingRunners.length === 0 ? (
              <Card className="p-8 text-center bg-white">
                <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Tidak ada verifikasi pending</p>
              </Card>
            ) : (
              pendingRunners.map((runner) => (
                <Card
                  key={runner._id}
                  className="p-4 bg-white border border-gray-200 mb-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        {runner.name}
                      </h3>
                      <p className="text-sm text-gray-600">{runner.email}</p>
                      <p className="text-sm text-gray-600">
                        {runner.phoneNumber} • {runner.campus}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Diajukan:{" "}
                        {runner.runnerVerification?.submittedAt
                          ? new Date(
                              runner.runnerVerification.submittedAt
                            ).toLocaleString("id-ID")
                          : "-"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {runner.runnerVerification.ktmPhoto && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openKtmPhoto(runner.runnerVerification.ktmPhoto)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" /> Lihat KTM
                        </Button>
                      )}
                    </div>
                  </div>
                  <Separator className="my-3" />
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        handleApproveRunner(runner._id, runner.name)
                      }
                      disabled={processing === runner._id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {processing === runner._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" /> Approve
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() =>
                        handleRejectRunner(runner._id, runner.name)
                      }
                      disabled={processing === runner._id}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" /> Reject
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {users.map((user) => (
              <Card
                key={user._id}
                className="p-4 bg-white border border-gray-200 mb-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex gap-2 mt-2">
                      {user.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {role}
                        </Badge>
                      ))}
                      <Badge
                        variant={user.isActive ? "default" : "destructive"}
                      >
                        {user.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    onClick={() =>
                      handleToggleUserStatus(user._id, user.name, user.isActive)
                    }
                    variant="outline"
                    size="sm"
                  >
                    {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {orders.map((order) => (
              <Card
                key={order._id}
                className="p-4 bg-white border border-gray-200 mb-2"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{order.title}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {order.description}
                    </p>
                  </div>
                  <Badge>{order.status}</Badge>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Consumer:</strong> {order.consumer.name}
                  </p>
                  {order.runner && (
                    <p>
                      <strong>Runner:</strong> {order.runner.name}
                    </p>
                  )}
                  <p>
                    <strong>Cuan:</strong>{" "}
                    {formatCurrency(order.serviceFeeCuan)}
                  </p>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
