import React, { useState, useEffect } from 'react';
import {
  AudioLines,
  ChevronLeft,
  AlignEndVertical,
  Info,
  Pilcrow,
  CircleDotDashed,
} from 'lucide-react';
import { Quiz } from './types';
import { GapFill } from './components/QuizType/GapFill';
import { MultipleChoice } from './components/QuizType/MultipleChoice';
import { MatchingDropdown } from './components/QuizType/MatchingDropdown';
import { Writing } from './components/QuizType/Writing';
import { Speaking } from './components/QuizType/Speaking';
import { Chatting } from './components/QuizType/Chatting';
import { PronunciationDrill } from './components/QuizType/PronunciationDrill';
import { Builder } from './components/QuizType/Builder';
import { SentenceTransformation } from './components/QuizType/SentenceTransformation';
import { Dictation } from './components/QuizType/Dictation';
import { ErrorCorrection } from './components/QuizType/ErrorCorrection';
import { Flashcard } from './components/QuizType/Flashcard';
import { MediaPlayer } from './components/MediaPlayer';
import { QuizDrawer } from './components/QuizDrawer';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { TutorialDrawer } from './components/TutorialDrawer';
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
  const [showTutorialDrawer, setShowTutorialDrawer] = useState(false);
  const [showPassageDrawer, setShowPassageDrawer] = useState(false);

  // Delayed mount states for drawer animations
  const [transcriptMounted, setTranscriptMounted] = useState(false);
  const [menuMounted, setMenuMounted] = useState(false);
  const [tutorialMounted, setTutorialMounted] = useState(false);
  const [passageMounted, setPassageMounted] = useState(false);

  // Track visited quizzes to show colored help icon only on first visit
  const [visitedQuizzes, setVisitedQuizzes] = useState<Set<string>>(new Set());

  // Track visited tutorials to change icon color
  const [visitedTutorials, setVisitedTutorials] = useState<Set<string>>(new Set());

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
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [passageVisible, setPassageVisible] = useState(false);

  // Check if quiz has tutorial content (instruction field only)
  const hasTutorialContent = Boolean(quizData.instruction);

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
    if (showTutorialDrawer) {
      setTutorialMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setTutorialVisible(true));
      });
    } else {
      setTutorialVisible(false);
      const timer = setTimeout(() => setTutorialMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [showTutorialDrawer]);

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
    // Mark tutorial as visited when clicked
    if (!visitedTutorials.has(quizData.id)) {
      setVisitedTutorials((prev) => {
        const next = new Set(prev);
        next.add(quizData.id);
        return next;
      });
    }
    setShowTutorialDrawer(true);
  };

  const handleInfoClick = () => {
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
          {hasTutorialContent && (
            <button
              onClick={handleTutorialClick}
              className={
                'p-1.5 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all ' +
                (!visitedTutorials.has(quizData.id)
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--foreground))]')
              }
            >
              <CircleDotDashed size={18} />
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
            onClick={() => setShowMenu(true)}
            className="p-1.5 -mr-2 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-95 transition-all text-[hsl(var(--foreground))]"
          >
            <AlignEndVertical size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-hidden relative">
          {quizType.includes('multiple-choice') ? (
            <MultipleChoice
              quiz={quizData}
              isChecked={isChecked}
              onCheck={handleCheck}
              onExplainRequest={setShowExplainDrawer}
            />
          ) : quizType === 'matching-dropdown' ? (
            <MatchingDropdown
              quiz={quizData}
              isChecked={isChecked}
              onCheck={handleCheck}
              onExplainRequest={setShowExplainDrawer}
            />
          ) : quizType === 'writing' ? (
            <Writing quiz={quizData} />
          ) : quizType === 'speaking' ? (
            <Speaking quiz={quizData} />
          ) : quizType === 'chatting' ? (
            <Chatting quiz={quizData} />
          ) : quizType === 'pronunciation-drill' ? (
            <PronunciationDrill quiz={quizData} />
          ) : quizType === 'builder' || quizType === 'sentence-builder' ? (
            <Builder quiz={quizData} onExplainRequest={setShowExplainDrawer} />
          ) : quizType === 'sentence-transformation' ? (
            <SentenceTransformation quiz={quizData} />
          ) : quizType === 'dictation' ? (
            <Dictation quiz={quizData} isChecked={isChecked} onCheck={handleCheck} />
          ) : quizType === 'error-correction' ? (
            <ErrorCorrection quiz={quizData} isChecked={isChecked} onCheck={handleCheck} />
          ) : quizType === 'flashcard' ? (
            <Flashcard quiz={quizData} />
          ) : (
            <GapFill
              quiz={quizData}
              isChecked={isChecked}
              onCheck={handleCheck}
              onUpdate={onQuizUpdate}
              onExplainRequest={setShowExplainDrawer}
            />
          )}
        </div>
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

      {hasTutorialContent && tutorialMounted && (
        <TutorialDrawer
          isOpen={tutorialVisible}
          onClose={() => setShowTutorialDrawer(false)}
          title={displayTitle}
          content={quizData.instruction || ''}
          parentFilePath={parentLesson?._filePath}
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
