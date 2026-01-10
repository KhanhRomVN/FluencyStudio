import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quiz, DictationItem } from '../../types';
import { Play, Pause, Check, RotateCcw, ChevronRight, AudioLines } from 'lucide-react';
import { RichTextParser } from '../RichTextParser';

interface DictationProps {
  quiz: Quiz;
  isChecked?: boolean;
  onCheck?: () => void;
}

interface CardState {
  score: number;
  passed: boolean;
  attempts: number;
  inputValue: string;
}

const PASS_THRESHOLD = 100; // Dictation usually requires exact match or high accuracy

export const Dictation: React.FC<DictationProps> = ({ quiz, isChecked = false, onCheck }) => {
  const dictations = quiz.dictations || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize card states
  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    dictations.forEach((item) => {
      initialStates[item.id] = { score: 0, passed: false, attempts: 0, inputValue: '' };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id, dictations]);

  // Handle Play Audio/TTS
  const handlePlay = (item: DictationItem) => {
    // Stop others
    if (playingId) {
      if (audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
        audioRefs.current[playingId].currentTime = 0;
      }
      window.speechSynthesis.cancel();
      setPlayingId(null);
    }

    if (playingId === item.id) {
      return;
    }

    setPlayingId(item.id);

    if (item.audio) {
      // Audio Mode
      const audio = new Audio(item.audio);
      audioRefs.current[item.id] = audio;

      audio.onended = () => setPlayingId(null);
      audio.onpause = () => setPlayingId(null);

      audio.play().catch((e) => {
        console.error('Audio play failed', e);
        setPlayingId(null);
      });
    } else if (item.text) {
      // TTS Mode
      const utterance = new SpeechSynthesisUtterance(item.text);
      if (item.speed) utterance.rate = item.speed;

      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleInputChange = (id: string, val: string) => {
    setCardStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], inputValue: val },
    }));
  };

  const checkAnswer = (item: DictationItem) => {
    const state = cardStates[item.id];
    const userVal = (state?.inputValue || '').trim();
    const correctVal = ((item.audio ? item.transcript : item.text) || '').trim();

    // Remove punctuation for easier matching if we want lenient check
    // But specific requirement says "Pay attention to punctuation" in instruction
    // Let's stick to simple normalization (trim) or exact match for now?
    // User instruction says: "type exactly what you hear. Pay attention to punctuation and capitalization."
    // So we should expect exact match or maybe case-insensitive?
    // Let's do case-sensitive for strictness or maybe case-insensitive but warn?
    // Usually dictation is strict.

    // Let's compare case-insensitive for score calculation but maybe show diffs?
    // For simplicity, let's just do exact string comparison first.

    const isCorrect = userVal === correctVal;
    const score = isCorrect ? 100 : 0; // Binary score for now? Or usage of Levenshtein?

    // Let's use Levenshtein for partial score?
    // Calculate simple similarity
    const similarity = calculateSimilarity(userVal, correctVal);

    setCardStates((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        score: similarity,
        passed: similarity === 100, // Strict pass?
        attempts: (prev[item.id]?.attempts || 0) + 1,
      },
    }));
  };

  const calculateSimilarity = (s1: string, s2: string) => {
    if (s1 === s2) return 100;
    // Simple length based diff? Levenshtein is better.
    // Re-implementing simplified Levenshtein or just simple check.
    // reusing logic from previous ChattingSpeech or PronunciationDrill if available.
    // I'll use a simple matching percentage.

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    if (longer.length === 0) return 100;

    const editDistance = levenshteinDistance(s1, s2);
    return Math.round(((longer.length - editDistance) / longer.length) * 100);
  };

  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  };

  const retryCurrentCard = () => {
    const item = dictations[currentIndex];
    setCardStates((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], score: 0, passed: false, inputValue: '' },
    }));
  };

  const goToNext = () => {
    if (currentIndex < dictations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  };

  const getScoreColor = (score: number) => {
    if (score === 100) return 'text-green-500';
    if (score >= 80) return 'text-yellow-500';
    return 'text-red-500';
  };

  const renderCard = (item: DictationItem, index: number) => {
    const state = cardStates[item.id] || { score: 0, passed: false, attempts: 0, inputValue: '' };
    const isCurrent = index === currentIndex;
    const isPassed = index < currentIndex || state.passed;
    const isFuture = index > currentIndex;
    const correctText = item.audio ? item.transcript : item.text;

    if (isFuture) return null;

    return (
      <div
        key={item.id}
        className={`
          relative rounded-2xl border transition-all duration-500 ease-out
          ${
            isCurrent
              ? 'bg-[hsl(var(--card))] border-[hsl(var(--primary))]/50 shadow-lg shadow-[hsl(var(--primary))]/10'
              : 'bg-[hsl(var(--muted))]/50 border-[hsl(var(--border))] opacity-75 pointer-events-none'
          }
          ${isCurrent ? 'animate-in slide-in-from-bottom-8 fade-in duration-500' : ''}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]/50">
          <div className="flex items-center gap-2">
            {isPassed && !isCurrent && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
            )}
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {index + 1}/{dictations.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-center space-y-6">
          {/* Play Button */}
          <div className="flex justify-center">
            <button
              onClick={() => handlePlay(item)}
              className={`
                      w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                      ${
                        playingId === item.id
                          ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                          : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
                      }
                    `}
            >
              {playingId === item.id ? (
                <AudioLines size={28} className="animate-pulse" />
              ) : (
                <AudioLines size={28} />
              )}
            </button>
          </div>

          {!item.audio && item.speed && (
            <div className="text-xs text-[hsl(var(--muted-foreground))] opacity-70">
              Speed: {item.speed}x
            </div>
          )}

          {/* Score Display */}
          {state.attempts > 0 && (
            <div className={`text-3xl font-bold ${getScoreColor(state.score)}`}>{state.score}%</div>
          )}

          {/* Input Area */}
          <textarea
            value={state.inputValue}
            onChange={(e) => handleInputChange(item.id, e.target.value)}
            disabled={state.passed || (isPassed && !isCurrent)}
            placeholder="Type what you hear..."
            className={`
                w-full p-4 rounded-xl border-2 resize-none transition-all text-lg font-medium bg-transparent placeholder:text-left
                placeholder:text-lg placeholder:text-[hsl(var(--muted-foreground))]/70
                ${
                  state.attempts > 0 && !state.passed
                    ? 'border-red-500 border-dashed focus:border-red-500' // Error state
                    : state.passed
                      ? 'border-[hsl(var(--primary))] border-dashed text-[hsl(var(--primary))]' // Success state
                      : 'border-[hsl(var(--border))] border-dashed focus:border-[hsl(var(--primary))]' // Normal state
                }
              `}
            rows={3}
          />

          {/* Feedback / Correct Answer */}
          {state.attempts > 0 && !state.passed && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <p className="text-red-500 font-medium mb-1">Incorrect</p>
              {/* Suggestion: don't show correct answer immediately? Or do? 
                         User format implies it's like PronunciationDrill which shows feedback.
                         Let's show correct answer if failed.
                      */}
              {/* <div className="text-[hsl(var(--muted-foreground))] line-through text-sm">{state.inputValue}</div> */}
            </div>
          )}

          {/* Show correct answer if passed or explicit give up? For now show if passed */}
          {state.passed && (
            <div className="animate-in fade-in zoom-in-95">
              <p className="text-xl font-bold text-[hsl(var(--primary))]">{correctText}</p>
            </div>
          )}

          {/* IPA & Translation - Show only if passed? Or always? PronunciationDrill shows always.
                But Dictation reveals answer. IPA acts as hint or answer. 
                Let's show IPA only if passed. 
            */}
          {state.passed && (
            <div className="space-y-2">
              {item.ipa && (
                <div className="text-[hsl(var(--primary))] text-base font-mono">{item.ipa}</div>
              )}
              {item.translate && (
                <div className="text-[hsl(var(--muted-foreground))] text-sm italic">
                  {item.translate}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {isCurrent && (
          <div className="p-4 border-t border-[hsl(var(--border))]/50">
            {!state.passed ? (
              <button
                onClick={() => checkAnswer(item)}
                className="w-full h-12 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold hover:opacity-90 transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
              >
                Check Answer
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={retryCurrentCard}
                  className="flex-1 h-12 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <RotateCcw size={18} />
                  Retry
                </button>
                {currentIndex < dictations.length - 1 && (
                  <button
                    onClick={goToNext}
                    className="flex-1 h-12 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md animate-in zoom-in"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (dictations.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No dictation items available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden relative">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden flex flex-col"
      >
        {quiz.instruction && (
          <div className="text-[hsl(var(--foreground))] text-[16px] text-center opacity-80 mb-4">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center space-y-4 max-w-2xl mx-auto w-full">
          {dictations.slice(0, currentIndex + 1).map((item, index) => renderCard(item, index))}
        </div>

        {/* Spacer */}
        <div className="h-14 flex-shrink-0" />
      </div>
    </div>
  );
};
