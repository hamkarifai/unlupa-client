import React, { useState, useEffect, useRef } from 'react';
import { Book, Language } from '../../types';
import { Image as ImageIcon, X, UploadCloud } from 'lucide-react';
import { uploadImageToStorage } from '../../lib/imageUtils';

interface BookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; coverUrl?: string; isPublic: boolean; category?: string }) => void;
  initialData?: Partial<Book>;
  language: Language;
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen, onClose, onSubmit, initialData, language
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    coverUrl: '',
    isPublic: false,
  });
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setForm({
        title: initialData?.title || '',
        description: initialData?.description || '',
        coverUrl: initialData?.coverUrl || '',
        isPublic: initialData?.isPublic || false,
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    onSubmit({
      title: form.title,
      description: form.description,
      coverUrl: form.coverUrl || undefined,
      isPublic: form.isPublic,
      category: initialData?.category || 'General',
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      const storageUrl = await uploadImageToStorage(file);
      setForm(prev => ({ ...prev, coverUrl: storageUrl }));
    } catch (err) {
      console.error('Image upload failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {initialData ? (language === 'en' ? 'Edit Book' : 'Edit Buku') : (language === 'en' ? 'Create New Book' : 'Buat Buku Baru')}
          </h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'en' ? 'Book Title *' : 'Judul Buku *'}
            </label>
            <input
              type="text"
              required
              placeholder={language === 'en' ? 'e.g. Arabic Vocabulary' : 'mis. Kosakata Bahasa Arab'}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'en' ? 'Description (Optional)' : 'Deskripsi (Opsional)'}
            </label>
            <textarea
              rows={2}
              placeholder={language === 'en' ? 'What is this book about?' : 'Tentang apa buku ini?'}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {language === 'en' ? 'Cover Image' : 'Gambar Sampul'}
            </label>
            <div className="flex items-center gap-4 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-medium transition-colors border border-slate-200 dark:border-slate-700 w-full justify-center cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                {language === 'en' ? 'Upload Image' : 'Unggah Gambar'}
              </button>
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            </div>
            {form.coverUrl && (
              <div className="mt-3 relative w-32 h-40 mx-auto rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm group">
                <img src={form.coverUrl} alt="Preview Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setForm({...form, coverUrl: ''})} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="submit"
              disabled={!form.title.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {language === 'en' ? 'Save Book' : 'Simpan Buku'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
