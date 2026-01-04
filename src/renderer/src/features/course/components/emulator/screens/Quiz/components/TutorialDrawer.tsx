import React from 'react';
import { X, Info } from 'lucide-react';
import { Quiz } from '../types';

interface TutorialDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
}

export const TutorialDrawer: React.FC<TutorialDrawerProps> = ({ isOpen, onClose, quiz }) => {
  const isMultipleChoice = quiz.type?.includes('multiple-choice');
  const quizTypeLabel = isMultipleChoice ? 'Multiple Choice' : 'Gap Fill';
  const howToLabel = isMultipleChoice
    ? 'Choose the correct answer from the options provided.'
    : 'Fill in the blanks with the correct words.';

  return (
    <>
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 h-[60%] bg-[hsl(var(--background))] rounded-t-3xl z-50 transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
        <div className="px-6 py-2 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-[hsl(var(--primary))]" />
            <h3 className="font-bold text-lg">Tutorial</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-[hsl(var(--foreground))] space-y-6">
          {/* Quiz Type & How to */}
          <div className="space-y-2">
            <h4 className="font-bold text-base text-[hsl(var(--primary))] uppercase tracking-wider">
              {quizTypeLabel}
            </h4>
            <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
              {howToLabel}
            </p>
          </div>

          {/* Instruction */}
          {quiz.instruction && (
            <div className="space-y-2">
              <h4 className="font-bold text-base text-[hsl(var(--foreground))]">Instruction</h4>
              <div
                className="prose prose-sm dark:prose-invert leading-relaxed max-w-none text-sm text-[hsl(var(--muted-foreground))]"
                dangerouslySetInnerHTML={{ __html: quiz.instruction }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};
