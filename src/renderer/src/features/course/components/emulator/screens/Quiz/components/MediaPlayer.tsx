import React, { useEffect, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface MediaPlayerProps {
  title: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({
  title,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onSeek,
}) => {
  const [progress, setProgress] = useState(0);

  // Sync progress with currentTime/duration
  useEffect(() => {
    if (duration > 0) {
      setProgress((currentTime / duration) * 100);
    } else {
      setProgress(0);
    }
  }, [currentTime, duration]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percentage = clickX / width;
    const newTime = percentage * duration;
    onSeek(newTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]/50  px-4 py-3 pb-safe-bottom z-20">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[hsl(var(--muted))] active:scale-95 transition-all"
        >
          {isPlaying ? (
            <Pause size={24} className="text-[hsl(var(--primary))] fill-current" />
          ) : (
            <Play size={24} className="text-[hsl(var(--primary))] fill-current ml-1" />
          )}
        </button>

        {/* Info & Progress */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-[hsl(var(--foreground))] truncate mb-1 leading-none">
            {title || 'Audio'}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] w-8 text-right">
              {formatTime(currentTime)}
            </span>

            <div
              className="relative flex-1 h-3 group flex items-center cursor-pointer"
              onClick={handleSeek}
            >
              {/* Track */}
              <div className="absolute inset-0 m-auto h-[3px] bg-[hsl(var(--border))] rounded-full w-full">
                {/* Active Track */}
                <div
                  className="h-full bg-[hsl(var(--primary))] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Thumb */}
              <div
                className="absolute w-3 h-3 bg-[hsl(var(--primary))] rounded-full hover:scale-125 transition-transform"
                style={{ left: `${progress}%`, marginLeft: '-6px' }}
              />
            </div>

            <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] w-8">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
