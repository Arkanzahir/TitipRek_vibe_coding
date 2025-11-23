import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  History,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/authService";

const ConsumerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load user data from localStorage
  useEffect(() => {
    const loadUser = () => {
      const userData = authService.getUser();
      if (userData) {
        setUser(userData);
      } else {
        // If no user, redirect to login
        toast.error("Anda belum login!");
        navigate("/auth");
      }
      setLoading(false);
    };

    loadUser();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    toast.success("Berhasil logout!");
    navigate("/auth");
  };

  const menuItems = [
    {
      icon: User,
      label: "Edit Profil",
      action: () => toast.info("Fitur edit profil akan segera hadir!"),
    },
    {
      icon: History,
      label: "Riwayat Pesanan",
      action: () => navigate("/order-history"),
    },
    {
      icon: CreditCard,
      label: "Metode Pembayaran",
      action: () => toast.info("Fitur pembayaran akan segera hadir!"),
    },
    {
      icon: MapPin,
      label: "Alamat Tersimpan",
      action: () => toast.info("Fitur alamat akan segera hadir!"),
    },
    {
      icon: Bell,
      label: "Notifikasi",
      action: () => toast.info("Pengaturan notifikasi akan segera hadir!"),
    },
    {
      icon: HelpCircle,
      label: "Bantuan & FAQ",
      action: () => toast.info("Halaman bantuan akan segera hadir!"),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Format phone number for display
  const displayPhone = user.phoneNumber?.startsWith("62")
    ? "0" + user.phoneNumber.substring(2)
    : user.phoneNumber;

  // Format join date
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })
    : "Baru bergabung";

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white p-6 rounded-b-3xl shadow-xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali
        </Button>

        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 border-4 border-white shadow-xl">
            <AvatarFallback className="text-2xl bg-white text-primary font-bold">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{user.name || "User"}</h1>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white text-primary">
                {user.consumerStats?.totalOrders || 0} Pesanan
              </Badge>
              <span className="text-white/80 text-sm">
                • Member sejak {joinDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Contact Info Card */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium">{user.email || "-"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">
                  No. WhatsApp
                </div>
                <div className="font-medium">{displayPhone || "-"}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Kampus</div>
                <div className="font-medium">{user.campus || "-"}</div>
              </div>
            </div>
            {user.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-muted-foreground">Alamat</div>
                  <div className="font-medium">{user.address}</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="flex-1 text-left font-medium">
                  {item.label}
                </span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full py-6 text-lg shadow-lg"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Keluar
        </Button>
      </div>
    </div>
  );
};

export default ConsumerProfile;
