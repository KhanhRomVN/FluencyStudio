import React from 'react';
import { X, CheckCircle2, Circle, Clock, Award, FileQuestion } from 'lucide-react';
import { Quiz } from '../types';

interface QuizDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: Quiz[];
  activeQuizIndex: number;
  onQuizSelected: (index: number) => void;
  lessonTitle?: string;
}

// Fake data generator helper
const getFormattedStatus = (index: number) => {
  if (index % 3 === 0) return { status: 'completed', score: 85 + (index % 15), time: '12:30' };
  if (index % 3 === 1) return { status: 'in-progress', score: null, time: '05:45' };
  return { status: 'pending', score: null, time: null };
};

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
        className={`absolute bottom-0 left-0 right-0 h-[85%] bg-[hsl(var(--background))] rounded-t-3xl z-50 transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
        <div className="px-6 py-4 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-bold tracking-wider">
              {lessonTitle || 'Lesson Quizzes'}
            </span>
            <h3 className="font-bold text-xl text-[hsl(var(--foreground))]">Question List</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 [&::-webkit-scrollbar]:hidden bg-[hsl(var(--muted))]/10">
          {quizzes.map((quiz, index) => {
            const { status, score, time } = getFormattedStatus(index);
            const isActive = index === activeQuizIndex;
            const isCompleted = status === 'completed';
            const isInProgress = status === 'in-progress';

            return (
              <button
                key={quiz.id || index}
                onClick={() => onQuizSelected(index)}
                className={`w-full text-left relative overflow-hidden rounded-xl border transition-all duration-200 group
                  ${
                    isActive
                      ? 'bg-[hsl(var(--background))] border-[hsl(var(--primary))] shadow-sm ring-1 ring-[hsl(var(--primary))]'
                      : 'bg-[hsl(var(--card))] border-[hsl(var(--border))]/50 hover:border-[hsl(var(--primary))]/50 hover:shadow-sm'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[hsl(var(--primary))]" />
                )}

                <div className="p-4 pl-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border
                          ${
                            quiz.type?.includes('multiple-choice')
                              ? 'bg-purple-500/10 text-purple-600 border-purple-200'
                              : 'bg-blue-500/10 text-blue-600 border-blue-200'
                          }
                        `}
                        >
                          {quiz.type === 'multiple-choice' ? 'Multiple Choice' : 'Gap Fill'}
                        </span>
                        {isCompleted && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/10 text-green-600 flex items-center gap-1">
                            <CheckCircle2 size={10} /> Done
                          </span>
                        )}
                        {isInProgress && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 flex items-center gap-1">
                            <Circle size={8} className="fill-current animate-pulse" /> In Progress
                          </span>
                        )}
                      </div>
                      <h4
                        className={`font-semibold text-sm line-clamp-2 leading-relaxed ${isActive ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]'}`}
                      >
                        {index + 1}. {quiz.title || quiz.question || 'Untitled Question'}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                    {(time || isInProgress) && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className={isInProgress ? 'text-amber-500' : ''} />
                        <span>{time || '00:00'}</span>
                      </div>
                    )}

                    {score && (
                      <div className="flex items-center gap-1.5 text-[hsl(var(--foreground))] font-medium">
                        <Award size={14} className="text-yellow-500" />
                        <span>{score}%</span>
                      </div>
                    )}

                    {!time && !score && (
                      <div className="flex items-center gap-1.5 opacity-50">
                        <FileQuestion size={14} />
                        <span>- - : - -</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
