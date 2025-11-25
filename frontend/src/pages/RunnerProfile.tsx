// src/pages/RunnerProfile.tsx - FINAL CONNECTED VERSION
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Star,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { runnerService } from "@/services/runnerService";
import { authService } from "@/services/authService";

// URL Backend (Sesuaikan jika perlu)
const API_URL = "https://titip-rek-vibe-coding.vercel.app";

const RunnerProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const user = authService.getUser();

  useEffect(() => {
    fetchRunnerStats();
  }, []);

  const fetchRunnerStats = async () => {
    try {
      const response = await runnerService.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = (path: string) => {
    if (!path) return "";
    return path.startsWith("data:") || path.startsWith("http")
      ? path
      : `${API_URL}${path}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-6 rounded-b-[2.5rem] shadow-xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-white hover:bg-white/20 -ml-2"
        >
          <ArrowLeft className="w-6 h-6 mr-2" />
          Kembali
        </Button>

        <div className="flex items-center gap-5 mb-2">
          <Avatar className="w-24 h-24 border-4 border-white/30 shadow-2xl">
            <AvatarImage
              src={getPhotoUrl(user?.profilePhoto)}
              className="object-cover"
            />
            <AvatarFallback className="text-3xl bg-white text-teal-600 font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1 text-white leading-tight">
              {user?.name}
            </h1>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center bg-white/20 px-2 py-1 rounded-lg backdrop-blur-sm">
                <Star className="w-4 h-4 fill-yellow-300 text-yellow-300 mr-1" />
                <span className="font-bold text-white">
                  {stats?.averageRating?.toFixed(1) || "0.0"}
                </span>
              </div>
              <span className="text-white/80 text-sm">
                • {stats?.totalMissions || 0} pesanan
              </span>
            </div>
            <Badge className="bg-white/90 text-teal-700 font-bold hover:bg-white">
              Bergabung{" "}
              {new Date(
                stats?.verificationDate || Date.now()
              ).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-6 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <div className="text-xl font-bold text-gray-800">
                {stats?.completionRate || 0}%
              </div>
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                Success Rate
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 mx-auto mb-2 text-blue-500" />
              <div className="text-xl font-bold text-gray-800">~30 m</div>
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                Avg. Time
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
              <div className="text-xl font-bold text-gray-800">
                {stats?.totalMissions || 0}
              </div>
              <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                Total Order
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
            <Star className="w-5 h-5 text-teal-600" />
            Review dari Konsumen
          </h2>

          {/* TODO: Ambil review asli dari backend nanti. Sekarang pakai placeholder dinamis sesuai rating */}
          {stats?.totalReviews > 0 ? (
            <div className="space-y-3">
              <Card className="shadow-sm border border-gray-100">
                <CardContent className="p-4">
                  <div className="flex justify-between mb-2">
                    <div className="font-semibold text-sm">Konsumen Puas</div>
                    <div className="flex text-yellow-400">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    "Pelayanan sangat cepat dan ramah. Barang sampai dengan
                    aman!"
                  </p>
                </CardContent>
              </Card>
              <p className="text-center text-xs text-gray-400 mt-4">
                Menampilkan ulasan terbaru
              </p>
            </div>
          ) : (
            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-400 text-sm">
                Belum ada ulasan dari konsumen
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RunnerProfile;
