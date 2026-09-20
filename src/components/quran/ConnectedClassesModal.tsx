import React, { useState } from 'react';
import { X, Users, LogOut, Search, Info } from 'lucide-react';
import { ClassGroup } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: 'en' | 'id' | 'ar';
  connectedClasses: ClassGroup[];
  onLeaveClass: (classId: string) => void;
}

export const ConnectedClassesModal: React.FC<Props> = ({ isOpen, onClose, language, connectedClasses, onLeaveClass }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  if (!isOpen) return null;

  const filteredClasses = connectedClasses.filter(c => 
    (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
    (c.teacherName || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                {language === 'en' ? 'Connected Classes' : 'Kelas Terhubung'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'en' 
                  ? `${connectedClasses.length} class(es) currently tracking your progress` 
                  : `${connectedClasses.length} kelas memantau progres Anda`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={language === 'en' ? "Search classes or teachers..." : "Cari kelas atau pengajar..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl pl-9 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 dark:text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="p-4 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/50">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                <Info className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                {searchTerm 
                  ? (language === 'en' ? 'No classes match your search.' : 'Tidak ada kelas yang cocok.')
                  : (language === 'en' ? 'You are not connected to any classes.' : 'Anda belum terhubung ke kelas manapun.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredClasses.map(cls => (
                <div key={cls.id} className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                        {cls.type === 'quran' ? 'Al-Qur\'an' : 'Materi Umum'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{cls.code}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{cls.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {language === 'en' ? 'Teacher:' : 'Pengajar:'} <span className="font-semibold text-slate-700 dark:text-slate-300">{cls.teacherName}</span>
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (confirm(language === 'en' ? `Are you sure you want to leave ${cls.name}?` : `Yakin ingin keluar dari kelas ${cls.name}?`)) {
                        onLeaveClass(cls.id);
                      }
                    }}
                    className="shrink-0 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex flex-col items-center gap-1 group"
                    title={language === 'en' ? 'Leave Class' : 'Keluar Kelas'}
                  >
                    <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">{language === 'en' ? 'Leave' : 'Keluar'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
