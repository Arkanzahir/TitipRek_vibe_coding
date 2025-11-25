import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Users } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            TitipRek
          </h1>
          <Link to="/auth">
            <Button className="bg-primary hover:opacity-90 text-white font-semibold rounded-xl shadow-lg">
              Masuk
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
            Platform Logistik & Kebutuhan Harian Kampus Terintegrasi
          </h2>
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Menghubungkan kebutuhan konsumen dan penyedia jasa dalam satu
            ekosistem kampus yang efisien.
          </p>
          <Link to="/auth">
            <Button
              size="lg"
              className="gap-2 px-10 py-6 text-lg font-bold bg-primary hover:opacity-90 rounded-xl shadow-xl transition-all hover:scale-105 text-white"
            >
              Daftar Sekarang 🚀
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Verifikasi Identitas
            </h3>
            <p className="text-sm text-muted-foreground">
              Semua runner diverifikasi dengan KTM untuk keamanan maksimal
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Transaksi Cepat
            </h3>
            <p className="text-sm text-muted-foreground">
              Sistem insentif transparan untuk efisiensi maksimal
            </p>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">
              Ekosistem Kampus
            </h3>
            <p className="text-sm text-muted-foreground">
              Dibangun khusus untuk kebutuhan komunitas kampus
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
