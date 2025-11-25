// src/pages/OrderHistory.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { orderService } from "@/services/orderService";

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders();
  }, []);

  const fetchMyOrders = async () => {
    try {
      // Mengambil data asli dari backend
      const response = await orderService.getMyOrders();
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "selesai":
        return (
          <Badge className="bg-green-500 text-white hover:bg-green-600">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
          </Badge>
        );
      case "dibatalkan":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" /> Dibatalkan
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500 text-white hover:bg-blue-600">
            <Clock className="w-3 h-3 mr-1" /> Proses
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: any) => {
    if (!amount) return "Rp 0";
    const num = parseFloat(amount.toString());
    return `Rp ${num.toLocaleString("id-ID")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-accent/5 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-accent text-white p-6 rounded-b-3xl shadow-xl mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-white hover:bg-white/20 -ml-2"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-bold">Riwayat Pesanan</h1>
        </div>
        <p className="text-white/80 text-sm">Total {orders.length} pesanan</p>
      </div>

      <div className="px-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada riwayat pesanan</p>
          </div>
        ) : (
          orders.map((order) => (
            <Card
              key={order._id}
              className="shadow-md border-0 hover:shadow-lg transition-all cursor-pointer bg-white"
              onClick={() => navigate(`/order-tracking/${order._id}`)}
            >
              <CardContent className="p-4">
                {/* Header Card */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 mr-2">
                    <div className="font-bold text-lg text-gray-800 line-clamp-1">
                      {order.title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(order.createdAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  {getStatusBadge(order.status)}
                </div>

                {/* Locations */}
                <div className="space-y-2 mb-3 bg-gray-50 p-2 rounded-lg">
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-600 line-clamp-1">
                      {order.pickupLocation.name}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div className="text-gray-600 line-clamp-1">
                      {order.deliveryLocation.name}
                    </div>
                  </div>
                </div>

                {/* Footer Card */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="text-sm flex items-center gap-1">
                    <span className="text-gray-500">Runner:</span>
                    <span className="font-semibold text-gray-800">
                      {order.runner ? order.runner.name : "Menunggu..."}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500">Total Biaya</div>
                    <div className="text-sm font-bold text-primary">
                      {formatCurrency(
                        parseFloat(
                          order.estimatedItemCost?.$numberDecimal ||
                            order.estimatedItemCost
                        ) +
                          parseFloat(
                            order.serviceFeeCuan?.$numberDecimal ||
                              order.serviceFeeCuan
                          )
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
