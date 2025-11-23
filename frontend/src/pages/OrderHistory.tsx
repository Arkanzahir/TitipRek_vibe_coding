import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle2, XCircle, MapPin } from "lucide-react";

const OrderHistory = () => {
  const navigate = useNavigate();

  // Mock data
  const orders = [
    {
      id: "ORD001",
      date: "20 Nov 2024, 13:45",
      runner: "Budi S.",
      items: "Nasi Goreng Spesial, Es Teh",
      pickup: "Kantin Barat",
      destination: "Gedung Teknik Lt. 3",
      total: 35000,
      incentive: 5000,
      status: "completed",
    },
    {
      id: "ORD002",
      date: "19 Nov 2024, 19:20",
      runner: "Ani K.",
      items: "Ayam Geprek + Nasi",
      pickup: "Warung Pak Joko",
      destination: "Asrama Mahasiswa Blok C",
      total: 28000,
      incentive: 4000,
      status: "completed",
    },
    {
      id: "ORD003",
      date: "18 Nov 2024, 12:15",
      runner: "Rizky M.",
      items: "Kopi Susu, Roti Bakar",
      pickup: "Kafe Sudut",
      destination: "Perpustakaan Pusat",
      total: 22000,
      incentive: 3000,
      status: "cancelled",
    },
    {
      id: "ORD004",
      date: "17 Nov 2024, 14:30",
      runner: "Siti N.",
      items: "Mie Goreng, Jus Jeruk",
      pickup: "Kantin Timur",
      destination: "Lab Komputer",
      total: 30000,
      incentive: 4000,
      status: "completed",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-500 text-white">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Selesai
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge className="bg-primary">
            <Clock className="w-3 h-3 mr-1" />
            Proses
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white p-6 rounded-b-3xl shadow-xl mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4 text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold">Riwayat Pesanan</h1>
        <p className="text-white/80 text-sm mt-1">
          Total {orders.length} pesanan
        </p>
      </div>

      <div className="px-4 space-y-4">
        {orders.map((order) => (
          <Card
            key={order.id}
            className="shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer animate-fade-in"
            onClick={() => navigate(`/order-tracking/${order.id}`)}
          >
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-bold text-lg">{order.id}</div>
                  <div className="text-xs text-muted-foreground">{order.date}</div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              {/* Items */}
              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                <div className="text-sm font-medium mb-1">Pesanan:</div>
                <div className="text-sm text-foreground/80">{order.items}</div>
              </div>

              {/* Location */}
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5" />
                  <div>
                    <span className="text-muted-foreground">Pickup: </span>
                    <span className="font-medium">{order.pickup}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary mt-0.5" />
                  <div>
                    <span className="text-muted-foreground">Antar ke: </span>
                    <span className="font-medium">{order.destination}</span>
                  </div>
                </div>
              </div>

              {/* Runner & Price */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm">
                  <span className="text-muted-foreground">Runner: </span>
                  <span className="font-semibold">{order.runner}</span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total Bayar</div>
                  <div className="text-lg font-bold text-primary">
                    Rp {order.total.toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
