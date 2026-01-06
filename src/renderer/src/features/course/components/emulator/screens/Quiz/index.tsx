import React, { useState, useEffect } from 'react';
import { AudioLines, ChevronLeft, AlignEndVertical, Info, BadgeInfo, Pilcrow } from 'lucide-react';
import { Quiz } from './types';
import { GapFill } from './components/QuizType/GapFill';
import { MultipleChoice } from './components/QuizType/MultipleChoice';
import { MatchingDropdown } from './components/QuizType/MatchingDropdown';
import { Writing } from './components/QuizType/Writing';
import { Speaking } from './components/QuizType/Speaking';
import { Chatting } from './components/QuizType/Chatting';
import { PronunciationDrill } from './components/QuizType/PronunciationDrill';
import { MediaPlayer } from './components/MediaPlayer';
import { QuizDrawer } from './components/QuizDrawer';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { WritingInstructionDrawer } from './components/WritingInstructionDrawer';
import { PassageDrawer } from './components/PassageDrawer';
import { useAudio } from '../../../../hooks/useAudio';

interface QuizPageProps {
  quizData: Quiz & { _lessonTitle?: string };
  parentLesson?: any;
  onQuizChange?: (quiz: Quiz) => void;
  onQuizUpdate?: (updatedQuiz: Quiz) => void;
}

export const QuizPage: React.FC<QuizPageProps> = ({
  quizData,
  parentLesson,
  onQuizChange,
  onQuizUpdate,
}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const [showExplainDrawer, setShowExplainDrawer] = useState(false);
  const [showInstructionDrawer, setShowInstructionDrawer] = useState(false);
  const [showPassageDrawer, setShowPassageDrawer] = useState(false);

  // Delayed mount states for drawer animations
  const [transcriptMounted, setTranscriptMounted] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [instructionMounted, setInstructionMounted] = useState(false);
  const [passageMounted, setPassageMounted] = useState(false);

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

  // Audio Hook
  const resolveAudioPath = (path: string | undefined) => {
    if (!path) return undefined;
    if (path.startsWith('./') && parentLesson?._filePath) {
      const dir = parentLesson._filePath.substring(0, parentLesson._filePath.lastIndexOf('/'));
      return `file://${dir}/${path.substring(2)}`;
    }
    return path;
  };
  const audioSrc = resolveAudioPath(quizData.audio);

  const { isPlaying, currentTime, duration, togglePlay, seek } = useAudio(audioSrc);

  // Reset state when quiz changes
  useEffect(() => {
    setIsChecked(false);
    setShowTranscript(false);
    setShowExplainDrawer(false);
    setShowPassageDrawer(false);
  }, [quizData.id]);

  // States for drawer open animation (visible after mount)
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [instructionVisible, setInstructionVisible] = useState(false);
  const [passageVisible, setPassageVisible] = useState(false);

  // Delayed mount/unmount effects for drawer animations
  useEffect(() => {
    if (showTranscript) {
      setTranscriptMounted(true);
      // Delay to next frame for open animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTranscriptVisible(true));
      });
    } else {
      setTranscriptVisible(false);
      const timer = setTimeout(() => setTranscriptMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showTranscript]);

  useEffect(() => {
    if (showMenu) {
      setMenuMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMenuVisible(true));
      });
    } else {
      setMenuVisible(false);
      const timer = setTimeout(() => setMenuMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showMenu]);

  useEffect(() => {
    if (showInstructionDrawer) {
      setInstructionMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setInstructionVisible(true));
      });
    } else {
      setInstructionVisible(false);
      const timer = setTimeout(() => setInstructionMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showInstructionDrawer]);

  useEffect(() => {
    if (showPassageDrawer) {
      setPassageMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setPassageVisible(true));
      });
    } else {
      setPassageVisible(false);
      const timer = setTimeout(() => setPassageMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showPassageDrawer]);

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
          {quizData.passage && (
            <button
              onClick={() => setShowPassageDrawer(true)}
              className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
            >
              <Pilcrow size={18} />
            </button>
          )}
          {quizData.type === 'writing' && (
            <button
              onClick={() => setShowInstructionDrawer(true)}
              className="p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
            >
              <BadgeInfo size={18} />
            </button>
          )}
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
            onUpdate={onQuizUpdate}
            onExplainRequest={setShowExplainDrawer}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
        ) : quizType === 'matching-dropdown' ? (
          <MatchingDropdown
            quiz={quizData}
            isChecked={isChecked}
            onCheck={handleCheck}
            onUpdate={onQuizUpdate}
            onExplainRequest={setShowExplainDrawer}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
        ) : quizType === 'writing' ? (
          <Writing
            quiz={quizData}
            onUpdate={onQuizUpdate}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
        ) : quizType === 'speaking' ? (
          <Speaking
            quiz={quizData}
            onUpdate={onQuizUpdate}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
        ) : quizType === 'chatting' ? (
          <Chatting
            quiz={quizData}
            onUpdate={onQuizUpdate}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
        ) : quizType === 'pronunciation-drill' ? (
          <PronunciationDrill
            quiz={quizData}
            onUpdate={onQuizUpdate}
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
            onUpdate={onQuizUpdate}
            onExplainRequest={setShowExplainDrawer}
            header={
              <h2 className="font-bold text-lg text-[hsl(var(--foreground))] leading-tight mb-3">
                {displayTitle}
              </h2>
            }
          />
        )}
      </div>

      {/* Audio Player */}
      {quizData.audio && !showExplainDrawer && (
        <MediaPlayer
          title={quizData.audio.split('/').pop() || 'Audio'}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onTogglePlay={togglePlay}
          onSeek={seek}
        />
      )}

      {/* Transcript Drawer */}
      {transcriptMounted && (
        <TranscriptDrawer
          isOpen={transcriptVisible}
          onClose={() => setShowTranscript(false)}
          transcriptPath={
            quizData.transcript && parentLesson?._filePath
              ? quizData.transcript.startsWith('./')
                ? `${parentLesson._filePath.substring(0, parentLesson._filePath.lastIndexOf('/'))}/${quizData.transcript.substring(2)}`
                : quizData.transcript
              : undefined
          }
          audioState={{ isPlaying, currentTime, duration }}
          audioHandlers={{ togglePlay, seek }}
          audioTitle={quizData.audio?.split('/').pop() || 'Audio'}
        />
      )}

      {/* Menu Drawer */}
      {menuMounted && (
        <QuizDrawer
          isOpen={menuVisible}
          onClose={() => setShowMenu(false)}
          quizzes={quizzes}
          activeQuizIndex={activeQuizIndex}
          onQuizSelected={(index) => handleQuizSelect(quizzes[index])}
          lessonTitle={parentLesson?.title}
        />
      )}

      {quizData.type === 'writing' && instructionMounted && (
        <WritingInstructionDrawer
          isOpen={instructionVisible}
          onClose={() => setShowInstructionDrawer(false)}
          instruction={quizData.instruction || ''}
        />
      )}

      {quizData.passage && passageMounted && (
        <PassageDrawer
          isOpen={passageVisible}
          onClose={() => setShowPassageDrawer(false)}
          passagePath={quizData.passage}
          parentFilePath={parentLesson?._filePath}
        />
      )}
    </div>
  );
};
