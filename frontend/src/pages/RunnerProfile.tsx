import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Star, TrendingUp, Clock, CheckCircle2, ArrowLeft } from "lucide-react";

const RunnerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock data - replace with real data
  const runner = {
    id: id || "1",
    name: "Budi Santoso",
    photo: "",
    rating: 4.8,
    totalOrders: 342,
    successRate: 98.5,
    avgDeliveryTime: "18 menit",
    joinedDate: "Januari 2024",
    reviews: [
      {
        id: 1,
        consumerName: "Ani K.",
        rating: 5,
        comment: "Runner super cepat dan ramah! Makanan sampai masih panas 🔥",
        date: "2 hari lalu",
      },
      {
        id: 2,
        consumerName: "Rizky M.",
        rating: 5,
        comment: "Profesional banget, komunikasi lancar via WA. Recommended!",
        date: "5 hari lalu",
      },
      {
        id: 3,
        consumerName: "Siti N.",
        rating: 4,
        comment: "Baik dan cepat, cuma agak lama balesnya aja. Overall oke!",
        date: "1 minggu lalu",
      },
    ],
  };

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

        <div className="flex items-start gap-4">
          <Avatar className="w-24 h-24 border-4 border-white shadow-xl">
            <AvatarImage src={runner.photo} />
            <AvatarFallback className="text-2xl bg-white text-primary">
              {runner.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{runner.name}</h1>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="font-bold text-lg">{runner.rating}</span>
              </div>
              <span className="text-white/80">• {runner.totalOrders} pesanan</span>
            </div>
            <Badge className="bg-white text-primary">
              Bergabung {runner.joinedDate}
            </Badge>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{runner.successRate}%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-xl font-bold text-blue-600">{runner.avgDeliveryTime}</div>
              <div className="text-xs text-muted-foreground">Avg. Time</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{runner.totalOrders}</div>
              <div className="text-xs text-muted-foreground">Total Orders</div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            Review dari Konsumen
          </h2>

          <div className="space-y-3">
            {runner.reviews.map((review) => (
              <Card key={review.id} className="shadow-md border-0 hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold">{review.consumerName}</div>
                      <div className="text-xs text-muted-foreground">{review.date}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-foreground/80">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunnerProfile;
