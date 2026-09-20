import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { getQuranPageAudioUrl } from '../../data/quranData';

interface Props {
  pageNumber: number;
}

export const MurottalPlayer: React.FC<Props> = ({ pageNumber }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const audioUrl = getQuranPageAudioUrl(pageNumber);

  useEffect(() => {
    // Reset when page changes
    setIsPlaying(false);
    setIsLoading(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [pageNumber]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Audio playback error:", err);
          setIsLoading(false);
          setIsPlaying(false);
        });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex items-center gap-1.5 bg-slate-800/80 rounded-full px-2 py-1 border border-slate-700">
      <audio 
        ref={audioRef} 
        src={audioUrl} 
        onEnded={() => setIsPlaying(false)}
        preload="none"
      />
      
      <button
        onClick={togglePlay}
        disabled={isLoading}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50"
        title={isPlaying ? "Jeda Murottal" : "Putar Murottal (Mishary Alafasy)"}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>

      <button
        onClick={toggleMute}
        className="w-6 h-6 flex items-center justify-center rounded-full text-slate-400 hover:text-white transition-colors"
        title={isMuted ? "Bunyikan" : "Bisukan"}
      >
        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
};
