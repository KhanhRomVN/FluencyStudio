import React, { useState, useEffect, useRef } from 'react';
import { Menu, FileText, ChevronLeft, Check, Play, Pause, X } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  type: string;
  question: string;
  audio?: string;
  transcript?: string;
  answers?: string[];
  options?: { key: string; text: string }[];
}

interface QuizPageProps {
  quizData: Quiz & { _lessonTitle?: string };
}

// --- Drawer Component ---
const BottomDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  height?: string;
}> = ({ isOpen, onClose, title, children, height = 'h-[75%]' }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      {/* Drawer */}
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [audioProgress, setAudioProgress] = useState(35); // Mock progress

  const lessonTitle = quizData._lessonTitle || 'Lesson';
  const quizTitle = quizData.title || lessonTitle;

  const handleCheck = () => setIsChecked(true);

  // Reset state when quiz changes
  useEffect(() => {
    setIsChecked(false);
    setIsPlaying(false);
    setAudioProgress(0);
    setShowTranscript(false);
  }, [quizData.id]);

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-sans relative overflow-hidden select-none">
      {/* Top Navbar */}
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]/50 bg-[hsl(var(--card))] flex items-center justify-between shadow-sm z-20 relative">
        <div className="flex-1 min-w-0 pr-2">
          <h2 className="font-bold text-[15px] truncate text-[hsl(var(--foreground))] leading-tight">
            {quizTitle}
          </h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
              Q 1/1
            </span>
            <span className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium uppercase tracking-wide">
              {quizData.type.replace('-', ' ')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {isChecked && quizData.transcript && (
            <button
              onClick={() => setShowTranscript(true)}
              className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-90 transition-all text-[hsl(var(--foreground))]"
              title="View Transcript"
            >
              <FileText size={20} />
            </button>
          )}
          <button
            onClick={() => setShowMenu(true)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] active:scale-90 transition-all text-[hsl(var(--foreground))]"
            title="Menu"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 pb-32 scrollbar-hide">
        {quizData.type.includes('multiple-choice') ? (
          <MultipleChoiceQuiz quiz={quizData} isChecked={isChecked} onCheck={handleCheck} />
        ) : (
          <GapFillQuiz quiz={quizData} isChecked={isChecked} onCheck={handleCheck} />
        )}
      </div>

      {/* Bottom Audio Player */}
      {quizData.audio && (
        <div className="absolute bottom-0 left-0 right-0 bg-[hsl(var(--card))]/95 backdrop-blur-md border-t border-[hsl(var(--border))]/50 shadow-[0_-4px_30px_rgba(0,0,0,0.05)] z-20 pb-safe-bottom">
          {/* Progress Bar (Interactive) */}
          <div className="relative h-1.5 bg-[hsl(var(--muted))] w-full cursor-pointer group">
            <div
              className="absolute top-0 left-0 h-full bg-[hsl(var(--primary))] transition-all duration-100"
              style={{ width: `${audioProgress}%` }}
            />
            <div
              className="absolute top-1/2 -mt-1.5 h-3 w-3 bg-[hsl(var(--primary))] rounded-full shadow-md transition-transform duration-200 scale-0 group-hover:scale-100"
              style={{ left: `${audioProgress}%`, marginLeft: '-6px' }}
            />
          </div>

          <div className="px-5 py-4 flex items-center justify-between pb-8">
            <div className="flex-1 min-w-0 pr-4">
              <div className="text-xs font-bold text-[hsl(var(--foreground))] mb-0.5 truncate">
                {quizData.audio.split('/').pop()}
              </div>
              <div className="text-[10px] font-mono font-medium text-[hsl(var(--muted-foreground))]">
                00:
                {Math.floor((audioProgress / 100) * 60)
                  .toString()
                  .padStart(2, '0')}{' '}
                / 01:00
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors">
                <span className="text-xs font-bold">1x</span>
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-12 h-12 rounded-full bg-[hsl(var(--primary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/30 active:scale-90 hover:scale-105 transition-all"
              >
                {isPlaying ? (
                  <Pause size={22} fill="currentColor" />
                ) : (
                  <Play size={22} fill="currentColor" className="ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawers */}
      <BottomDrawer
        isOpen={showTranscript}
        onClose={() => setShowTranscript(false)}
        title="Transcript"
      >
        {quizData.transcript ? (
          <div className="prose prose-sm dark:prose-invert leading-loose">
            <p>{quizData.transcript}</p>
          </div>
        ) : (
          <p className="text-center text-[hsl(var(--muted-foreground))]">
            No transcript available.
          </p>
        )}
      </BottomDrawer>

      <BottomDrawer
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        title="Question List"
        height="h-[50%]"
      >
        <div className="grid grid-cols-5 gap-3">
          {/* Mock Grid */}
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

// --- Sub Components ---

const MultipleChoiceQuiz = ({
  quiz,
  isChecked,
  onCheck,
}: {
  quiz: Quiz;
  isChecked: boolean;
  onCheck: () => void;
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  // Use HTML parsing for question text to support bold/italic
  const createMarkup = (html: string) => ({ __html: html });

  return (
    <div className="max-w-xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div
        className="text-[17px] font-medium leading-relaxed text-[hsl(var(--foreground))] mb-8"
        dangerouslySetInnerHTML={createMarkup(
          `<span class="text-[hsl(var(--primary))] font-bold mr-1">1.</span> ${quiz.question || ''}`,
        )}
      />

      <div className="space-y-3 mb-8">
        {quiz.options?.map((opt) => {
          const isSelected = selected === opt.key;
          const isCorrect = opt.key === 'A'; // Mock Correct Answer

          let containerClass = 'border-[hsl(var(--border))] bg-[hsl(var(--card))]';
          let keyClass =
            'border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] bg-transparent';

          if (!isChecked && isSelected) {
            containerClass =
              'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 shadow-md shadow-[hsl(var(--primary))]/10';
            keyClass = 'bg-[hsl(var(--primary))] text-white border-transparent';
          } else if (isChecked) {
            if (isCorrect) {
              containerClass = 'border-green-500 bg-green-500/10';
              keyClass = 'bg-green-500 text-white border-transparent';
            } else if (isSelected && !isCorrect) {
              containerClass = 'border-red-500 bg-red-500/10';
              keyClass = 'bg-red-500 text-white border-transparent';
            } else {
              containerClass = 'opacity-50 border-transparent bg-[hsl(var(--muted))]';
            }
          }

          return (
            <div
              key={opt.key}
              onClick={() => !isChecked && setSelected(opt.key)}
              className={`group flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${containerClass} ${!isChecked && 'cursor-pointer hover:border-[hsl(var(--primary))]/50 active:scale-[0.98]'}`}
            >
              <div
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold mr-4 flex-shrink-0 transition-colors ${keyClass}`}
              >
                {opt.key}
              </div>
              <span
                className={`text-[15px] ${isChecked && isCorrect ? 'font-bold text-green-700 dark:text-green-400' : 'text-[hsl(var(--foreground))]'}`}
              >
                {opt.text}
              </span>

              {isChecked && isCorrect && <Check size={20} className="ml-auto text-green-600" />}
            </div>
          );
        })}
      </div>

      {!isChecked && (
        <button
          onClick={onCheck}
          disabled={!selected}
          className="w-full py-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-2xl font-bold text-lg shadow-xl shadow-[hsl(var(--primary))]/20 disabled:opacity-50 disabled:shadow-none hover:translate-y-[-2px] hover:shadow-2xl active:translate-y-[0px] active:scale-[0.98] transition-all"
        >
          Check Answer
        </button>
      )}

      {isChecked && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 animate-in zoom-in-95 duration-300 ${selected === 'A' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}
        >
          <div
            className={`mt-0.5 p-1 rounded-full ${selected === 'A' ? 'bg-green-200 dark:bg-green-800' : 'bg-red-200 dark:bg-red-800'}`}
          >
            {selected === 'A' ? (
              <Check size={16} strokeWidth={3} />
            ) : (
              <X size={16} strokeWidth={3} />
            )}
          </div>
          <div>
            <h4 className="font-bold text-sm mb-1">
              {selected === 'A' ? 'Correct!' : 'Incorrect'}
            </h4>
            <p className="text-xs opacity-90">
              The correct answer is A because adding -ly creates an adverb describing how the task
              is performed.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const GapFillQuiz = ({
  quiz,
  isChecked,
  onCheck,
}: {
  quiz: Quiz;
  isChecked: boolean;
  onCheck: () => void;
}) => {
  const [inputs, setInputs] = useState<{ [key: string]: string }>({});

  // Parse gaps. <gap>answer</gap>.
  // We'll split by regex and render inputs
  const parseContent = () => {
    if (!quiz.question) return [];
    const parts = quiz.question.split(/(<gap[^>]*>.*?<\/gap>)/g);

    return parts.map((part, index) => {
      const match = part.match(/<gap[^>]*>(.*?)<\/gap>/);
      if (match) {
        const answer = match[1];
        const id = `gap-${index}`;
        const val = inputs[id] || '';
        const isCorrect = val.trim().toLowerCase() === answer.trim().toLowerCase();

        return (
          <span key={index} className="inline-block relative mx-1 align-middle">
            <input
              type="text"
              value={val}
              disabled={isChecked}
              onChange={(e) => setInputs((prev) => ({ ...prev, [id]: e.target.value }))}
              className={`
                            h-8 min-w-[80px] w-[12ch] px-2 text-center font-bold rounded-lg border-2 outline-none transition-all
                            ${
                              isChecked
                                ? isCorrect
                                  ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                  : 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                : 'border-[hsl(var(--border))] bg-[hsl(var(--background))] focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))]/10'
                            }
                        `}
            />
            {isChecked && !isCorrect && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-lg whitespace-nowrap z-10 animate-in fade-in zoom-in">
                {answer}
                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-green-600"></div>
              </div>
            )}
          </span>
        );
      }
      return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  return (
    <div className="max-w-xl mx-auto w-full animate-in fade-in Slide-in-from-bottom-4 duration-500">
      <div className="text-[17px] leading-10 text-[hsl(var(--foreground))] mb-8 font-serif">
        {parseContent()}
      </div>

      {!isChecked && (
        <button
          onClick={onCheck}
          className="w-full py-4 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-2xl font-bold text-lg shadow-xl shadow-[hsl(var(--primary))]/20 hover:translate-y-[-2px] hover:shadow-2xl active:translate-y-[0px] active:scale-[0.98] transition-all"
        >
          Check Answer
        </button>
      )}
    </div>
  );
};
