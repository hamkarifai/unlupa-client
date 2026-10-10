import {
  ChevronLeft,
  ChevronRight,
  Cpu,
  Moon,
  Layers,
  Users,
  User,
  Library,
  Heart,
  CalendarClock,
  Gauge,
  LayoutDashboard,
  Star,
} from "@/components/foundations/hugeicons";
import { useRef } from "react";

export const FeatureSection = () => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollSlider = (direction: number) => {
    if (sliderRef.current) {
      const firstCard = sliderRef.current.firstElementChild as HTMLElement;
      if (firstCard) {
        const slideWidth = firstCard.clientWidth + 32; // card width + gap
        sliderRef.current.scrollBy({
          left: direction * slideWidth,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <section
      id="fitur"
      className="relative w-full max-w-[1400px] px-6 md:px-12 py-32 z-10 flex flex-col h-full justify-center mx-auto"
    >
      {/* HEADER */}
      <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
        <div>
          <div className="text-primary font-display text-xs tracking-[0.3em] uppercase mb-4 flex items-center gap-3">
            <Cpu className="w-4 h-4" />
            Core System
          </div>
          <h2 className="font-serif text-4xl md:text-6xl text-foreground mb-3 leading-tight tracking-tight">
            Fitur Inti{" "}
            <span className="text-primary">
              UNLUPA
            </span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl font-light">
            Dirancang untuk menjaga ilmu, <br className="hidden md:block" />{" "}
            <span className="text-primary/80 italic font-serif">
              bukan sekadar mempelajarinya.
            </span>
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4">
          <button
            onClick={() => scrollSlider(-1)}
            className="w-12 h-12 rounded-lg border border-border bg-surface-1 text-muted-foreground flex items-center justify-center hover:bg-surface-2 hover:text-foreground transition-colors duration-300 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scrollSlider(1)}
            className="w-12 h-12 rounded-lg border border-border bg-surface-1 text-muted-foreground flex items-center justify-center hover:bg-surface-2 hover:text-foreground transition-colors duration-300 cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* FEATURES SLIDER */}
      <div
        ref={sliderRef}
        id="fitur-slider"
        className="flex overflow-x-auto overflow-y-visible snap-x snap-mandatory scrollbar-hide gap-8 pt-8 pb-12 px-2 items-stretch"
      >
        {/* 1. Ruang Menghafal Al-Qur’an (Success) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-success/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
              <Moon className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-success transition-colors">
              Ruang Menghafal <br />
              Al-Qur’an
            </h3>
            <div className="w-12 h-1 bg-success/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Ruang khusus dengan sistem yang tidak disamakan dengan materi
              lain, menghormati adab dan metode hifz.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-success/70 uppercase tracking-widest">
              Sacred Space
            </div>
            <span className="text-5xl font-serif text-success/40 font-bold group-hover:text-success transition-colors">
              01
            </span>
          </div>
        </div>

        {/* 2. 5 Fase Hafalan (Warning) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-warning/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center">
              <Layers className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-warning transition-colors">
              5 Fase Hafalan <br />
              Terstruktur
            </h3>
            <div className="w-12 h-1 bg-warning/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Dari awal menghafal hingga fase graduation dan penjagaan jangka
              panjang yang terstruktur.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-warning/70 uppercase tracking-widest">
              Methodology
            </div>
            <span className="text-5xl font-serif text-warning/40 font-bold group-hover:text-warning transition-colors">
              02
            </span>
          </div>
        </div>

        {/* 3. Ruang Kelas (Info) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-info/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-info/10 border border-info/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-info" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-info transition-colors">
              Ruang Kelas <br />
              Terintegrasi
            </h3>
            <div className="w-12 h-1 bg-info/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Mengikuti materi dari guru dengan sistem pengulangan terjaga,
              terintegrasi langsung dengan kurikulum.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-info/70 uppercase tracking-widest">
              Academic
            </div>
            <span className="text-5xl font-serif text-info/40 font-bold group-hover:text-info transition-colors">
              03
            </span>
          </div>
        </div>

        {/* 4. Ruang Personal (Primary) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-primary/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
              Ruang Personal <br />
              Custom
            </h3>
            <div className="w-12 h-1 bg-primary/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Membuat dan menjaga materi pribadi untuk jangka panjang sesuai
              kebutuhan spesifik Anda.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-primary/70 uppercase tracking-widest">
              Private
            </div>
            <span className="text-5xl font-serif text-primary/40 font-bold group-hover:text-primary transition-colors">
              04
            </span>
          </div>
        </div>

        {/* 5. Library Kitab (Primary) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-primary/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Library className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
              Library Kitab <br />
              Digital
            </h3>
            <div className="w-12 h-1 bg-primary/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Kumpulan kitab dan materi siap pakai yang telah dikurasi untuk
              kemudahan akses tanpa batas.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-primary/70 uppercase tracking-widest">
              Resources
            </div>
            <span className="text-5xl font-serif text-primary/40 font-bold group-hover:text-primary transition-colors">
              05
            </span>
          </div>
        </div>

        {/* 6. Share Kitab (Destructive) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-destructive/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
              <Heart className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-destructive transition-colors">
              Share Kitab <br />
              (Amal Jariyah)
            </h3>
            <div className="w-12 h-1 bg-destructive/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Bagikan materi untuk kebermanfaatan bersama, menjadikan ilmu
              sebagai aliran pahala yang terus mengalir.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-destructive/70 uppercase tracking-widest">
              Contribution
            </div>
            <span className="text-5xl font-serif text-destructive/40 font-bold group-hover:text-destructive transition-colors">
              06
            </span>
          </div>
        </div>

        {/* 7. Daily Review (Warning) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-warning/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-warning/10 border border-warning/20 flex items-center justify-center">
              <CalendarClock className="w-8 h-8 text-warning" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-warning transition-colors">
              Daily Review <br />
              Otomatis
            </h3>
            <div className="w-12 h-1 bg-warning/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Setiap hari, UNLUPA menentukan apa yang perlu ditinjau, menghapus
              kebingungan "belajar apa hari ini".{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-warning/70 uppercase tracking-widest">
              Automation
            </div>
            <span className="text-5xl font-serif text-warning/40 font-bold group-hover:text-warning transition-colors">
              07
            </span>
          </div>
        </div>

        {/* 8. Load Control (Primary) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-primary/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Gauge className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
              Load Control <br />
              System
            </h3>
            <div className="w-12 h-1 bg-primary/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Sistem cerdas yang menjaga agar beban belajar tetap manusiawi,
              konsisten, dan tidak membebani.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-primary/70 uppercase tracking-widest">
              Balance
            </div>
            <span className="text-5xl font-serif text-primary/40 font-bold group-hover:text-primary transition-colors">
              08
            </span>
          </div>
        </div>

        {/* 9. Dashboard Guru (Info) */}
        <div className="min-w-[320px] md:min-w-[380px] h-[520px] snap-center bg-card border border-border rounded-3xl p-10 flex flex-col group cursor-default justify-between hover:border-info/40 transition-colors">
          <div className="mb-auto relative z-10">
            <div className="mb-8 w-16 h-16 rounded-2xl bg-info/10 border border-info/20 flex items-center justify-center">
              <LayoutDashboard className="w-8 h-8 text-info" />
            </div>
            <h3 className="text-3xl font-serif text-foreground mb-4 leading-tight group-hover:text-info transition-colors">
              Dashboard Guru <br />
              Real-time
            </h3>
            <div className="w-12 h-1 bg-info/60 rounded-full mb-6 group-hover:w-24 transition-all duration-500"></div>
            <p className="text-sm text-muted-foreground font-light leading-relaxed">
              {" "}
              Memantau perkembangan siswa secara real-time, untuk membimbing
              bukan sekadar menekan.{" "}
            </p>
          </div>
          <div className="pt-6 flex justify-between items-end border-t border-border mt-4 relative z-10">
            <div className="text-[10px] font-mono text-info/70 uppercase tracking-widest">
              Monitoring
            </div>
            <span className="text-5xl font-serif text-info/40 font-bold group-hover:text-info transition-colors">
              09
            </span>
          </div>
        </div>

        {/* 10. FITUR PEMBEDA (THE GOLD CORE) */}
        <div className="min-w-[320px] md:min-w-[420px] h-[520px] snap-center bg-card border border-primary rounded-3xl p-8 md:p-10 flex flex-col relative group cursor-default justify-between">
          {/* Content Top */}
          <div className="relative z-10">
            <div className="mb-6 md:mb-8 w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Star className="w-10 h-10 text-primary fill-primary/20" />
            </div>
            <h3 className="text-3xl md:text-4xl font-serif text-foreground mb-4 leading-tight">
              4 Tombol Feedback <br />{" "}
              <span className="text-primary">
                Kejujuran
              </span>
            </h3>
            <div className="w-16 h-1 bg-primary rounded-full mb-6"></div>
            <div className="pl-4 border-l-2 border-primary/30">
              <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed">
                Inti sistem UNLUPA. Parameter akurat untuk menentukan waktu
                ulang yang tepat, bukan sekadar tebakan.
              </p>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-6 flex justify-between items-end border-t border-primary/20 mt-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-[10px] text-primary font-mono tracking-widest uppercase whitespace-nowrap">
                Core Engine Active
              </span>
            </div>
            {/* Angka 10 adjustment */}
            <span className="text-5xl font-serif text-primary/40 font-bold group-hover:text-primary transition-colors leading-none -mb-2">
              10
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
