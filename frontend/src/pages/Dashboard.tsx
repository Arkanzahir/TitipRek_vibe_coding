// src/pages/Dashboard.tsx - UPDATED VERSION
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
} from "lucide-react";
import { Link } from "react-router-dom";
import { orderService } from "@/services/orderService";
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

  // Fetch active order on mount
  useEffect(() => {
    fetchActiveOrder();
  }, []);

  const fetchActiveOrder = async () => {
    try {
      // Get orders that are in progress (diambil, sudah_dibeli, sedang_diantar)
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
      if (newCart[itemId] > 1) {
        newCart[itemId]--;
      } else {
        delete newCart[itemId];
      }
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary/5 to-white">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              TitipRek
            </h1>
            <div className="flex items-center gap-3">
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
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
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

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Cari merchant, produk, atau kategori..."
              className="pl-10 rounded-xl border-2 focus:border-primary shadow-sm"
            />
          </div>

          {/* Role Switcher */}
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

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {role === "konsumen" ? (
          <>
            {/* Category Navigation */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <Link to="/create-order?type=konsumsi">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 h-32 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Utensils className="h-8 w-8 text-white relative z-10" />
                  <span className="text-sm font-semibold text-white relative z-10">
                    Kebutuhan Konsumsi
                  </span>
                </div>
              </Link>

              <Link to="/create-order?type=logistik">
                <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 to-primary/70 p-6 h-32 flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Archive className="h-8 w-8 text-white relative z-10" />
                  <span className="text-sm font-semibold text-white relative z-10">
                    Tugas & Logistik
                  </span>
                </div>
              </Link>
            </div>

            {/* Popular Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">
                  Rekomendasi Populer 🔥
                </h2>
              </div>
              <div className="space-y-4">
                {popularItems.map((item) => (
                  <div
                    key={item.id}
                    className="group relative overflow-hidden rounded-2xl bg-white border-2 border-primary/20 shadow-md hover:shadow-xl transition-all hover:scale-[1.02]"
                  >
                    <div className="flex gap-4">
                      <div className="w-28 h-28 flex-shrink-0 overflow-hidden rounded-l-2xl">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="flex-1 py-3 pr-4 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-foreground text-base mb-1">
                            {item.name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {item.merchant}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-primary">
                            Rp {item.price}
                          </span>
                          {cart[item.id] ? (
                            <div className="flex items-center gap-2 bg-primary/10 rounded-full px-2 py-1">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-semibold text-primary w-4 text-center">
                                {cart[item.id]}
                              </span>
                              <button
                                onClick={() => addToCart(item.id)}
                                className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => addToCart(item.id)}
                              className="bg-primary hover:bg-primary/90 rounded-full px-4 shadow-md"
                            >
                              + Keranjang
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Cart Sidebar */}
            {showCart && (
              <div
                className="fixed inset-0 bg-black/50 z-30 animate-fade-in"
                onClick={() => setShowCart(false)}
              >
                <div
                  className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-6 animate-slide-in-right overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Keranjang Belanja</h2>
                    <button
                      onClick={() => setShowCart(false)}
                      className="text-2xl"
                    >
                      &times;
                    </button>
                  </div>

                  {Object.keys(cart).length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Keranjang masih kosong
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4 mb-6">
                        {Object.entries(cart).map(([itemId, count]) => {
                          const item = popularItems.find(
                            (i) => i.id === Number(itemId)
                          );
                          if (!item) return null;
                          return (
                            <div
                              key={itemId}
                              className="flex gap-3 p-3 border rounded-xl"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h3 className="font-semibold text-sm">
                                  {item.name}
                                </h3>
                                <p className="text-primary font-bold text-sm">
                                  Rp {item.price}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <button
                                    onClick={() =>
                                      removeFromCart(Number(itemId))
                                    }
                                    className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="text-sm font-semibold w-4 text-center">
                                    {count}
                                  </span>
                                  <button
                                    onClick={() => addToCart(Number(itemId))}
                                    className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="border-t pt-4 mb-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-bold">Total</span>
                          <span className="text-2xl font-bold text-primary">
                            Rp {cartTotal.toLocaleString("id-ID")}
                          </span>
                        </div>
                        <Link to="/create-order">
                          <Button className="w-full bg-primary hover:bg-primary/90 rounded-xl h-12 text-base font-semibold">
                            Checkout Sekarang
                          </Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Aktivasi akun Runner diperlukan untuk melihat daftar tugas
            </p>
            <Link to="/runner-activation">
              <Button>Aktivasi Akun Runner</Button>
            </Link>
          </div>
        )}
      </main>

      {/* Floating Active Order Bar - ONLY SHOW IF THERE'S ACTIVE ORDER */}
      {role === "konsumen" && activeOrder && !loadingActiveOrder && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/90 px-4 py-3 shadow-2xl z-20 border-t-2 border-white/20 cursor-pointer hover:from-primary/90 hover:to-primary/80 transition-colors"
          onClick={() => navigate(`/order-tracking/${activeOrder._id}`)}
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="text-white text-sm font-semibold">
              {getStatusText(activeOrder.status)}:{" "}
              {activeOrder.runner?.name || "Menunggu Runner"}
            </div>
            <div className="flex items-center gap-2">
              {activeOrder.runner && (
                <a
                  href={activeOrder.runner.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    size="sm"
                    className="h-8 bg-white text-primary hover:bg-white/90 font-semibold"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" />
                    WA
                  </Button>
                </a>
              )}
              <Button
                size="sm"
                className="h-8 bg-white/20 text-white hover:bg-white/30 border border-white/30 font-semibold"
              >
                Lihat Rincian &gt;
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
