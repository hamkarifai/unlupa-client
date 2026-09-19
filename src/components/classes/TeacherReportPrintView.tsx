import React from 'react';
import { ClassGroup, ClassStudent, UserProfile } from '../../types';

interface TeacherReportPrintViewProps {
  classGroup: ClassGroup;
  student: ClassStudent;
  teacher: UserProfile;
}

export const TeacherReportPrintView: React.FC<TeacherReportPrintViewProps> = ({ classGroup, student, teacher }) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-10 font-serif text-slate-900">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-2 uppercase">Laporan Evaluasi Santri</h1>
            <h2 className="text-xl font-medium text-slate-600">Sistem Manajemen Halaqah & Hafalan</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-1">Tanggal Cetak</div>
            <div className="text-lg font-bold">{currentDate}</div>
          </div>
        </div>

        {/* Student & Class Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Informasi Santri</div>
            <div className="text-2xl font-bold mb-1">{student.name}</div>
            <div className="text-sm font-mono text-slate-500">ID: {student.quranSpaceCode}</div>
          </div>
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Informasi Kelas</div>
            <div className="text-2xl font-bold mb-1">{classGroup.name}</div>
            <div className="text-sm text-slate-500">Pengampu: Ust. {teacher.fullName}</div>
          </div>
        </div>

        {/* Evaluation Summary Section */}
        <div className="mb-12">
          <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-6 uppercase tracking-wider">Ringkasan Capaian Hafalan</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="border border-slate-200 p-4 rounded-lg text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Kelancaran</div>
              <div className="text-xl font-bold text-emerald-600">Sangat Baik</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Tajwid</div>
              <div className="text-xl font-bold text-indigo-600">Berkembang</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Makharijul</div>
              <div className="text-xl font-bold text-blue-600">Lancar</div>
            </div>
            <div className="border border-slate-200 p-4 rounded-lg text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Kehadiran</div>
              <div className="text-xl font-bold text-slate-800">100%</div>
            </div>
          </div>
        </div>

        {/* Detailed Notes Section */}
        <div className="mb-16">
          <h3 className="text-lg font-bold border-b border-slate-200 pb-2 mb-6 uppercase tracking-wider">Catatan Evaluasi Pengajar</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-slate-800 pl-4 py-1">
              <p className="text-sm leading-relaxed mb-2">
                "Ananda menunjukkan perkembangan yang sangat signifikan pada kelancaran hafalan juz 30. Tajwid pada hukum nun mati dan tanwin sudah mulai terbiasa dipraktikkan dengan benar, namun perlu sedikit lebih fokus pada panjang mad thobi'i."
              </p>
              <div className="text-xs text-slate-500 font-medium">— Evaluasi Pekanan, 12 September 2026</div>
            </div>
            <div className="border-l-4 border-slate-300 pl-4 py-1">
              <p className="text-sm leading-relaxed mb-2 text-slate-600">
                "Alhamdulillah hafalan surah Al-Mulk lancar, makharijul huruf untuk huruf 'Ain dan Ha sudah jauh lebih baik dibandingkan bulan lalu."
              </p>
              <div className="text-xs text-slate-400 font-medium">— Evaluasi Pekanan, 5 September 2026</div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="flex justify-between items-end pt-12">
          <div className="text-center w-48">
            <div className="h-16 border-b border-slate-400 mb-2"></div>
            <div className="text-xs font-bold uppercase">Tanda Tangan Wali</div>
          </div>
          <div className="text-center w-48">
            <div className="h-16 border-b border-slate-400 mb-2"></div>
            <div className="text-xs font-bold uppercase">Ust. {teacher.fullName}</div>
            <div className="text-[10px] text-slate-500 mt-1">Pengampu Kelas</div>
          </div>
        </div>
      </div>
    </div>
  );
};
