import React from 'react';
import { X } from 'lucide-react';
import { Quiz } from '../types';

interface QuizDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: Quiz[];
  activeQuizIndex: number;
  onQuizSelected: (index: number) => void;
  lessonTitle?: string;
}

export const QuizDrawer: React.FC<QuizDrawerProps> = ({
  isOpen,
  onClose,
  quizzes,
  activeQuizIndex,
  onQuizSelected,
  lessonTitle,
}) => {
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
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-wider">
              {lessonTitle || 'Lesson'}
            </span>
            <h3 className="font-bold text-lg">Question List</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-[hsl(var(--foreground))] [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-5 gap-3">
            {quizzes.map((q, i) => (
              <button
                key={q.id || i}
                onClick={() => onQuizSelected(i)}
                className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${
                  i === activeQuizIndex
                    ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))]/30'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
