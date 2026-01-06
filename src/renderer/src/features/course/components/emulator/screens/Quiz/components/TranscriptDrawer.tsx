import React, { useEffect, useState, useRef } from 'react';
import { X, AudioLines, Clock, User, ScanEye } from 'lucide-react';
import { folderService } from '../../../../../../../shared/services/folderService';
import { MediaPlayer } from './MediaPlayer';
import { DirectoryDrawer } from './DirectoryDrawer';

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

interface Dialogue {
  id: string;
  original: string;
  translation: string;
}

interface Segment {
  id: number;
  speaker: string;
  timestamps: {
    start: string;
    end: string;
  };
  dialogues: Dialogue[];
}

interface TranscriptData {
  metadata: any;
  transcript: Segment[];
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

  // Track active dialogue ID for manual translation toggle
  const [activeDialogueId, setActiveDialogueId] = useState<string | null>(null);

  // DirectoryDrawer state
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Long press handling
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const activeSegmentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen && transcriptPath) {
      setLoading(true);
      setError(null);
      folderService
        .parseCourseMetadata(transcriptPath)
        .then((result: any) => {
          if (result && Array.isArray(result.transcript)) {
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

  // Scroll active segment into view
  useEffect(() => {
    if (activeSegmentRef.current && isOpen) {
      activeSegmentRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [audioState.currentTime, isOpen]);

  const parseTime = (timeStr: string) => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  const handleSeek = (start: string) => {
    const seconds = parseTime(start);
    audioHandlers.seek(seconds);
    if (!audioState.isPlaying) {
      audioHandlers.togglePlay();
    }
  };

  const getWordFromPoint = (x: number, y: number): string | null => {
    // @ts-ignore - Webkit specific
    if (typeof document.caretRangeFromPoint !== 'undefined') {
      // @ts-ignore
      const range = document.caretRangeFromPoint(x, y);
      if (range && range.startContainer.nodeType === Node.TEXT_NODE) {
        const textNode = range.startContainer;
        const text = textNode.textContent || '';
        const offset = range.startOffset;

        let start = offset;
        let end = offset;

        while (start > 0 && /[\w'-]/.test(text[start - 1])) {
          start--;
        }

        while (end < text.length && /[\w'-]/.test(text[end])) {
          end++;
        }

        return text.substring(start, end);
      }
    } else if (typeof document.caretPositionFromPoint !== 'undefined') {
      // @ts-ignore
      const pos = document.caretPositionFromPoint(x, y);
      if (pos && pos.offsetNode.nodeType === Node.TEXT_NODE) {
        const textNode = pos.offsetNode;
        const text = textNode.textContent || '';
        const offset = pos.offset;

        let start = offset;
        let end = offset;

        while (start > 0 && /[\w'-]/.test(text[start - 1])) {
          start--;
        }

        while (end < text.length && /[\w'-]/.test(text[end])) {
          end++;
        }
        return text.substring(start, end);
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPress.current = false;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      const word = getWordFromPoint(e.clientX, e.clientY);
      if (word && word.length > 1) {
        setSelectedWord(word);
        setDirectoryOpen(true);
      }
    }, 500); // 500ms long press
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - startPos.current.x, 2) + Math.pow(e.clientY - startPos.current.y, 2),
      );
      if (dist > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = (dlgId: string, e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPress.current) {
      // It was a click, toggle translation
      e.stopPropagation();
      setActiveDialogueId((prev) => (prev === dlgId ? null : dlgId));
    }

    setTimeout(() => {
      isLongPress.current = false;
    }, 0);
  };

  const handlePointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isLongPress.current = false;
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

        <div className="flex-1 overflow-y-auto p-0 text-[hsl(var(--foreground))] bg-[hsl(var(--background))] pb-20 [&::-webkit-scrollbar]:hidden">
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
              {data.transcript.map((segment, index) => {
                const startTime = parseTime(segment.timestamps.start);
                const endTime = parseTime(segment.timestamps.end);
                const isSegmentActive =
                  audioState.currentTime >= startTime && audioState.currentTime < endTime;

                return (
                  <div
                    key={segment.id || index}
                    ref={isSegmentActive ? activeSegmentRef : null}
                    className={`px-6 py-4 transition-colors group relative border-l-4 ${
                      isSegmentActive
                        ? 'bg-[hsl(var(--primary))]/5 border-[hsl(var(--primary))]'
                        : 'border-transparent hover:bg-[hsl(var(--muted))]/30'
                    }`}
                  >
                    {/* Header: Speaker + Timestamp */}
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-center gap-2 text-[hsl(var(--primary))] font-semibold text-sm">
                        <User size={14} />
                        <span className="capitalize">{segment.speaker.replace(/_/g, ' ')}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-1.5 text-xs font-mono px-1.5 py-0.5 rounded transition-colors ${
                            isSegmentActive
                              ? 'text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/20'
                              : 'text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50'
                          }`}
                        >
                          <Clock size={12} />
                          <span>{segment.timestamps.start}</span>
                        </div>

                        {/* ScanEye Icon - Only visible when NOT active */}
                        {!isSegmentActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSeek(segment.timestamps.start);
                            }}
                            className="p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))]"
                            title="Jump to this segment"
                          >
                            <ScanEye size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-[15px] leading-relaxed text-[hsl(var(--foreground))]/90">
                      {segment.dialogues.map((dlg) => {
                        const isDialogueActive = activeDialogueId === dlg.id;

                        return (
                          <span key={dlg.id} className="inline group/dialogue">
                            {/* Original Text - Click to toggle translation, Long press for dictionary */}
                            <span
                              onPointerDown={handlePointerDown}
                              onPointerMove={handlePointerMove}
                              onPointerUp={(e) => handlePointerUp(dlg.id, e)}
                              onPointerCancel={handlePointerCancel}
                              onContextMenu={(e) => e.preventDefault()}
                              className="inline cursor-pointer hover:bg-[hsl(var(--muted))]/50 rounded px-1 -mx-1 transition-colors [&_p]:inline [&_p]:m-0"
                              dangerouslySetInnerHTML={{ __html: dlg.original }}
                            />

                            {/* Translation - Manual Toggle */}
                            {isDialogueActive && (
                              <span
                                className="inline ml-2 px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium italic text-sm [&_p]:inline [&_p]:m-0 animate-in fade-in zoom-in-95 duration-200 border border-[hsl(var(--border))]"
                                dangerouslySetInnerHTML={{ __html: `(${dlg.translation})` }}
                              />
                            )}
                            {/* Add a space after each dialogue */}
                            <span className="inline"> </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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

      {/* Directory Drawer for word lookup */}
      <DirectoryDrawer
        isOpen={directoryOpen}
        onClose={() => setDirectoryOpen(false)}
        word={selectedWord}
      />
    </>
  );
};
