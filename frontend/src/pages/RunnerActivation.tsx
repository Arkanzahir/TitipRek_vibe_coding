import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Lock, Upload, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type ActivationState = "locked" | "upload" | "pending";

const RunnerActivation = () => {
  const [state, setState] = useState<ActivationState>("locked");
  const { toast } = useToast();

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setState("pending");
    toast({
      title: "Dokumen Diterima",
      description: "Verifikasi identitas Anda sedang dalam proses.",
    });
  };

  if (state === "locked") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-3">Aktivasi Akun Diperlukan</h1>
          <p className="text-muted-foreground mb-8">
            Untuk alasan keamanan dan kepercayaan, peran Runner memerlukan verifikasi identitas.
          </p>
          <Button size="lg" className="w-full mb-4" onClick={() => setState("upload")}>
            Mulai Verifikasi
          </Button>
          <Link to="/dashboard">
            <Button variant="ghost" className="w-full">
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
          <h1 className="text-2xl font-bold text-foreground mb-3">Verifikasi Dalam Proses</h1>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-lg" onClick={() => setState("locked")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Verifikasi Identitas</h1>
        </div>
      </header>

      {/* Upload Form */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">Upload Kartu Tanda Mahasiswa (KTM)</h2>
            <p className="text-sm text-muted-foreground">
              Pastikan foto KTM jelas dan dapat dibaca
            </p>
          </div>

          <form onSubmit={handleUpload} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ktm-upload">File KTM (JPG, PNG, atau PDF)</Label>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-smooth">
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
