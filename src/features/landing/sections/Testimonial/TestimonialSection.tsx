import { Activity } from "@/components/foundations/hugeicons";

export const TestimonialSection = () => {
  const logsLeft = [
    { initial: "A", name: "Abdullah F.", role: "Hafalan Terjaga", text: '"Dengan UNLUPA, rasa cemas hilang. Saya tahu persis mana ayat yang kuat, mana yang butuh perhatian."' },
    { initial: "H", name: "dr. Hasan", role: "Padat tapi Lancar", text: '"Jadwal praktik padat sering bikin hafalan lepas. Sistem ini menjaga saya tetap murajaah di sela-sela pasien."' },
    { initial: "R", name: "Rina S.", role: "Fokus Akademik", text: '"Fitur Load Control menyelamatkan semester saya. Bisa belajar banyak materi kedokteran tanpa burnout."' },
    { initial: "Z", name: "Zainab", role: "Bisnis & Quran", text: '"Bisnis jalan, hafalan aman. Notifikasi cerdasnya tahu kapan saya harus berhenti meeting sejenak untuk murajaah."' },
  ];
  const logsRight = [
    { initial: "U", name: "Ust. Hidayat", role: "Monitoring Santri", text: '"Saya bisa memantau perkembangan santri secara real-time. Tidak ada lagi tebak-tebakan siapa yang lancar."' },
    { initial: "D", name: "Dimas A.", role: "Efisiensi Waktu", text: '"Sebagai orang teknis, saya kagum. Tombol feedback kejujurannya benar-benar memaksa disiplin, hasilnya efisien."' },
    { initial: "S", name: "Sarah M.", role: "Daily Routine", text: "\"Fitur 'Daily Review' membuat saya tidak perlu mikir 'hari ini harus ulang apa'. Tinggal buka, kerjakan, selesai.\"" },
    { initial: "F", name: "Fajar", role: "Mutqin Target", text: "\"Akhirnya hafalan saya tidak 'bocor halus' lagi. Sistem ini menjaga apa yang sudah saya hafal agar tidak hilang.\"" },
  ];

  return (
    <section id="social-proof" className="relative w-full py-24 md:py-32">
      <div className="text-center mb-16 px-6">
        <p className="font-display text-primary text-xs tracking-[0.3em] uppercase mb-6 flex items-center justify-center gap-2">
          <Activity className="w-3 h-3" /> Live Data Logs
        </p>
        <h2 className="font-serif text-3xl md:text-5xl text-foreground mb-6 leading-tight tracking-tight">
          Gema <span className="text-primary italic">Penjaga</span>
        </h2>
        <p className="text-muted-foreground font-light text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Arus data dari mereka yang telah mengubah “kecemasan” menjadi “ketenangan”.
          <span className="text-xs text-muted-foreground/70 mt-2 block italic">(Sentuh kartu untuk membaca)</span>
        </p>
      </div>

      <div className="scroller mb-6 w-full overflow-x-auto overscroll-x-contain">
        <div className="scroller__inner flex w-max gap-4 px-6">
          {[...logsLeft, ...logsLeft].map((log, index) => (
            <div key={`left-${index}`} className="w-[320px] md:w-[360px] shrink-0 bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-bold text-foreground">{log.initial}</div>
                <div>
                  <h4 className="text-foreground font-serif text-sm font-semibold">{log.name}</h4>
                  <p className="text-[10px] text-primary font-mono uppercase tracking-widest">{log.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{log.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="scroller w-full overflow-x-auto overscroll-x-contain">
        <div className="scroller__inner flex w-max gap-4 px-6">
          {[...logsRight, ...logsRight].map((log, index) => (
            <div key={`right-${index}`} className="w-[320px] md:w-[360px] shrink-0 bg-card border border-border rounded-xl p-6 hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-muted border border-border flex items-center justify-center text-sm font-bold text-foreground">{log.initial}</div>
                <div>
                  <h4 className="text-foreground font-serif text-sm font-semibold">{log.name}</h4>
                  <p className="text-[10px] text-primary font-mono uppercase tracking-widest">{log.role}</p>
                </div>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{log.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
