import React, { useEffect, useState } from 'react';
import { X, Book, Volume2, Globe } from 'lucide-react';
import { directoryStorage, DirectoryEntry } from '../services/directoryStorage';

interface DirectoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  word: string | null;
}

export const DirectoryDrawer: React.FC<DirectoryDrawerProps> = ({ isOpen, onClose, word }) => {
  const [entry, setEntry] = useState<DirectoryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [storageStats, setStorageStats] = useState({ count: 0, size: '0 B' });

  useEffect(() => {
    // Initial size
    setStorageStats(directoryStorage.getStats());

    // Subscribe to changes
    const unsubscribe = directoryStorage.subscribe(() => {
      setStorageStats(directoryStorage.getStats());
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen && word) {
      setLoading(true);
      setError(null);
      setEntry(null);

      const fetchWord = async () => {
        const result = await directoryStorage.fetchAndSave(word);
        if (result) {
          setEntry(result);
        } else {
          setError(`Could not find definition for "${word}"`);
        }
        setLoading(false);
      };

      fetchWord();
    }
  }, [isOpen, word]);

  const playAudio = (url?: string) => {
    if (url) {
      new Audio(url).play().catch((e) => console.error('Audio play failed', e));
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[75%] bg-[hsl(var(--background))] rounded-t-3xl z-[70] transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />

        {/* Header */}
        <div className="px-6 py-2 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <div className="flex items-center gap-2">
            <Book size={18} className="text-[hsl(var(--primary))]" />
            <h3 className="font-bold text-lg max-w-[200px] truncate">Dictionary</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Storage Badge */}
            <div className="flex items-center gap-1 bg-[hsl(var(--muted))] px-2 py-0.5 rounded-full text-xs font-medium text-[hsl(var(--muted-foreground))]">
              <span>Cached:</span>
              <span>{storageStats.count}</span>
              <span className="mx-0.5 opacity-50">|</span>
              <span>{storageStats.size}</span>
            </div>

            <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
              <X size={20} className="text-[hsl(var(--muted-foreground))]" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-[hsl(var(--foreground))] bg-[hsl(var(--background))] pb-20 [&::-webkit-scrollbar]:hidden">
          {loading && (
            <div className="flex items-center justify-center h-40 text-[hsl(var(--muted-foreground))] animate-pulse">
              Searching definition...
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <span className="text-red-500 font-medium mb-1">Not Found</span>
              <span className="text-sm text-[hsl(var(--muted-foreground))]">{error}</span>
            </div>
          )}

          {!loading && !error && entry && (
            <div className="space-y-6">
              {/* Source Badge if requested by User in previous turn, let's put it here or near Title? User said "thêm 1 badge là data này lấy từ freedictionaryapi.com hay api.dictionaryapi.dev" */}

              {/* Word Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] capitalize">
                    {entry.word}
                  </h1>
                  {/* Source Badge */}
                  {/* Source Badge */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-[11px] font-medium border border-[hsl(var(--border))] shadow-sm">
                    <Globe size={12} className="opacity-70" />
                    <span>
                      {entry.source === 'FreeDict' ? 'Free Dictionary API' : 'Dictionary API'}
                    </span>
                  </div>
                </div>

                {entry.phonetics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {entry.phonetics.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-[hsl(var(--muted))] px-3 py-1 rounded-full"
                      >
                        <span className="font-mono text-sm">{p.text}</span>
                        {p.tag && (
                          <span className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">
                            {p.tag}
                          </span>
                        )}
                        {p.audio && (
                          <button
                            onClick={() => playAudio(p.audio)}
                            className="p-1 hover:text-[hsl(var(--primary))] transition-colors"
                          >
                            <Volume2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meanings */}
              <div className="space-y-6">
                {entry.meanings.map((meaning, mIdx) => (
                  <div key={mIdx} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-sm font-bold rounded uppercase">
                        {meaning.partOfSpeech}
                      </span>
                      <div className="h-[1px] flex-1 bg-[hsl(var(--border))]/50"></div>
                    </div>

                    <ul className="space-y-4 pl-0">
                      {meaning.definitions.map((def, dIdx) => (
                        <li key={dIdx} className="space-y-2">
                          <div className="flex gap-2">
                            <span className="text-[hsl(var(--muted-foreground))] font-mono text-sm mt-1">
                              {dIdx + 1}.
                            </span>
                            <div className="flex-1">
                              <p className="text-[hsl(var(--foreground))] text-base leading-relaxed">
                                {def.definition}
                              </p>

                              {/* Vietnamese Translations - Display inline or block? User focused on VI. */}
                              {def.translations.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {def.translations.map((t, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="inline-flex items-center text-[hsl(var(--secondary-foreground))] font-medium text-sm"
                                    >
                                      {t}
                                      {tIdx < def.translations.length - 1 ? ',' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {def.example && (
                                <p className="mt-1 text-[hsl(var(--muted-foreground))] italic text-sm border-l-2 border-[hsl(var(--muted))] pl-2">
                                  "{def.example}"
                                </p>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
