import React, { useState, useEffect } from 'react';
import { Menu, FileText, ChevronLeft, X } from 'lucide-react';
import { Quiz } from './types';
import { GapFillQuiz } from './components/QuizType/GapFillQuiz';
import { MultipleChoiceQuiz } from './components/QuizType/MultipleChoiceQuiz';
import { MediaPlayer } from './components/MediaPlayer';
import { QuizDrawer } from './components/QuizDrawer';
import { TranscriptDrawer } from './components/TranscriptDrawer';

interface QuizPageProps {
  quizData: Quiz & { _lessonTitle?: string };
  parentLesson?: any;
  onQuizChange?: (quiz: Quiz) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ quizData, parentLesson, onQuizChange }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Determine Quizzes List and Current Index
  const quizzes = parentLesson?.quiz || [quizData];
  const activeQuizIndex = quizzes.findIndex((q: any) => q.id === quizData.id);
  const totalQuizzes = quizzes.length;

  // Use Quiz Title, fallback to Lesson Title (from parent data or quizData._lessonTitle)
  const displayTitle = quizData.title || parentLesson?.title || quizData._lessonTitle || 'Lesson';
  const quizType = quizData.type || 'gap-fill';

  // Reset state when quiz changes
  useEffect(() => {
    setIsChecked(false);
    setShowTranscript(false);
  }, [quizData.id]);

  const handleCheck = () => {
    setIsChecked(true);
  };

  const handleQuizSelect = (quiz: any) => {
    onQuizChange?.(quiz);
    setShowMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] font-sans relative overflow-hidden select-none">
      {/* Top Navbar */}
      <div className="px-4 py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]/50 flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="font-bold text-[15px] truncate text-[hsl(var(--foreground))] leading-tight">
            {displayTitle}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <div className="bg-[hsl(var(--primary))]/10 px-1.5 py-0.5 rounded-md">
              <span className="text-[hsl(var(--primary))] text-[10px] font-bold uppercase tracking-wider">
                Question {activeQuizIndex + 1}/{totalQuizzes}
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
        <MediaPlayer
          audioPath={quizData.audio}
          title={quizData.audio.split('/').pop() || 'Audio'}
        />
      )}

      {/* Transcript Drawer */}
      <TranscriptDrawer
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        transcript={quizData.transcript}
      />

      {/* Menu Drawer */}
      <QuizDrawer
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        quizzes={quizzes}
        activeQuizIndex={activeQuizIndex}
        onQuizSelected={(index) => handleQuizSelect(quizzes[index])}
        lessonTitle={parentLesson?.title}
      />
    </div>
  );
};
