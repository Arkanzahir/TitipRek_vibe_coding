// src/pages/RunnerActivation.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, Upload, Clock, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { runnerService } from "@/services/runnerService";

type ActivationState =
  | "locked"
  | "upload"
  | "pending"
  | "verified"
  | "rejected"
  | "loading";

const RunnerActivation = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<ActivationState>("loading");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await runnerService.getVerificationStatus();
      clearTimeout(timeoutId);

      console.log("Verification status:", response);

      if (!response || !response.success) {
        setState("locked");
        return;
      }

      const { verificationStatus, rejectionReason: reason } =
        response.data || {};

      // 🔥 FIX: Jika status verified, LANGSUNG PINDAH HALAMAN
      if (verificationStatus === "verified") {
        console.log("✅ User verified, redirecting...");
        navigate("/runner-dashboard"); // <--- INI KUNCINYA
        return;
      }

      if (verificationStatus === "rejected") {
        setRejectionReason(reason || "");
        setState("rejected");
        return;
      }

      if (verificationStatus === "pending") {
        setState("pending");
        return;
      }

      // Default: show upload form
      setState("locked");
    } catch (error: any) {
      console.error("Check verification error:", error);
      setState("locked");
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setState("pending");
    toast({
      title: "Dokumen Diterima",
      description: "Verifikasi identitas Anda sedang dalam proses.",
    });
    // Di sini seharusnya ada API call untuk upload KTM,
    // tapi untuk sekarang kita simulasi UI saja sesuai kode lama kamu.
  };

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3 text-center">
            Verifikasi Ditolak
          </h1>
          <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg mb-8">
            <p className="text-sm text-foreground">
              <strong>Alasan:</strong> {rejectionReason}
            </p>
          </div>
          <Button
            size="lg"
            className="w-full mb-4"
            onClick={() => setState("upload")}
          >
            Submit Ulang
          </Button>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Verifikasi Dalam Proses
          </h1>
          <p className="text-muted-foreground mb-4">
            Tim kami sedang memverifikasi dokumen identitas Anda.
          </p>
          <div className="p-4 border border-border rounded-lg bg-card mb-8">
            <p className="text-sm text-muted-foreground">
              Waktu estimasi: 1-2 hari kerja
            </p>
          </div>
          <Link to="/dashboard">
            <Button variant="outline" className="w-full">
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Default UI: Upload Form (untuk status locked/upload)
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            Verifikasi Identitas
          </h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Upload Kartu Tanda Mahasiswa (KTM)
            </h2>
            <p className="text-sm text-muted-foreground">
              Pastikan foto KTM jelas dan dapat dibaca
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ktm-upload">File KTM (JPG, PNG, atau PDF)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-all">
                <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <Input
                  id="ktm-upload"
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  required
                />
                <Label
                  htmlFor="ktm-upload"
                  className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
                >
                  Klik untuk upload file
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</Label>
              <Input
                id="nim"
                placeholder="Contoh: 1234567890"
                className="rounded-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="full-name">Nama Lengkap</Label>
              <Input
                id="full-name"
                placeholder="Sesuai KTM"
                className="rounded-lg"
                required
              />
            </div>

            <Button type="submit" size="lg" className="w-full">
              Submit Verifikasi
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default RunnerActivation;
