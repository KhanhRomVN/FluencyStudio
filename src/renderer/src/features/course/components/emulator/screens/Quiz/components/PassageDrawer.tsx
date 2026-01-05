import React, { useEffect, useState } from 'react';
import { X, Pilcrow, BookOpen } from 'lucide-react';
import { folderService } from '../../../../../../../shared/services/folderService';

interface PassageDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  passagePath?: string;
  parentFilePath?: string;
}

interface PassageSegment {
  content: string;
  translate: string;
}

interface PassageData {
  tid: string;
  title: string;
  segments: PassageSegment[];
}

export const PassageDrawer: React.FC<PassageDrawerProps> = ({
  isOpen,
  onClose,
  passagePath,
  parentFilePath,
}) => {
  const [data, setData] = useState<PassageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && passagePath) {
      setLoading(true);
      setError(null);
      setActiveSegmentIndex(null);

      // Resolve full path if relative
      let fullPath = passagePath;
      if (passagePath.startsWith('./') && parentFilePath) {
        const dir = parentFilePath.substring(0, parentFilePath.lastIndexOf('/'));
        fullPath = `${dir}/${passagePath.substring(2)}`;
      }

      folderService
        .parseCourseMetadata(fullPath)
        .then((result) => {
          if (result && Array.isArray(result.segments)) {
            setData(result as PassageData);
          } else {
            setError('Invalid passage format');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Failed to load passage');
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, passagePath, parentFilePath]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[75%] bg-[hsl(var(--background))] rounded-t-3xl z-50 transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag Handle */}
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />

        {/* Header */}
        <div className="px-6 py-2 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <div className="flex items-center gap-2">
            <Pilcrow size={18} className="text-[hsl(var(--primary))]" />
            <h3 className="font-bold text-lg max-w-[200px] truncate">Passage</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 text-[hsl(var(--foreground))] bg-[hsl(var(--background))] pb-20 [&::-webkit-scrollbar]:hidden">
          {loading && (
            <div className="flex items-center justify-center h-40 text-[hsl(var(--muted-foreground))]">
              Loading...
            </div>
          )}

          {error && !loading && (
            <div className="flex items-center justify-center h-40 text-red-500">{error}</div>
          )}

          {!loading && !error && data && (
            <div className="text-[16px] leading-relaxed whitespace-pre-wrap">
              <h1 className="text-xl font-bold mb-4 text-[hsl(var(--foreground))]">{data.title}</h1>
              {data.segments.map((segment, index) => {
                const isActive = activeSegmentIndex === index;
                return (
                  <React.Fragment key={index}>
                    <span
                      className={`inline cursor-pointer px-1 py-0.5 rounded mx-1 outline outline-1 outline-dashed transition-all duration-200 ${
                        isActive
                          ? 'outline-[hsl(var(--primary))] bg-[hsl(var(--primary))]/20 shadow-sm'
                          : 'outline-[hsl(var(--primary))]/40 hover:outline-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5'
                      } [&_p]:inline [&_p]:m-0`}
                      onClick={() => setActiveSegmentIndex(isActive ? null : index)}
                      dangerouslySetInnerHTML={{ __html: segment.content }}
                    />

                    {isActive && (
                      <span
                        className="inline ml-1 px-2 py-0.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium italic [&_p]:inline [&_p]:m-0 animate-in fade-in zoom-in-95 duration-200 border border-[hsl(var(--border))]"
                        dangerouslySetInnerHTML={{ __html: `(${segment.translate})` }}
                      />
                    )}
                    {/* Add a space after each segment for separation */}
                    <span> </span>
                  </React.Fragment>
                );
              })}
            </div>
          )}

          {!loading && !error && !data && !passagePath && (
            <p className="text-center text-[hsl(var(--muted-foreground))] mt-10">
              No passage available.
            </p>
          )}
        </div>
      </div>
    </>
  );
};
