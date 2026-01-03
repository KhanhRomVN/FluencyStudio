import React, { useState, useEffect } from 'react';
import { Menu, FileText, ChevronLeft, X } from 'lucide-react';
import { Quiz } from './types';
import { GapFillQuiz } from './components/GapFillQuiz';
import { MultipleChoiceQuiz } from './components/MultipleChoiceQuiz';
import { QuizMediaPlayer } from './components/QuizMediaPlayer';

interface QuizPageProps {
  quizData: Quiz & { _lessonTitle?: string };
}

// Reusing the BottomDrawer from original file
const BottomDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: string;
}> = ({ isOpen, onClose, title, children, height = 'h-[75%]' }) => {
  return (
    <>
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`absolute bottom-0 left-0 right-0 ${height} bg-[hsl(var(--background))] rounded-t-3xl z-50 transition-transform duration-300 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.2)] ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="h-1.5 w-12 bg-gray-300/50 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
        <div className="px-6 py-2 border-b border-[hsl(var(--border))]/50 flex justify-between items-center bg-[hsl(var(--background))]">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-[hsl(var(--muted))]">
            <X size={20} className="text-[hsl(var(--muted-foreground))]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 text-[hsl(var(--foreground))]">{children}</div>
      </div>
    </>
  );
};

export const QuizPage: React.FC<QuizPageProps> = ({ quizData }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Derive Quiz Title and Lesson Title
  // Logic from old file:
  const lessonTitle = quizData._lessonTitle || 'Lesson';
  const quizTitle = quizData.title || lessonTitle;
  const quizType = quizData.type || 'gap-fill';

  // Reset state when quiz changes
  useEffect(() => {
    setIsChecked(false);
    setShowTranscript(false);
  }, [quizData.id]);

  const handleCheck = () => {
    setIsChecked(true);
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] font-sans relative overflow-hidden select-none">
      {/* Top Navbar */}
      <div className="px-4 py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]/50 flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="font-bold text-[15px] truncate text-[hsl(var(--foreground))] leading-tight">
            {quizTitle}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <div className="bg-[hsl(var(--primary))]/10 px-1.5 py-0.5 rounded-md">
              <span className="text-[hsl(var(--primary))] text-[10px] font-bold uppercase tracking-wider">
                Q 1/1{' '}
                {/* Mocked for now since we don't have total quizzes count passed easily, or we hardcode */}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isChecked && quizData.transcript && (
            <button
              onClick={() => setShowTranscript(true)}
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
            >
              <FileText size={20} />
            </button>
          )}
          <button
            onClick={() => setShowMenu(true)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {quizType.includes('multiple-choice') ? (
          <MultipleChoiceQuiz quiz={quizData} isChecked={isChecked} onCheck={handleCheck} />
        ) : (
          <GapFillQuiz quiz={quizData} isChecked={isChecked} onCheck={handleCheck} />
        )}
      </div>

      {/* Audio Player */}
      {quizData.audio && (
        <QuizMediaPlayer
          audioPath={quizData.audio}
          title={quizData.audio.split('/').pop() || 'Audio'}
        />
      )}

      {/* Transcript Drawer */}
      <BottomDrawer
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        title="Transcript"
      >
        {quizData.transcript ? (
          <div className="prose prose-sm dark:prose-invert leading-loose max-w-none">
            {quizData.transcript}
          </div>
        ) : (
          <p className="text-center text-[hsl(var(--muted-foreground))]">
            No transcript available.
          </p>
        )}
      </BottomDrawer>

      {/* Menu Drawer */}
      <BottomDrawer
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Question List"
        height="h-[50%]"
      >
        <div className="grid grid-cols-5 gap-3">
          {Array.from({ length: 15 }).map((_, i) => (
            <button
              key={i}
              className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${i === 0 ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))]/30' : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--border))]'}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </BottomDrawer>
    </div>
  );
};
