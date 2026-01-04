import React, { useEffect, useState } from 'react';
import { X, AudioLines, Clock, User } from 'lucide-react';
import { folderService } from '../../../../../../../shared/services/folderService';
import { MediaPlayer } from './MediaPlayer';

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptPath?: string;
  audioState: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
  };
  audioHandlers: {
    togglePlay: () => void;
    seek: (time: number) => void;
  };
  audioTitle: string;
}

interface Segment {
  speaker: string;
  start: string;
  end: string;
  text: string;
}

interface TranscriptData {
  language_code: string;
  segments: Segment[];
}

export const TranscriptDrawer: React.FC<TranscriptDrawerProps> = ({
  isOpen,
  onClose,
  transcriptPath,
  audioState,
  audioHandlers,
  audioTitle,
}) => {
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && transcriptPath) {
      setLoading(true);
      setError(null);
      folderService
        .parseCourseMetadata(transcriptPath)
        .then((result) => {
          if (result && Array.isArray(result.segments)) {
            setData(result as TranscriptData);
          } else {
            setError('Invalid transcript format');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load transcript');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, transcriptPath]);

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  const handleSegmentClick = (start: string) => {
    const seconds = parseTime(start);
    audioHandlers.seek(seconds);
    if (!audioState.isPlaying) {
      audioHandlers.togglePlay();
    }
  };

  return (
    <>
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 h-[75%] bg-[hsl(var(--background))] rounded-t-3xl z-50 transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
        <div className="px-6 py-2 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <div className="flex items-center gap-2">
            <AudioLines size={18} className="text-[hsl(var(--primary))]" />
            <h3 className="font-bold text-lg">Transcript</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 text-[hsl(var(--foreground))] bg-[hsl(var(--background))] pb-20">
          {loading && (
            <div className="flex items-center justify-center h-40 text-[hsl(var(--muted-foreground))]">
              Loading...
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center h-40 text-red-500">{error}</div>
          )}

          {!loading && !error && data && (
            <div className="divide-y divide-[hsl(var(--border))]/30">
              {data.segments.map((segment, index) => (
                <div
                  key={index}
                  className="px-6 py-4 hover:bg-[hsl(var(--muted))]/30 transition-colors group cursor-pointer active:bg-[hsl(var(--muted))]/50"
                  onClick={() => handleSegmentClick(segment.start)}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <div className="flex items-center gap-2 text-[hsl(var(--primary))] font-semibold text-sm">
                      <User size={14} />
                      <span>{segment.speaker}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[hsl(var(--muted-foreground))] text-xs font-mono bg-[hsl(var(--muted))]/50 px-1.5 py-0.5 rounded group-hover:bg-[hsl(var(--primary))]/10 group-hover:text-[hsl(var(--primary))] transition-colors">
                      <Clock size={12} />
                      <span>{segment.start}</span>
                    </div>
                  </div>
                  <p className="text-[15px] leading-relaxed text-[hsl(var(--foreground))]/90">
                    {segment.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && !data && !transcriptPath && (
            <p className="text-center text-[hsl(var(--muted-foreground))] mt-10">
              No transcript available.
            </p>
          )}
        </div>

        {/* Embedded Media Player */}
        <div className="border-t border-[hsl(var(--border))]/50">
          <MediaPlayer
            title={audioTitle}
            isPlaying={audioState.isPlaying}
            currentTime={audioState.currentTime}
            duration={audioState.duration}
            onTogglePlay={audioHandlers.togglePlay}
            onSeek={audioHandlers.seek}
          />
        </div>
      </div>
    </>
  );
};
