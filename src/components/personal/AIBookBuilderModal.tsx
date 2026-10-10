import { useState, useEffect, type FormEvent } from 'react';
import { Sparkles } from "@/components/foundations/hugeicons";
import type { Language } from '../../types';
import { personalService } from '@/features/personal/services/personal.services';
import { Dialog, Modal, ModalOverlay } from '@/components/application/modals/modal';
import { InlineAlert } from '@/components/base/alert/alert';
import { Badge } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { CloseButton } from '@/components/base/buttons/close-button';
import { Input } from '@/components/base/input/input';
import { TextArea } from '@/components/base/textarea/textarea';

interface GeneratedBookData {
  title: string;
  description?: string;
  chapters: Array<{
    title: string;
    cards?: Array<{ question: string; answer: string }>;
  }>;
}

interface AIBookBuilderModalProps {
  onClose: () => void;
  onImport: (bookData: GeneratedBookData) => void | Promise<void>;
  language: Language;
}

const WEEKLY_AI_BOOK_LIMIT = 3;

export function AIBookBuilderModal({ onClose, onImport, language }: AIBookBuilderModalProps) {
  const [topic, setTopic] = useState('');
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [weeklyUsage, setWeeklyUsage] = useState<{ limit: number; used: number; remaining: number }>({
    limit: WEEKLY_AI_BOOK_LIMIT,
    used: 0,
    remaining: WEEKLY_AI_BOOK_LIMIT,
  });

  useEffect(() => {
    let isMounted = true;
    const fetchUsage = async () => {
      try {
        const res = await personalService.getAIBookUsage();
        if (isMounted && res?.data) {
          setWeeklyUsage({
            limit: res.data.limit ?? WEEKLY_AI_BOOK_LIMIT,
            used: res.data.used ?? 0,
            remaining: res.data.remaining ?? Math.max(0, (res.data.limit ?? WEEKLY_AI_BOOK_LIMIT) - (res.data.used ?? 0)),
          });
        }
      } catch (e) {
        // Fallback or ignore
      }
    };
    fetchUsage();
    return () => {
      isMounted = false;
    };
  }, []);

  const remainingGenerations = weeklyUsage.remaining;
  const isLimitReached = remainingGenerations <= 0;

  const handleGenerate = async (event: FormEvent) => {
    event.preventDefault();
    if (isLimitReached) {
      setError(
        language === 'en'
          ? 'Weekly limit reached (max 3 AI books per week).'
          : 'Batas mingguan telah tercapai (maksimal 3x buat buku dengan AI per minggu).'
      );
      return;
    }

    if (!topic.trim() && !text.trim()) {
      setError(language === 'en' ? 'Add a topic or paste source notes first.' : 'Tambahkan topik atau tempel catatan sumber terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await personalService.generateAIBook({ topic: topic.trim(), text: text.trim(), language });
      const book = response?.data?.book as GeneratedBookData | undefined;
      if (!book?.title || !Array.isArray(book.chapters)) {
        setError(language === 'en' ? 'AI did not return a complete book. Try adding more specific notes.' : 'AI belum menghasilkan kitab yang lengkap. Coba tambahkan catatan yang lebih spesifik.');
        return;
      }
      if (typeof response?.data?.remaining === 'number') {
        setWeeklyUsage(prev => ({
          ...prev,
          used: response.data.used ?? prev.used + 1,
          remaining: response.data.remaining ?? Math.max(0, prev.remaining - 1),
        }));
      }
      await onImport(book);
    } catch (error) {
      const requestError = error as { response?: { data?: { message?: string } }; message?: string };
      setError(requestError.response?.data?.message || requestError.message || (language === 'en' ? 'Could not reach the AI service.' : 'Layanan AI tidak dapat dihubungi.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalOverlay isOpen isDismissable={!isLoading} onOpenChange={open => { if (!open && !isLoading) onClose(); }}>
      <Modal className="max-w-xl overflow-hidden rounded-t-3xl sm:rounded-3xl">
        <Dialog aria-label={language === 'en' ? 'Build a book with AI' : 'Buat kitab dengan AI'}>
          {({ close }) => (
            <form onSubmit={handleGenerate} className="flex max-h-[inherit] flex-col">
              <div className="relative flex shrink-0 items-start gap-3 border-b border-secondary px-5 py-5 sm:px-6">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-200 ring-inset">
                  <Sparkles className="size-5" />
                </div>
                <div className="min-w-0 pr-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-primary">{language === 'en' ? 'Build with AI' : 'Buat dengan AI'}</h2>
                    <Badge color={remainingGenerations > 0 ? "brand" : "warning"} size="sm">
                      {remainingGenerations}/{weeklyUsage.limit} {language === 'en' ? 'left this week' : 'tersisa minggu ini'}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-secondary">
                    {language === 'en' ? 'Turn a topic or source notes into a structured book and review cards.' : 'Ubah topik atau catatan sumber menjadi kitab terstruktur dan kartu murajaah.'}
                  </p>
                </div>
                <CloseButton label={language === 'en' ? 'Close AI builder' : 'Tutup AI builder'} onPress={close} isDisabled={isLoading} className="absolute right-4 top-4" />
              </div>

              <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
                {isLimitReached && (
                  <InlineAlert
                    variant="warning"
                    title={language === 'en' ? 'Weekly Limit Reached' : 'Batas Mingguan Tercapai'}
                    description={language === 'en' ? 'You have reached the limit of 3 AI book generations per week. Please try again next week.' : 'Anda telah mencapai batas 3x pembuatan buku dengan AI per minggu. Silakan coba lagi minggu depan.'}
                  />
                )}
                {error && <InlineAlert variant="error" title={error} onDismiss={() => setError(null)} />}
                <Input
                  label={language === 'en' ? 'Topic' : 'Topik'}
                  value={topic}
                  onChange={value => { setTopic(value); if (error) setError(null); }}
                  placeholder={language === 'en' ? 'Example: Foundations of Arabic grammar' : 'Contoh: Dasar-dasar nahwu'}
                  hint={language === 'en' ? 'Optional when you provide detailed notes below.' : 'Opsional jika Anda memberikan catatan lengkap di bawah.'}
                  isDisabled={isLimitReached || isLoading}
                />
                <TextArea
                  label={language === 'en' ? 'Source notes or Q&A pairs' : 'Catatan sumber atau pasangan tanya-jawab'}
                  value={text}
                  onChange={value => { setText(value); if (error) setError(null); }}
                  placeholder={language === 'en' ? 'Paste notes, an outline, or Q: / A: pairs here...' : 'Tempel catatan, kerangka, atau pasangan T: / J: di sini...'}
                  rows={8}
                  hint={language === 'en' ? 'More context produces a more accurate chapter structure.' : 'Konteks yang lebih lengkap menghasilkan struktur bab yang lebih akurat.'}
                  isDisabled={isLimitReached || isLoading}
                />
                <InlineAlert
                  variant="info"
                  title={language === 'en' ? 'Review before studying' : 'Periksa sebelum belajar'}
                  description={language === 'en' ? 'AI-generated chapters and cards will be added as an editable personal book (limit: 3x per week).' : 'Bab dan kartu hasil AI akan ditambahkan sebagai kitab pribadi yang dapat diedit (kuota: 3x per minggu).'}
                />
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-secondary bg-secondary px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <Button color="secondary" size="md" onPress={close} isDisabled={isLoading} className="w-full sm:w-auto">{language === 'en' ? 'Cancel' : 'Batal'}</Button>
                <Button type="submit" size="md" iconLeading={Sparkles} isLoading={isLoading} isDisabled={isLimitReached || (!topic.trim() && !text.trim())} className="w-full sm:w-auto">
                  {language === 'en' ? 'Generate book' : 'Buat kitab'}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
