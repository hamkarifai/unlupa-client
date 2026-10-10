import { ShieldCheck, ArrowDown } from "@/components/foundations/hugeicons";

export const SolutionSection = () => {
  return (
    <section
      id="solution"
      className="relative w-full min-h-screen bg-background flex flex-col items-center overflow-hidden font-primary"
    >
      <div className="relative w-full max-w-4xl px-6 md:px-12 py-24 z-10 flex flex-col items-center">
        <div className="mb-12 relative animate-in slide-in-from-bottom-8 fade-in duration-1000">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center relative rotate-45 border border-warning/30 bg-card transition-all duration-500 hover:border-warning/40">
            <ShieldCheck className="w-10 h-10 text-warning -rotate-45" />
          </div>
        </div>

        <div className="text-center mb-16">
          <h2 className="font-serif italic text-3xl md:text-5xl text-muted-foreground mb-4 leading-tight">
            Kerugian Ini Sebenarnya <br />
            <span className="text-warning font-bold not-italic text-4xl md:text-6xl tracking-wide">
              BISA DICEGAH
            </span>
          </h2>
          <div className="w-24 h-1 bg-linear-to-r from-transparent via-primary/50 to-transparent mx-auto mt-6"></div>
        </div>

        <div className="p-8 md:p-12 rounded-3xl text-center max-w-2xl relative group bg-card border border-border transition-colors duration-500 hover:border-warning/30">
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-warning/30 rounded-tl-xl"></div>
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-warning/30 rounded-br-xl"></div>

          <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed mb-8">
            Lupa bukan sesuatu yang datang tiba-tiba.
          </p>

          <div className="py-6 relative">
            <div className="w-px h-12 bg-linear-to-b from-transparent via-warning/50 to-transparent mx-auto mb-6"></div>

            <h3 className="font-serif text-2xl md:text-3xl text-foreground italic mb-4">
              "Masalahnya bukan pada Anda."
            </h3>

            <p className="text-sm md:text-base text-muted-foreground font-mono leading-relaxed">
              Masalahnya adalah cara belajar yang membiarkan ingatan berjalan
              sendiri <br className="hidden md:block" />
              <span className="text-destructive decoration-destructive/30 line-through decoration-1 mx-1">
                tanpa arah
              </span>{" "}
              dan
              <span className="text-destructive decoration-destructive/30 line-through decoration-1 mx-1">
                tanpa penjagaan
              </span>
              .
            </p>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <p className="text-base md:text-lg">
              <strong className="font-display text-warning tracking-widest">
                UNLUPA
              </strong>
              <span className="text-muted-foreground font-light ml-2">
                hadir untuk mengubah "Lupa" menjadi "Terjaga".
              </span>
            </p>
          </div>
        </div>

        <div className="mt-16 pb-12">
          <button className="flex flex-col items-center gap-3 group cursor-pointer text-muted-foreground hover:text-warning transition-colors">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] group-hover:text-warning transition-colors">
              Pelajari Metodenya
            </span>
            <div className="w-10 h-10 rounded-lg border border-border group-hover:border-warning/50 flex items-center justify-center transition-colors">
              <div>
                <a href="#metode">
                  <ArrowDown className="w-5 h-5 animate-bounce group-hover:text-warning" />
                </a>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};
