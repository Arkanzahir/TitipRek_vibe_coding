import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const RunnerWithdrawal = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock runner balance data
  const balance = {
    available: 450000,
    pending: 50000,
    total: 500000,
    thisMonth: 1250000,
  };

  const recentWithdrawals = [
    {
      id: "WD001",
      amount: 300000,
      date: "15 Nov 2024",
      status: "completed",
      bank: "BCA - 1234567890",
    },
    {
      id: "WD002",
      amount: 200000,
      date: "10 Nov 2024",
      status: "completed",
      bank: "BCA - 1234567890",
    },
    {
      id: "WD003",
      amount: 150000,
      date: "5 Nov 2024",
      status: "completed",
      bank: "BCA - 1234567890",
    },
  ];

  const quickAmounts = [50000, 100000, 200000, 450000];

  const handleWithdraw = () => {
    const withdrawAmount = parseInt(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Masukkan jumlah penarikan yang valid!");
      return;
    }

    if (withdrawAmount > balance.available) {
      toast.error("Saldo tidak mencukupi!");
      return;
    }

    if (withdrawAmount < 50000) {
      toast.error("Minimum penarikan adalah Rp 50.000!");
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      toast.success(
        `Penarikan Rp ${withdrawAmount.toLocaleString()} berhasil diproses! Dana akan masuk ke rekening dalam 1x24 jam.`
      );
      setAmount("");
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
        <h1 className="text-2xl font-bold mb-4">Penarikan Dana</h1>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-white/80 text-xs mb-1">Saldo Tersedia</div>
            <div className="text-2xl font-bold">
              Rp {(balance.available / 1000).toFixed(0)}K
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="text-white/80 text-xs mb-1">Bulan Ini</div>
            <div className="text-2xl font-bold flex items-center gap-1">
              <TrendingUp className="w-5 h-5" />
              {(balance.thisMonth / 1000).toFixed(0)}K
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Withdrawal Form */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="font-bold">Tarik Saldo</h3>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Jumlah Penarikan</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    Rp
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="50.000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-lg font-semibold"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum penarikan Rp 50.000
                </p>
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <Label className="mb-2 block">Pilih Cepat</Label>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant="outline"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="text-xs"
                      disabled={quickAmount > balance.available}
                    >
                      {quickAmount >= 1000
                        ? `${quickAmount / 1000}K`
                        : quickAmount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Bank Info */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Rekening Tujuan
                </div>
                <div className="font-semibold">BCA - 1234567890</div>
                <div className="text-sm text-muted-foreground">a.n. Budi Santoso</div>
                <Button
                  variant="link"
                  className="text-xs p-0 h-auto mt-1"
                  onClick={() => toast.info("Fitur ubah rekening akan segera hadir!")}
                >
                  Ubah Rekening
                </Button>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={isProcessing}
                className="w-full py-6 text-lg bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-xl"
              >
                <ArrowUpRight className="w-5 h-5 mr-2" />
                {isProcessing ? "Memproses..." : "Tarik Dana"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Withdrawals */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-4">
            <h3 className="font-bold mb-4">Riwayat Penarikan</h3>
            <div className="space-y-3">
              {recentWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold">
                        Rp {withdrawal.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {withdrawal.date}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {withdrawal.bank}
                      </div>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">Berhasil</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RunnerWithdrawal;
