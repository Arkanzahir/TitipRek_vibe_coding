// src/pages/RunnerActivation.tsx - FINAL WORKING VERSION
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Lock,
  Upload,
  Clock,
  Loader2,
  FileImage,
} from "lucide-react";
import { Link } from "react-router-dom";
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
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const response = await runnerService.getVerificationStatus();
      if (response.success && response.data) {
        const { verificationStatus, rejectionReason: reason } = response.data;

        if (verificationStatus === "verified") {
          navigate("/runner-dashboard", { replace: true });
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

        setState("locked");
      }
    } catch (error) {
      console.error("Check status error:", error);
      setState("locked");
    }
  };

  // 🔥 FUNGSI HANDLE FILE (CONVERT BASE64) 🔥
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validasi ukuran (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar (Maks 5MB)");
        return;
      }
      setFile(selectedFile);

      // Buat preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // 🔥 FUNGSI SUBMIT KE SERVER 🔥
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !preview) {
      alert("Mohon pilih foto KTM terlebih dahulu");
      return;
    }

    setUploading(true);
    try {
      // Kirim Base64 ke Backend
      const response = await runnerService.applyVerification(preview);

      if (response.success) {
        setState("pending"); // Pindah ke tampilan pending
      } else {
        alert("Gagal upload: " + response.message);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan saat upload");
    } finally {
      setUploading(false);
    }
  };

  // --- RENDER STATES ---

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (state === "pending") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-lg">
          <div className="h-20 w-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Verifikasi Dalam Proses
          </h1>
          <p className="text-gray-600 mb-6">
            Tim Admin sedang memverifikasi dokumen KTM Anda. Mohon tunggu
            persetujuan.
          </p>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="w-full"
          >
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">
            Verifikasi Ditolak
          </h1>
          <div className="bg-red-50 p-3 rounded-lg mb-6 text-center">
            <p className="text-sm text-red-700 font-medium">
              Alasan: {rejectionReason}
            </p>
          </div>
          <Button
            onClick={() => setState("upload")}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            Upload Ulang Dokumen
          </Button>
        </div>
      </div>
    );
  }

  // State: Locked / Upload Form
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b p-4 sticky top-0 z-10 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-lg font-bold">Verifikasi Identitas</h1>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Upload KTM</h2>
          <p className="text-gray-500">
            Pastikan foto Kartu Tanda Mahasiswa terlihat jelas dan terbaca.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              file
                ? "border-teal-500 bg-teal-50"
                : "border-gray-300 hover:border-teal-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            {preview ? (
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg shadow-sm"
                />
                <div className="mt-4 flex items-center justify-center gap-2 text-teal-700 font-medium">
                  <FileImage className="h-5 w-5" /> Ganti Foto
                </div>
              </div>
            ) : (
              <div className="py-8">
                <Upload className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="font-medium text-gray-700">
                  Klik untuk upload foto
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  JPG, PNG (Maks 5MB)
                </p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>

          <div className="space-y-4">
            <div>
              <Label>Nomor Induk Mahasiswa (NIM)</Label>
              <Input placeholder="Contoh: 5027241120" />
            </div>
            <div>
              <Label>Nama Lengkap</Label>
              <Input placeholder="Sesuai KTM" />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 h-12 text-lg font-bold"
            disabled={uploading || !file}
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin mr-2" /> Mengirim...
              </>
            ) : (
              "Kirim Verifikasi"
            )}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default RunnerActivation;
