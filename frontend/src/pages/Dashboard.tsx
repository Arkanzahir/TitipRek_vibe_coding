// src/pages/Dashboard.tsx - FINAL FIX TOMBOL ADMIN
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Utensils,
  Archive,
  MessageCircle,
  ShoppingCart,
  Plus,
  Minus,
  Bell,
  User,
  Loader2,
  Lock,
  Clock,
  CheckCircle,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { orderService } from "@/services/orderService";
import { runnerService } from "@/services/runnerService";
import { authService } from "@/services/authService";
import nasiGorengImg from "@/assets/nasi-goreng.jpg";
import kopiSusuImg from "@/assets/kopi-susu.jpg";
import ayamGeprekImg from "@/assets/ayam-geprek.jpg";

const Dashboard = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<"konsumen" | "runner">("konsumen");
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loadingActiveOrder, setLoadingActiveOrder] = useState(true);
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [showCart, setShowCart] = useState(false);

  const [checkingRunner, setCheckingRunner] = useState(false);
  const [runnerStatus, setRunnerStatus] = useState<any>(null);

  // 🔥 FIX LOGIC: Pengecekan Admin yang Lebih Pintar (Robust) 🔥
  const user = authService.getUser();
  // Kita ubah dulu jadi text string, baru dicek. Ini mengatasi masalah format database yg aneh.
  const isAdmin =
    user &&
    JSON.stringify(user.roles || [])
      .toLowerCase()
      .includes("admin");

  useEffect(() => {
    fetchActiveOrder();
  }, []);

  useEffect(() => {
    if (role === "runner") {
      checkRunnerVerification();
    }
  }, [role]);

  const fetchActiveOrder = async () => {
    try {
      const response = await orderService.getMyOrders();
      if (response.success && response.data) {
        const inProgressOrder = response.data.find((order: any) =>
          ["diambil", "sudah_dibeli", "sedang_diantar"].includes(order.status)
        );
        setActiveOrder(inProgressOrder || null);
      }
    } catch (error) {
      console.error("Failed to fetch active order:", error);
    } finally {
      setLoadingActiveOrder(false);
    }
  };

  const checkRunnerVerification = async () => {
    setCheckingRunner(true);
    try {
      const response = await runnerService.getVerificationStatus();
      if (response.success && response.data) {
        setRunnerStatus(response.data);
        if (response.data.verificationStatus === "verified") {
          navigate("/runner-dashboard", { replace: true });
          return;
        }
      }
    } catch (error) {
      console.error("Failed to check runner status:", error);
    } finally {
      setCheckingRunner(false);
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      diambil: "Pesanan Diambil Runner",
      sudah_dibeli: "Barang Sudah Dibeli",
      sedang_diantar: "Sedang Diantar",
    };
    return statusMap[status] || "Pesanan Diproses";
  };

  const popularItems = [
    {
      id: 1,
      name: "Nasi Goreng Spesial",
      merchant: "Warung Bu Sri",
      price: "15.000",
      category: "konsumsi",
      image: nasiGorengImg,
    },
    {
      id: 2,
      name: "Kopi Susu Gula Aren",
      merchant: "Kedai Kopi Mahasiswa",
      price: "12.000",
      category: "konsumsi",
      image: kopiSusuImg,
    },
    {
      id: 3,
      name: "Ayam Geprek Jumbo",
      merchant: "Geprek Kampus",
      price: "18.000",
      category: "konsumsi",
      image: ayamGeprekImg,
    },
  ];

  const addToCart = (itemId: number) => {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const newCart = { ...prev };
      if (newCart[itemId] > 1) newCart[itemId]--;
      else delete newCart[itemId];
      return newCart;
    });
  };

  const cartItemsCount = Object.values(cart).reduce(
    (sum, count) => sum + count,
    0
  );
  const cartTotal = Object.entries(cart).reduce((sum, [itemId, count]) => {
    const item = popularItems.find((i) => i.id === Number(itemId));
    return sum + (item ? parseInt(item.price.replace(".", "")) * count : 0);
  }, 0);

  const renderRunnerContent = () => {
    if (checkingRunner) {
      return (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground">
            Memeriksa status verifikasi...
          </p>
        </div>
      );
    }

    if (!runnerStatus) {
      return (
        <div className="text-center py-12">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Aktivasi Runner Diperlukan
          </h3>
          <p className="text-muted-foreground mb-4">
            Verifikasi identitas untuk mulai menerima misi
          </p>
          <Button onClick={() => navigate("/runner-activation")} size="lg">
            Mulai Verifikasi
          </Button>
        </div>
      );
    }

    if (runnerStatus.verificationStatus === "pending") {
      return (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Verifikasi Dalam Proses
          </h3>
          <p className="text-muted-foreground mb-4">
            Tim kami sedang memverifikasi dokumen Anda
          </p>
          <div className="p-4 border rounded-lg bg-card inline-block">
            <p className="text-sm text-muted-foreground">
              Estimasi: 1-2 hari kerja
            </p>
          </div>
        </div>
      );
    }

    if (runnerStatus.verificationStatus === "rejected") {
      return (
        <div className="text-center py-12">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Verifikasi Ditolak</h3>
          {runnerStatus.rejectionReason && (
            <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg mb-4 max-w-md mx-auto">
              <p className="text-sm">
                <strong>Alasan:</strong> {runnerStatus.rejectionReason}
              </p>
            </div>
          )}
          <Button onClick={() => navigate("/runner-activation")} size="lg">
            Submit Ulang Dokumen
          </Button>
        </div>
      );
    }

    if (runnerStatus.verificationStatus === "verified") {
      navigate("/runner-dashboard", { replace: true });
      return <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />;
    }

    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Aktivasi akun Runner diperlukan
        </p>
        <Button onClick={() => navigate("/runner-activation")}>
          Aktivasi Akun Runner
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary/5 to-white">
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              TitipRek
            </h1>
            <div className="flex items-center gap-2">
              {/* 🔥 TOMBOL ADMIN (Hanya muncul kalau isAdmin = true) 🔥 */}
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin")}
                  className="flex items-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-bold transition-colors text-sm border border-red-200 mr-1 shadow-sm"
                >
                  <ShieldCheck className="h-5 w-5" />
                  <span className="hidden md:inline">Admin</span>
                </button>
              )}

              {role === "konsumen" && (
                <button
                  onClick={() => setShowCart(!showCart)}
                  className="relative p-2 hover:bg-primary/10 rounded-lg transition-colors"
                >
                  <ShoppingCart className="h-6 w-6 text-primary" />
                  {cartItemsCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-primary text-white">
                      {cartItemsCount}
                    </Badge>
                  )}
                </button>
              )}
              <button
                onClick={() => navigate("/order-history")}
                className="relative p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <Bell className="h-6 w-6 text-primary" />
                {activeOrder && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="p-2 hover:bg-primary/10 rounded-lg transition-colors"
              >
                <User className="h-6 w-6 text-primary" />
              </button>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari merchant, produk, atau kategori..."
              className="pl-10 rounded-xl border-2 focus:border-primary shadow-sm"
            />
          </div>

          <Tabs
            value={role}
            onValueChange={(v) => setRole(v as "konsumen" | "runner")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-gradient-to-r from-primary/20 to-primary/10">
              <TabsTrigger
                value="konsumen"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Konsumen
              </TabsTrigger>
              <TabsTrigger
                value="runner"
                className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md"
              >
                Runner
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {role === "konsumen" ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link to="/create-order?type=konsumsi">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 h-32 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Utensils className="h-8 w-8 text-white relative z-10" />
                  <span className="text-sm font-semibold text-white relative z-10">
                    Kebutuhan Konsumsi
                  </span>
                </div>
              </Link>
              <Link to="/create-order?type=logistik">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 p-6 h-32 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <Archive className="h-8 w-8 text-white relative z-10" />
                  <span className="text-sm font-semibold text-white relative z-10">
                    Tugas & Logistik
                  </span>
                </div>
              </Link>
            </div>

            <section>
              <h2 className="text-xl font-bold text-foreground mb-4">
                Rekomendasi Populer 🔥
              </h2>
              <div className="space-y-4">
                {popularItems.map((item) => (
                  <div
                    key={item.id}
                    className="group flex gap-4 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <h3 className="font-bold text-gray-800">{item.name}</h3>
                        <p className="text-xs text-gray-500">{item.merchant}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold">
                          Rp {item.price}
                        </span>
                        {cart[item.id] ? (
                          <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-bold text-primary w-4 text-center">
                              {cart[item.id]}
                            </span>
                            <button
                              onClick={() => addToCart(item.id)}
                              className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart(item.id)}
                            className="rounded-full px-4 h-8 text-xs"
                          >
                            Tambah
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {showCart && (
              <div
                className="fixed inset-0 z-50 bg-black/50"
                onClick={() => setShowCart(false)}
              >
                <div
                  className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Keranjang</h2>
                    <button
                      onClick={() => setShowCart(false)}
                      className="text-2xl"
                    >
                      &times;
                    </button>
                  </div>
                  {Object.keys(cart).length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      Keranjang kosong
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(cart).map(([itemId, count]) => {
                        const item = popularItems.find(
                          (i) => i.id === Number(itemId)
                        );
                        if (!item) return null;
                        return (
                          <div
                            key={itemId}
                            className="flex justify-between items-center"
                          >
                            <div className="text-sm">
                              <p className="font-bold">{item.name}</p>
                              <p className="text-gray-500">
                                {count} x Rp {item.price}
                              </p>
                            </div>
                            <p className="font-bold text-primary">
                              Rp{" "}
                              {(
                                parseInt(item.price.replace(".", "")) * count
                              ).toLocaleString("id-ID")}
                            </p>
                          </div>
                        );
                      })}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between font-bold text-lg mb-4">
                          <span>Total</span>
                          <span>Rp {cartTotal.toLocaleString("id-ID")}</span>
                        </div>
                        <Link to="/create-order">
                          <Button className="w-full">Checkout</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          renderRunnerContent()
        )}
      </main>

      {role === "konsumen" && activeOrder && !loadingActiveOrder && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 cursor-pointer"
          onClick={() => navigate(`/order-tracking/${activeOrder._id}`)}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Status Pesanan</p>
              <p className="text-sm font-bold text-primary">
                {getStatusText(activeOrder.status)}
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs">
              Lihat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
