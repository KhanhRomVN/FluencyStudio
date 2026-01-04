import React from 'react';
import { X } from 'lucide-react';
import { RichTextParser } from './RichTextParser';

interface ExplainDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: string;
}

export const ExplainDrawer: React.FC<ExplainDrawerProps> = ({ isOpen, onClose, explanation }) => {
  const content = explanation.trim() === '' ? '<p>No explanation available.</p>' : explanation;

  return (
    <>
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 h-[50%] bg-[hsl(var(--background))] rounded-t-3xl z-50 transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
        <div className="px-6 py-2 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <div className="flex flex-col">
            <div className="w-10 h-1 bg-transparent mb-4" />{' '}
            {/* Spacer to match dart style line 281? No, Dart has centered container. React has handle. */}
            {/* Dart: Center(child: Container(width: 40, height: 4...)) -> Handle */}
            {/* Dart: Text('Explanation'...) */}
            {/* My React code has handle above header. */}
            <h3 className="font-bold text-lg text-[hsl(var(--foreground))]">Explanation</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-[hsl(var(--foreground))] [&::-webkit-scrollbar]:hidden">
          <RichTextParser content={content} />
        </div>
      </div>
    </>
  );
};
