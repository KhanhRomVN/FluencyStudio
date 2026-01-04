import React, { useState, useEffect } from 'react';
import { Menu, AudioLines, ChevronLeft, X, AlignEndVertical, Info } from 'lucide-react';
import { Quiz } from './types';
import { GapFill } from './components/QuizType/GapFill';
import { MultipleChoice } from './components/QuizType/MultipleChoice';
import { MediaPlayer } from './components/MediaPlayer';
import { QuizDrawer } from './components/QuizDrawer';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { TutorialDrawer } from './components/TutorialDrawer';

interface QuizPageProps {
  quizData: Quiz & { _lessonTitle?: string };
  parentLesson?: any;
  onQuizChange?: (quiz: Quiz) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({ quizData, parentLesson, onQuizChange }) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Track visited quizzes to show colored help icon only on first visit
  const [visitedQuizzes, setVisitedQuizzes] = useState<Set<string>>(new Set());

  // Determine Quizzes List and Current Index
  const quizzes = parentLesson?.quiz || [quizData];
  const activeQuizIndex = quizzes.findIndex((q: any) => q.id === quizData.id);
  const totalQuizzes = quizzes.length;

  // Use Quiz Title, fallback to Lesson Title (from parent data or quizData._lessonTitle)
  const displayTitle = quizData.title || parentLesson?.title || quizData._lessonTitle || 'Lesson';
  const quizType = quizData.type || 'gap-fill';

  // Mark quiz as new/unvisited if not in set
  const isNewQuiz = !visitedQuizzes.has(quizData.id);

  // Reset state when quiz changes
  useEffect(() => {
    setIsChecked(false);
    setShowTranscript(false);
    setShowTutorial(false);
  }, [quizData.id]);

  const handleCheck = () => {
    setIsChecked(true);
  };

  const handleQuizSelect = (quiz: any) => {
    onQuizChange?.(quiz);
    setShowMenu(false);
  };

  const handleTutorialClick = () => {
    // Mark as visited when clicked
    if (isNewQuiz) {
      setVisitedQuizzes((prev) => {
        const next = new Set(prev);
        next.add(quizData.id);
        return next;
      });
    }
    setShowTutorial(true);
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] font-sans relative overflow-hidden select-none">
      {/* Top Navbar */}
      <div className="px-3 py-2 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))]/50 flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex items-center">
          <button
            className="p-1.5 -ml-2 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
            onClick={() => {}} // TODO: Add back navigation if needed
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[hsl(var(--foreground))]">Quiz</span>
        </div>

        <div className="flex items-center gap-0.5">
          {isChecked && quizData.transcript && (
            <button
              onClick={() => setShowTranscript(true)}
              className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
            >
              <AudioLines size={18} />
            </button>
          )}

          <div className="bg-[hsl(var(--primary))]/10 px-1.5 py-0.5 rounded-sm mr-1">
            <span className="text-[hsl(var(--primary))] text-[10px] font-bold">
              {activeQuizIndex + 1}/{totalQuizzes}
            </span>
          </div>

          <button
            onClick={handleTutorialClick}
            className={`p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all ${isNewQuiz ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--foreground))]'}`}
          >
            <Info size={18} />
          </button>

          <button
            onClick={() => setShowMenu(true)}
            className="p-1.5 -mr-2 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
          >
            <AlignEndVertical size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        {quizType.includes('multiple-choice') ? (
          <MultipleChoice
            quiz={quizData}
            isChecked={isChecked}
            onCheck={handleCheck}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
        ) : (
          <GapFill
            quiz={quizData}
            isChecked={isChecked}
            onCheck={handleCheck}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
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

      {/* Tutorial Drawer */}
      <TutorialDrawer
        isOpen={showTutorial}
        onClose={() => setShowTutorial(false)}
        quiz={quizData}
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
