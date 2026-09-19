import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { AudioStorageService, AudioRecord } from '../../lib/AudioStorageService';

interface Props {
  itemId: string | number;
  itemType: 'quran' | 'book';
  itemLabel: string;
  language?: 'id' | 'en' | 'ar';
  compact?: boolean;
  variant?: 'default' | 'card' | 'mushaf-dock';
  onHasRecordingChange?: (hasRecording: boolean) => void;
  onOpenFeedback?: () => void;
}

const SPEED_PRESETS = [0.75, 0.85, 1.0, 1.25, 1.5, 2.0];

export const AudioRecorderPlayer: React.FC<Props> = ({
  itemId,
  itemType,
  itemLabel,
  language = 'id',
  compact = false,
  variant = 'default',
  onHasRecordingChange,
  onOpenFeedback
}) => {
  const [record, setRecord] = useState<AudioRecord | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Recorder states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [micError, setMicError] = useState<string | null>(null);

  // Player states
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);

  // Load existing recording for this item
  const loadRecording = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await AudioStorageService.getAudio(itemId);
      if (data) {
        setRecord(data);
        const newUrl = AudioStorageService.getCachedBlobUrl(itemId, data.audioBlob);
        setAudioUrl(newUrl);
        setDuration(data.duration);
        setCurrentTime(0);
        setIsPlaying(false);
        if (onHasRecordingChange) onHasRecordingChange(true);
      } else {
        setRecord(null);
        setAudioUrl(null);
        setCurrentTime(0);
        setDuration(0);
        setIsPlaying(false);
        if (onHasRecordingChange) onHasRecordingChange(false);
      }
    } catch (err) {
      console.error('Failed to load recording:', err);
    } finally {
      setIsLoading(false);
    }
  }, [itemId, onHasRecordingChange]);

  useEffect(() => {
    // If itemId changes while recording, cancel the ongoing recording to prevent cross-contamination
    if (isRecording) {
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
        recordTimerRef.current = null;
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsRecording(false);
      audioChunksRef.current = [];
    }
    
    loadRecording();

    // Listen to custom audio update events
    const handleAudioUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ itemId: string | number }>;
      if (String(customEvent.detail?.itemId) === String(itemId)) {
        loadRecording();
      }
    };

    window.addEventListener('audio-updated', handleAudioUpdate);
    return () => {
      window.removeEventListener('audio-updated', handleAudioUpdate);
    };
  }, [itemId, loadRecording]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  // Keyboard shortcut listener for Mushaf Dock (Spacebar = Play/Pause, Left/Right = Seek -5s/+5s)
  useEffect(() => {
    if (variant !== 'mushaf-dock' || !record) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        jumpSeconds(-5);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        jumpSeconds(5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [variant, record, isPlaying, duration]);

  // Handle Recording Start
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

            let options: any;
      if (typeof MediaRecorder !== 'undefined' && typeof MediaRecorder.isTypeSupported === 'function') {
        const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac'];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            options = { mimeType: t };
            break;
          }
        }
      }
      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || (options ? options.mimeType : (audioChunksRef.current[0] ? audioChunksRef.current[0].type : 'audio/webm'));
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const finalDuration = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

        if (audioBlob.size > 0) {
          await AudioStorageService.saveAudio(itemId, audioBlob, finalDuration);
          await loadRecording();
        }

        // Clean stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);
      startTimeRef.current = Date.now();

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);

    } catch (err: unknown) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      console.error('Microphone access denied:', err);
      const errorMsg = (err as Error)?.message || '';
      if (errorMsg.includes('Permission denied') || errorMsg.includes('NotAllowedError')) {
        setMicError(
          language === 'en' 
            ? 'Mic permission denied' 
            : 'Izin mic ditolak'
        );
      } else {
        setMicError(
          language === 'en' 
            ? 'Mic unavailable' 
            : 'Mic tidak tersedia'
        );
      }
      setIsRecording(false);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Cancel Recording
  const cancelRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  // Audio Playback Controls
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (!duration && audioRef.current.duration) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const jumpSeconds = (delta: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(audioRef.current.currentTime + delta, duration || 9999));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Direct delete handler without confirmation step
  const handleDeleteAudio = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    await AudioStorageService.deleteAudio(itemId);
    await loadRecording();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2 text-xs text-slate-400">
        <Clock className="w-3.5 h-3.5 animate-spin mr-1.5 text-indigo-500" />
        <span>{language === 'en' ? 'Loading audio...' : 'Memuat audio...'}</span>
      </div>
    );
  }

  const recordingTitle = language === 'en' ? 'Voice Recording' : 'Rekaman Suara';
  const recordingText = language === 'en' ? `Recording ${itemLabel}...` : `Merekam setoran ${itemLabel}...`;

  // ==========================================
  // VARIANT 1: MUSHAF DOCK (Ultra-Compact Single-Row Bar)
  // Specially optimized for listening while viewing the full 15-line Mushaf
  // ==========================================
  if (variant === 'mushaf-dock') {
    if (isRecording) {
      return (
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full h-11 px-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
            </span>
            <span className="font-mono text-xs font-bold text-rose-400 shrink-0">
              {AudioStorageService.formatAudioDuration(recordSeconds)}
            </span>
            <span className="text-xs text-slate-300 font-medium truncate">
              {recordingText}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {language === 'en' ? 'Cancel' : 'Batal'}
            </button>
            <button
              type="button"
              onClick={stopRecording}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Square className="w-3 h-3 fill-white" />
              <span>{language === 'en' ? 'Stop & Save' : 'Selesai & Simpan'}</span>
            </button>
          </div>
        </div>
      );
    }

    if (record && audioUrl) {
      return (
        <div className="w-full flex items-center justify-between gap-2 sm:gap-3 h-11 px-1">
          <audio
            ref={audioRef}
            src={audioUrl || undefined}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleAudioEnded}
            preload="metadata"
          />

          {/* Left: Play/Pause, Jump 5s, Time */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={togglePlay}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm cursor-pointer active:scale-95 ${
                isPlaying 
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-emerald-500/20' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20'
              }`}
              title={isPlaying ? 'Pause (Spasi)' : 'Putar (Spasi)'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/80">
              <button
                type="button"
                onClick={() => jumpSeconds(-5)}
                className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Mundur 5 detik (Shortcut: Panah Kiri)"
              >
                -5s
              </button>
              <button
                type="button"
                onClick={() => jumpSeconds(5)}
                className="px-1.5 py-0.5 rounded text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Maju 5 detik (Shortcut: Panah Kanan)"
              >
                +5s
              </button>
            </div>

            <div className="hidden sm:flex items-center font-mono text-[11px] font-semibold text-slate-300">
              <span className="text-white">{AudioStorageService.formatAudioDuration(currentTime)}</span>
              <span className="text-slate-500 mx-1">/</span>
              <span className="text-slate-400">{AudioStorageService.formatAudioDuration(duration || record.duration)}</span>
            </div>
          </div>

          {/* Center: Audio Seekbar Slider */}
          <div className="flex-1 min-w-[60px] sm:min-w-[120px] flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={duration || record.duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="w-full accent-indigo-400 h-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition-colors"
              title="Geser posisi pemutaran audio"
            />
            <span className="sm:hidden font-mono text-[10px] text-slate-400 shrink-0">
              {AudioStorageService.formatAudioDuration(currentTime)}
            </span>
          </div>

          {/* Center-Right: Quick Issue Tracking / Error Note Button */}
          {onOpenFeedback && (
            <button
              type="button"
              onClick={() => {
                if (isPlaying && audioRef.current) {
                  audioRef.current.pause();
                  setIsPlaying(false);
                }
                onOpenFeedback();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
              title={language === 'en' ? 'Pause audio and log mistakes/tajwid issue on this page' : 'Pause audio & catat letak kesalahan (makhraj/tajwid) halaman ini'}
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden md:inline">{language === 'en' ? 'Log Mistake' : 'Catat Kesalahan'}</span>
              <span className="md:hidden">{language === 'en' ? 'Note' : 'Koreksi'}</span>
            </button>
          )}

          {/* Right: Speed cycle, Retake, Delete */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Speed Cycle Button */}
            <button
              type="button"
              onClick={() => {
                const nextIndex = (SPEED_PRESETS.indexOf(playbackSpeed) + 1) % SPEED_PRESETS.length;
                changeSpeed(SPEED_PRESETS[nextIndex]);
              }}
              className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono font-bold text-amber-300 transition-colors cursor-pointer"
              title="Klik untuk mengubah kecepatan putar"
            >
              {playbackSpeed}×
            </button>

            {/* Retake Button */}
            <button
              type="button"
              onClick={startRecording}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title={language === 'en' ? 'Record again' : 'Rekam Ulang'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Direct Delete Button without confirmation step */}
            <button
              type="button"
              onClick={handleDeleteAudio}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition-colors cursor-pointer"
              title={language === 'en' ? 'Delete recording' : 'Hapus rekaman'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      );
    }

    // Idle in Mushaf Dock
    return (
      <div className="w-full flex items-center justify-between gap-3 h-11 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 flex items-center justify-center shrink-0">
            <Mic className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-2 truncate">
            <span className="text-xs font-semibold text-slate-200">
              {recordingTitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onOpenFeedback && (
            <button
              type="button"
              onClick={onOpenFeedback}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              title="Buka catatan kesalahan/evaluasi halaman ini"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Catat Koreksi</span>
            </button>
          )}
          {micError && (
            <span className="text-[11px] text-rose-400 font-medium max-w-[150px] truncate">{micError}</span>
          )}
          <button
            type="button"
            onClick={startRecording}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Record Voice' : 'Mulai Rekam'}</span>
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // VARIANT 2: CARD / DRAWER / FEEDBACK MODAL
  // Super-Compact, Highly Ordered, Disciplined Layout
  // ==========================================

  // 1. STATE: RECORDING IN PROGRESS (CARD)
  if (isRecording) {
    return (
      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 animate-in fade-in duration-150">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
          </span>
          <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400 shrink-0">
            {AudioStorageService.formatAudioDuration(recordSeconds)}
          </span>
          <span className="text-xs text-rose-900 dark:text-rose-200 font-medium truncate">
            {language === 'en' ? 'Recording...' : 'Sedang merekam...'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={cancelRecording}
            className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 hover:bg-rose-100/60 dark:hover:bg-rose-900/30 transition-colors cursor-pointer"
          >
            {language === 'en' ? 'Cancel' : 'Batal'}
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>{language === 'en' ? 'Save' : 'Simpan'}</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. STATE: RECORDED / PLAYBACK (CARD)
  if (record && audioUrl) {
    return (
      <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-850/90 border border-slate-200 dark:border-slate-800 space-y-2">
        <audio
          ref={audioRef}
          src={audioUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          preload="metadata"
        />

        {/* Row 1: Seekbar with Time Labels */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0 min-w-[30px]">
            {AudioStorageService.formatAudioDuration(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || record.duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
          />
          <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 shrink-0 min-w-[30px] text-right">
            {AudioStorageService.formatAudioDuration(duration || record.duration)}
          </span>
        </div>

        {/* Row 2: Controls Row (Single line, strictly ordered) */}
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          {/* Left: Play/Pause, -5s, +5s */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={togglePlay}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-2xs cursor-pointer active:scale-95 ${
                isPlaying 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
              title={isPlaying ? 'Pause' : 'Putar'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white ml-0.5" />}
            </button>

            <div className="flex items-center bg-white dark:bg-slate-800 rounded-md p-0.5 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => jumpSeconds(-5)}
                className="px-1 py-0.5 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Mundur 5 detik"
              >
                -5s
              </button>
              <button
                type="button"
                onClick={() => jumpSeconds(5)}
                className="px-1 py-0.5 rounded text-[10px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title="Maju 5 detik"
              >
                +5s
              </button>
            </div>
          </div>

          {/* Right: Speed cycle, Retake, Delete */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Speed Cycle Button */}
            <button
              type="button"
              onClick={() => {
                const nextIndex = (SPEED_PRESETS.indexOf(playbackSpeed) + 1) % SPEED_PRESETS.length;
                changeSpeed(SPEED_PRESETS[nextIndex]);
              }}
              className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Kecepatan putar"
            >
              {playbackSpeed}×
            </button>

            {/* Retake Button */}
            <button
              type="button"
              onClick={startRecording}
              className="p-1 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              title={language === 'en' ? 'Record again' : 'Rekam Ulang'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Direct Delete Button without confirmation step */}
            <button
              type="button"
              onClick={handleDeleteAudio}
              className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
              title={language === 'en' ? 'Delete recording' : 'Hapus rekaman'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. STATE: IDLE (NO RECORDING YET - CARD)
  return (
    <div className="px-2.5 py-1.5 rounded-xl bg-slate-50/80 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Mic className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 whitespace-nowrap">
            {recordingTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {micError && (
          <span className="text-[10px] text-rose-500 font-medium truncate max-w-[120px]">{micError}</span>
        )}
        <button
          type="button"
          onClick={startRecording}
          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 transition-all shadow-2xs cursor-pointer active:scale-95"
        >
          <Mic className="w-3 h-3" />
          <span>{language === 'en' ? 'Record' : 'Mulai Rekam'}</span>
        </button>
      </div>
    </div>
  );
};
