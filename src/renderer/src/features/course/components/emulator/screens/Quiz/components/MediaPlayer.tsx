import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface MediaPlayerProps {
  audioPath: string;
  title: string;
}

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ audioPath, title }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [duration, setDuration] = useState(60); // Mock duration in seconds
  const [currentTime, setCurrentTime] = useState(0);

  // Mock audio simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  useEffect(() => {
    setProgress((currentTime / duration) * 100);
  }, [currentTime, duration]);

  // Reset when audio source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setProgress(0);
    // In a real app, we'd load the audio duration here
  }, [audioPath]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  return (
    <div className="bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]/50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4 py-3 pb-safe-bottom z-20">
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
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

            <div className="relative flex-1 h-3 group flex items-center cursor-pointer">
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
                className="absolute w-3 h-3 bg-[hsl(var(--primary))] rounded-full shadow-sm hover:scale-125 transition-transform"
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
