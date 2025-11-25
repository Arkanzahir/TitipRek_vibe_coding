// src/pages/ConsumerProfile.tsx - FINAL FIX BADGE ROLE
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService } from "@/services/authService";
import {
  ArrowLeft,
  User,
  History,
  CreditCard,
  MapPin,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Phone,
  GraduationCap,
  Loader2,
  Camera,
  ShieldCheck, // Icon Admin
  Bike, // Icon Runner
  ShoppingBag, // Icon Konsumen
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const ConsumerProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(authService.getUser());
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phoneNumber: user?.phoneNumber || "",
    campus: user?.campus || "",
    profilePhoto: user?.profilePhoto || "",
  });

  // Auto-refresh data user
  useEffect(() => {
    const fetchFreshUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const result = await response.json();

        if (result.success) {
          setUser(result.data);
          localStorage.setItem("user", JSON.stringify(result.data));
          setFormData((prev) => ({
            ...prev,
            name: result.data.name,
            phoneNumber: result.data.phoneNumber,
            campus: result.data.campus,
            profilePhoto: result.data.profilePhoto,
          }));
        }
      } catch (error) {
        console.error("Gagal refresh user:", error);
      }
    };

    fetchFreshUserData();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      authService.logout();
      navigate("/auth");
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const response = await authService.updateProfile(formData);
      if (response.success) {
        const currentUser = authService.getUser();
        setUser(currentUser);
        setIsEditing(false);
        alert("Profil berhasil diperbarui!");
      } else {
        alert("Gagal update: " + response.message);
      }
    } catch (error: any) {
      alert("Terjadi kesalahan saat update profil");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran foto terlalu besar (maks 5MB)");
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFormData({ ...formData, profilePhoto: reader.result as string });
      };
    }
  };

  const getPhotoUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith("data:") || path.startsWith("http")
      ? path
      : `http://localhost:5000${path}`;
  };

  // Logika Cek Role
  const rolesString = JSON.stringify(user?.roles || []).toLowerCase();
  const isRunner = rolesString.includes("runner");
  const isAdmin = rolesString.includes("admin");

  const menuItems = [
    {
      icon: User,
      label: "Edit Profil",
      action: () => setIsEditing(true),
      color: "text-blue-500",
    },
    {
      icon: History,
      label: "Riwayat Pesanan",
      action: () => navigate("/order-history"),
      color: "text-green-500",
    },
    {
      icon: CreditCard,
      label: "Metode Pembayaran",
      action: () => alert("Segera Hadir!"),
      color: "text-purple-500",
    },
    {
      icon: MapPin,
      label: "Alamat Tersimpan",
      action: () => alert("Segera Hadir!"),
      color: "text-orange-500",
    },
    {
      icon: Bell,
      label: "Notifikasi",
      action: () => alert("Belum ada notifikasi"),
      color: "text-yellow-500",
    },
    {
      icon: HelpCircle,
      label: "Bantuan & FAQ",
      action: () => alert("Hubungi Admin"),
      color: "text-teal-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-teal-500 to-green-500 pt-6 pb-24 px-4 rounded-b-[30px] shadow-lg text-white relative">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-xl font-bold">Profil Saya</h1>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-28 w-28 border-4 border-white shadow-2xl">
              <AvatarImage
                src={getPhotoUrl(user?.profilePhoto)}
                className="object-cover"
              />
              <AvatarFallback className="bg-white text-teal-600 text-4xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 bg-white text-teal-600 p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <Camera className="h-5 w-5" />
            </button>
          </div>

          <h2 className="text-2xl font-bold mt-4">{user?.name}</h2>

          {/* 🔥 BADGE ROLE: DIJAMIN MUNCUL SEMUA 🔥 */}
          <div className="flex gap-2 mt-3 justify-center flex-wrap">
            {/* Badge Admin */}
            {isAdmin && (
              <span className="bg-red-500/20 border border-red-400 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 font-semibold shadow-sm">
                <ShieldCheck className="h-3 w-3" /> Admin
              </span>
            )}

            {/* Badge Runner */}
            {isRunner && (
              <span className="bg-orange-500/20 border border-orange-400 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1 font-semibold shadow-sm">
                <Bike className="h-3 w-3" /> Runner
              </span>
            )}

            {/* Badge Konsumen (Selalu Muncul) */}
            <span className="bg-white/20 border border-white/30 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
              <ShoppingBag className="h-3 w-3" /> Konsumen
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-white rounded-xl shadow-md p-5 mb-4 space-y-3">
          <div className="flex items-center gap-3 text-gray-600">
            <Mail className="h-5 w-5 text-gray-400" />
            <span className="text-sm">{user?.email}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <Phone className="h-5 w-5 text-gray-400" />
            <span className="text-sm">{user?.phoneNumber}</span>
          </div>
          <div className="flex items-center gap-3 text-gray-600">
            <GraduationCap className="h-5 w-5 text-gray-400" />
            <span className="text-sm">{user?.campus}</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          {menuItems.map((item, index) => (
            <div
              key={index}
              onClick={item.action}
              className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-gray-50 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-700">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-300" />
            </div>
          ))}
        </div>

        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full h-12 text-base font-semibold shadow-sm"
        >
          <LogOut className="h-5 w-5 mr-2" /> Keluar Aplikasi
        </Button>
      </div>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profil</DialogTitle>
            <DialogDescription>Perbarui informasi akun Anda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-2 mb-2">
              <div className="relative w-20 h-20">
                <Avatar className="h-20 w-20 border-2 border-gray-200">
                  <AvatarImage
                    src={
                      formData.profilePhoto?.startsWith("data:")
                        ? formData.profilePhoto
                        : getPhotoUrl(formData.profilePhoto)
                    }
                    className="object-cover"
                  />
                  <AvatarFallback>{formData.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-teal-600 text-white p-1.5 rounded-full shadow hover:bg-teal-700"
                >
                  <Camera className="h-3 w-3" />
                </button>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </div>
            <div className="grid gap-2">
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Nomor WhatsApp</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Kampus</Label>
              <Input
                value={formData.campus}
                onChange={(e) =>
                  setFormData({ ...formData, campus: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Batal
            </Button>
            <Button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}{" "}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConsumerProfile;
