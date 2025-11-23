import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Wallet,
  CreditCard,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const Payment = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState("cash");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock order data
  const order = {
    id: orderId || "ORD001",
    itemCost: 25000,
    serviceFee: 5000,
    total: 30000,
  };

  const paymentMethods = [
    {
      id: "cash",
      icon: Wallet,
      name: "Tunai (Cash on Delivery)",
      description: "Bayar langsung ke runner saat barang sampai",
      recommended: true,
    },
    {
      id: "gopay",
      icon: Smartphone,
      name: "GoPay",
      description: "Bayar menggunakan GoPay",
      badge: "Promo 10%",
    },
    {
      id: "ovo",
      icon: Smartphone,
      name: "OVO",
      description: "Bayar menggunakan OVO",
    },
    {
      id: "dana",
      icon: Smartphone,
      name: "DANA",
      description: "Bayar menggunakan DANA",
    },
    {
      id: "debit",
      icon: CreditCard,
      name: "Kartu Debit",
      description: "Bayar menggunakan kartu debit",
    },
  ];

  const handlePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      toast.success("Pembayaran berhasil diproses!");
      navigate("/dashboard");
      setIsProcessing(false);
    }, 2000);
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
        <h1 className="text-2xl font-bold">Pembayaran</h1>
        <p className="text-white/80 text-sm mt-1">Pilih metode pembayaran</p>
      </div>

      <div className="px-4 space-y-4">
        {/* Order Summary */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <h3 className="font-bold mb-3">Ringkasan Pesanan</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Harga Barang</span>
                <span>Rp {order.itemCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Biaya Jasa Runner</span>
                <span className="text-primary font-semibold">
                  Rp {order.serviceFee.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">
                  Rp {order.total.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <h3 className="font-bold mb-4">Metode Pembayaran</h3>

            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`relative flex items-start space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <RadioGroupItem value={method.id} id={method.id} />
                    <Label
                      htmlFor={method.id}
                      className="flex-1 cursor-pointer flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center">
                        <method.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          {method.name}
                          {method.recommended && (
                            <Badge className="bg-green-500 text-white text-xs">
                              Rekomendasi
                            </Badge>
                          )}
                          {method.badge && (
                            <Badge className="bg-primary text-white text-xs">
                              {method.badge}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {method.description}
                        </div>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Process Button */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full py-6 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl"
        >
          {isProcessing ? "Memproses..." : `Bayar Rp ${order.total.toLocaleString()}`}
        </Button>
      </div>
    </div>
  );
};

export default Payment;
