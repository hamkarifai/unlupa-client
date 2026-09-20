import React, { useState } from 'react';
import { X, Sparkles, Loader2, BookOpen } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Language } from '../../types';

interface AIImportModalProps {
  onClose: () => void;
  onImport: (cards: { question: string; answer: string }[]) => void;
  language: Language;
}

export function AIImportModal({ onClose, onImport, language }: AIImportModalProps) {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim() && !text.trim()) {
      setError(language === 'en' ? 'Please provide a topic or text' : 'Harap berikan topik atau teks');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/generate-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, text, mode: 'formatted', language }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        if (response.status === 503) {
          throw new Error(language === 'en' ? 'The AI service is experiencing high demand. Please try again.' : 'Layanan AI sedang sibuk. Silakan coba lagi.');
        }
        throw new Error('Failed to parse server response');
      }
      
      if (!response.ok) {
        if (response.status === 503 || (data.error && data.error.includes('503'))) {
           throw new Error(language === 'en' ? 'The AI service is experiencing high demand. Please try again.' : 'Layanan AI sedang sibuk. Silakan coba lagi.');
        }
        throw new Error(data.error || 'Failed to generate');
      }
      if (data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
        onImport(data.cards);
      } else {
        setError(language === 'en' ? 'No cards could be generated.' : 'Gagal menghasilkan kartu.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with AI service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm sm:p-6">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {language === 'en' ? 'Generate Flashcards with AI' : 'Buat Kartu Hafalan dengan AI'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {language === 'en' ? 'Let AI create cards from your topic or notes.' : 'Biarkan AI membuatkan kartu dari topik atau catatan Anda.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'en' ? 'Topic (Optional)' : 'Topik (Opsional)'}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={language === 'en' ? 'e.g., Photosynthesis, World War 2' : 'Cth: Fotosintesis, Sejarah Kemerdekaan'}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'en' ? 'Q&A Text / Pairs' : 'Teks Q&A (Tanya Jawab)'}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={language === 'en' ? 'Paste your Q&A pairs here (e.g. Q: What is X?\nA: It is Y.)' : 'Tempelkan pasangan tanya jawab (Cth: T: Apa itu X?\nJ: Itu Y.)'}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none resize-none h-40"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>
          <button
            onClick={handleGenerate}
            disabled={isLoading || (!topic.trim() && !text.trim())}
            className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{language === 'en' ? 'Generating...' : 'Membuat...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{language === 'en' ? 'Generate Flashcards' : 'Buat Kartu'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
