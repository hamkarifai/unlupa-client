import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, ShieldCheck } from 'lucide-react';

export const PublicReportViewer: React.FC = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reportParam = params.get('report');
    
    if (reportParam) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(reportParam)));
        setData(decoded);
      } catch (e) {
        console.error("Failed to parse report data", e);
      }
    }
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Link laporan tidak valid atau rusak.
      </div>
    );
  }

  const printDate = (() => {
    try {
      if (data.date && !isNaN(new Date(data.date).getTime())) {
        return new Date(data.date).toLocaleDateString('id-ID', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
      }
    } catch (e) { /* ignore */ }
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  })();

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-6 sm:py-12 px-4 sm:px-6 font-serif">
      <div className="bg-white max-w-4xl w-full shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
        
        {/* Banner */}
        <div className="bg-indigo-900 text-white p-8 sm:p-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 uppercase text-indigo-50">Laporan Evaluasi Santri</h1>
            <h2 className="text-indigo-200 font-medium">Sistem Manajemen Halaqah & Hafalan</h2>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">Tanggal Terbit</div>
            <div className="text-lg font-bold text-white">{printDate}</div>
          </div>
        </div>

        <div className="p-8 sm:p-12">
          {/* Student & Class Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-12">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Informasi Santri</div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{data.studentName}</div>
              <div className="text-sm font-mono text-slate-500">ID: {data.studentId}</div>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Informasi Kelas</div>
              <div className="text-2xl font-bold text-slate-900 mb-1">{data.className}</div>
              <div className="text-sm text-slate-600 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Pengampu: Ust. {data.teacherName}
              </div>
            </div>
          </div>

          {/* Evaluation Summary Section */}
          <div className="mb-12">
            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Ringkasan Capaian Hafalan
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-center shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 mb-2">Kelancaran</div>
                <div className="text-xl font-black text-emerald-700">Sangat Baik</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-center shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-600/70 mb-2">Tajwid</div>
                <div className="text-xl font-black text-indigo-700">Berkembang</div>
              </div>
              <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-center shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600/70 mb-2">Makharijul</div>
                <div className="text-xl font-black text-blue-700">Lancar</div>
              </div>
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl text-center shadow-sm">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Kehadiran</div>
                <div className="text-xl font-black text-slate-800">100%</div>
              </div>
            </div>
          </div>

          {/* Detailed Notes Section */}
          <div className="mb-16">
            <h3 className="text-lg font-bold text-slate-800 border-b-2 border-slate-100 pb-3 mb-6 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Catatan Evaluasi Pengajar
            </h3>
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                <p className="text-base leading-relaxed text-slate-700 italic mb-3">
                  "Ananda menunjukkan perkembangan yang sangat signifikan pada kelancaran hafalan. Tajwid pada hukum nun mati dan tanwin sudah mulai terbiasa dipraktikkan dengan benar, namun perlu sedikit lebih fokus pada panjang mad thobi'i."
                </p>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">— Evaluasi Pekan Ini</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 opacity-80">
                <p className="text-base leading-relaxed text-slate-600 italic mb-3">
                  "Alhamdulillah hafalan pekan lalu lancar, makharijul huruf untuk huruf 'Ain dan Ha sudah jauh lebih baik dibandingkan bulan lalu."
                </p>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">— Evaluasi Pekan Sebelumnya</div>
              </div>
            </div>
          </div>

          {/* Action to Download */}
          <div className="flex justify-center pt-8 border-t border-slate-200">
            <button 
              onClick={() => window.print()}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 print:hidden"
            >
              Simpan PDF / Cetak Laporan
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};
