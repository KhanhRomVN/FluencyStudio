import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Check, StepForward, ChevronRight, RotateCcw } from 'lucide-react';
import { Quiz, PronunciationDrillItem } from '../../types';
import { RichTextParser } from '../RichTextParser';

interface PronunciationDrillProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
}

interface CardState {
  score: number;
  passed: boolean;
  attempts: number;
  bestScore: number;
}

interface WordFeedback {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
}

// Extend window type for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

const PASS_THRESHOLD = 70; // Minimum score to pass

export const PronunciationDrill: React.FC<PronunciationDrillProps> = ({ quiz }) => {
  const drills = quiz.drills || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [wordFeedback, setWordFeedback] = useState<WordFeedback[]>([]);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize card states
  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    drills.forEach((drill) => {
      initialStates[drill.id] = { score: 0, passed: false, attempts: 0, bestScore: 0 };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id]);

  // Text-to-Speech function (currently unused but kept for future use)
  // const speakText = useCallback((text: string) => {
  //   if ('speechSynthesis' in window) {
  //     window.speechSynthesis.cancel();
  //     const utterance = new SpeechSynthesisUtterance(text);
  //     utterance.lang = 'en-US';
  //     utterance.rate = 0.9;
  //     window.speechSynthesis.speak(utterance);
  //   }
  // }, []);

  // Initialize Speech Recognition
  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition not supported');
      return null;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    recognition.continuous = false;

    return recognition;
  }, []);

  // Calculate similarity score between two strings
  const calculateScore = (spoken: string, target: string): number => {
    const spokenLower = spoken.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();

    if (spokenLower === targetLower) return 100;

    // Simple word matching for phrases
    const spokenWords = spokenLower.split(/\s+/);
    const targetWords = targetLower.split(/\s+/);

    let matches = 0;
    targetWords.forEach((word) => {
      if (spokenWords.some((sw) => sw.includes(word) || word.includes(sw))) {
        matches++;
      }
    });

    return Math.round((matches / targetWords.length) * 100);
  };

  // Simulate pronunciation with some errors
  const simulatePronunciation = (targetText: string): string => {
    const words = targetText.split(' ');
    const result: string[] = [];
    const errorRate = 0.3; // 30% chance of error per word

    words.forEach((word) => {
      const rand = Math.random();

      if (rand < errorRate * 0.4) {
        // Skip this word (missing word)
        return;
      } else if (rand < errorRate * 0.7) {
        // Replace with a similar but wrong word
        const wrongWords = ['the', 'a', 'an', 'is', 'was', 'were', 'very', 'much', 'so'];
        result.push(wrongWords[Math.floor(Math.random() * wrongWords.length)]);
      } else if (rand < errorRate) {
        // Misspell the word slightly
        const chars = word.split('');
        const idx = Math.floor(Math.random() * chars.length);
        chars[idx] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        result.push(chars.join(''));
      } else {
        // Correct word
        result.push(word);
      }
    });

    // Sometimes add extra words
    if (Math.random() < 0.2) {
      const extraWords = ['um', 'uh', 'like', 'actually'];
      const extraWord = extraWords[Math.floor(Math.random() * extraWords.length)];
      const insertPos = Math.floor(Math.random() * (result.length + 1));
      result.splice(insertPos, 0, extraWord);
    }

    return result.join(' ');
  };

  // Analyze word-by-word feedback
  const analyzeWordFeedback = (spoken: string, target: string): WordFeedback[] => {
    const spokenWords = spoken
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w);
    const targetWords = target
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w);

    // Create feedback array with same length as target, maintaining order
    const feedback: WordFeedback[] = new Array(targetWords.length);
    const usedSpokenIndices = new Set<number>();

    // First pass: find exact matches
    targetWords.forEach((targetWord, targetIdx) => {
      const spokenIdx = spokenWords.findIndex(
        (w, idx) => !usedSpokenIndices.has(idx) && w === targetWord,
      );

      if (spokenIdx !== -1) {
        feedback[targetIdx] = { word: targetWord, status: 'correct' };
        usedSpokenIndices.add(spokenIdx);
      }
    });

    // Second pass: find similar matches for remaining words
    targetWords.forEach((targetWord, targetIdx) => {
      if (feedback[targetIdx]) return; // Already matched

      const spokenIdx = spokenWords.findIndex(
        (w, idx) =>
          !usedSpokenIndices.has(idx) &&
          (w.includes(targetWord) ||
            targetWord.includes(w) ||
            levenshteinDistance(w, targetWord) <= 2),
      );

      if (spokenIdx !== -1) {
        feedback[targetIdx] = { word: targetWord, status: 'incorrect' };
        usedSpokenIndices.add(spokenIdx);
      } else {
        feedback[targetIdx] = { word: targetWord, status: 'missing' };
      }
    });

    // Third pass: find extra words (append at the end)
    const extraWords: WordFeedback[] = [];
    spokenWords.forEach((spokenWord, idx) => {
      if (!usedSpokenIndices.has(idx)) {
        extraWords.push({ word: spokenWord, status: 'extra' });
      }
    });

    return [...feedback, ...extraWords];
  };

  // Levenshtein distance for fuzzy matching
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

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

  // Start recording
  const startRecording = useCallback(() => {
    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setTranscript('');
    setIsRecording(true);

    const currentDrill = drills[currentIndex];

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        const score = calculateScore(finalTranscript, currentDrill.text);

        setCardStates((prev) => {
          const currentState = prev[currentDrill.id] || {
            score: 0,
            passed: false,
            attempts: 0,
            bestScore: 0,
          };
          const newBestScore = Math.max(currentState.bestScore, score);
          const newPassed = newBestScore >= PASS_THRESHOLD;

          return {
            ...prev,
            [currentDrill.id]: {
              score,
              passed: newPassed,
              attempts: currentState.attempts + 1,
              bestScore: newBestScore,
            },
          };
        });
      }
    };

    recognition.onerror = (event) => {
      console.error('Recognition error:', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  }, [currentIndex, drills, initRecognition]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Retry current card
  const retryCurrentCard = useCallback(() => {
    const currentDrill = drills[currentIndex];
    setCardStates((prev) => ({
      ...prev,
      [currentDrill.id]: { score: 0, passed: false, attempts: 0, bestScore: 0 },
    }));
    setTranscript('');
    setWordFeedback([]);
  }, [currentIndex, drills]);

  // Move to next card
  const goToNext = useCallback(() => {
    if (currentIndex < drills.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTranscript('');
      setWordFeedback([]);

      // Scroll to show the new current card
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [currentIndex, drills.length]);

  // Simulate pronunciation test (for emulator testing)
  const simulateTest = useCallback(() => {
    const currentDrill = drills[currentIndex];
    const simulatedTranscript = simulatePronunciation(currentDrill.text);
    const score = calculateScore(simulatedTranscript, currentDrill.text);
    const feedback = analyzeWordFeedback(simulatedTranscript, currentDrill.text);

    setTranscript(simulatedTranscript);
    setWordFeedback(feedback);

    setCardStates((prev) => {
      const currentState = prev[currentDrill.id] || {
        score: 0,
        passed: false,
        attempts: 0,
        bestScore: 0,
      };
      const newBestScore = Math.max(currentState.bestScore, score);
      const newPassed = newBestScore >= PASS_THRESHOLD;

      return {
        ...prev,
        [currentDrill.id]: {
          score,
          passed: newPassed,
          attempts: currentState.attempts + 1,
          bestScore: newBestScore,
        },
      };
    });
  }, [currentIndex, drills]);

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score === 0) return 'text-[hsl(var(--muted-foreground))]';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Render hidden word text
  // Render text with color-coded pronunciation feedback
  const renderTextWithFeedback = (
    drill: PronunciationDrillItem,
    isPassed: boolean,
    isCurrent: boolean,
  ) => {
    const hasAttempt = isCurrent && wordFeedback.length > 0;

    // If hiddenWord mode and not passed, show underscores
    if (drill.hiddenWord && !isPassed && !hasAttempt) {
      const words = drill.text.split(' ');
      return (
        <span className="text-[16px] font-bold">
          {words.map((word, idx) => {
            const isHidden = word.toLowerCase().includes(drill.hiddenWord!.toLowerCase());
            if (isHidden) {
              return (
                <span key={idx}>
                  <span className="text-[hsl(var(--primary))] mx-0.5 font-bold tracking-widest">
                    {'_'.repeat(word.length)}
                  </span>
                  {idx < words.length - 1 ? ' ' : ''}
                </span>
              );
            }
            return (
              <span key={idx}>
                {word}
                {idx < words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </span>
      );
    }

    // Show color-coded feedback based on pronunciation attempt
    if (hasAttempt) {
      return (
        <span className="text-[16px] font-bold">
          {wordFeedback.map((item, idx) => {
            // Skip extra words in the original text display
            if (item.status === 'extra') return null;

            let colorClass = '';
            if (item.status === 'correct') {
              colorClass = 'text-[hsl(var(--primary))]';
            } else if (item.status === 'incorrect' || item.status === 'missing') {
              colorClass = 'text-red-500';
            }

            return (
              <span key={idx}>
                <span className={colorClass}>{item.word}</span>
                {idx < wordFeedback.filter((f) => f.status !== 'extra').length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </span>
      );
    }

    // Default display
    const words = drill.text.split(' ');
    return (
      <span className="text-lg font-bold">
        {words.map((word, idx) => {
          const isHidden =
            drill.hiddenWord && word.toLowerCase().includes(drill.hiddenWord.toLowerCase());
          return (
            <span key={idx} className={isHidden && isPassed ? 'text-[hsl(var(--primary))]' : ''}>
              {word}
              {idx < words.length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  };

  // Render a single card
  const renderCard = (drill: PronunciationDrillItem, index: number) => {
    const state = cardStates[drill.id] || { score: 0, passed: false, attempts: 0, bestScore: 0 };
    const isCurrent = index === currentIndex;
    const isPassed = index < currentIndex || state.passed;
    const isFuture = index > currentIndex;

    // Hide future cards
    if (isFuture) return null;

    return (
      <div
        key={drill.id}
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
        {/* Card Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]/50">
          <div className="flex items-center gap-2">
            {isPassed && !isCurrent && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
            )}
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {index + 1}/{drills.length}
            </span>
          </div>

          {/* Icons removed */}
        </div>

        {/* Card Content */}
        <div className="p-6 text-center space-y-4">
          {/* Score Display - shown above text when there's an attempt */}
          {isCurrent && state.attempts > 0 && (
            <div className={`text-3xl font-bold ${getScoreColor(state.score)}`}>
              {state.bestScore}%
            </div>
          )}

          {/* Main Text */}
          <div className="text-[hsl(var(--foreground))]">
            {renderTextWithFeedback(drill, isPassed, isCurrent)}
          </div>

          {/* IPA */}
          <div className="text-[hsl(var(--primary))] text-base font-mono">{drill.ipa}</div>

          {/* Translation */}
          <div className="text-[hsl(var(--muted-foreground))] text-sm italic">
            {drill.translate}
          </div>

          {/* Transcript Display - with dashed border */}
          {isCurrent && transcript && (
            <div className="mt-4 p-3 rounded-xl border-2 border-dashed border-[hsl(var(--primary))]">
              <div className="text-sm text-[hsl(var(--muted-foreground))]">"{transcript}"</div>
            </div>
          )}
        </div>

        {/* Card Actions (Current Card Only) */}
        {isCurrent && (
          <div className="p-4 border-t border-[hsl(var(--border))]/50">
            {/* Show Retry and Next buttons if score >= 50% */}
            {state.attempts > 0 && state.bestScore >= 50 ? (
              <div className="flex gap-3">
                <button
                  onClick={retryCurrentCard}
                  className="flex-1 h-10 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <RotateCcw size={18} />
                  Retry
                </button>
                {currentIndex < drills.length - 1 && (
                  <button
                    onClick={goToNext}
                    className="flex-1 h-10 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md"
                  >
                    Next
                    <ChevronRight size={20} />
                  </button>
                )}
              </div>
            ) : state.attempts > 0 && state.bestScore < 50 ? (
              /* Show retry button (icon only) if score < 50% */
              <div className="flex items-center justify-center">
                <button
                  onClick={retryCurrentCard}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:opacity-90"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            ) : (
              /* Show mic button if no attempt yet */
              <div className="flex items-center justify-center">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                    ${
                      isRecording
                        ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                        : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
                    }
                  `}
                >
                  {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (drills.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No pronunciation drills available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden relative">
      {/* Cards Container - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden flex flex-col"
      >
        {quiz.instruction && (
          <div className="text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center space-y-4">
          {/* Passed cards */}
          {drills.slice(0, currentIndex).map((drill, index) => renderCard(drill, index))}

          {/* Current card */}
          {drills[currentIndex] && renderCard(drills[currentIndex], currentIndex)}
        </div>

        {/* Invisible spacer to balance the top instruction ensuring the cards are perfectly centered in the screen */}
        {quiz.instruction && (
          <div className="opacity-0 pointer-events-none select-none text-[16px]" aria-hidden="true">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}

        {/* Extra spacer to shift content up by app bar height */}
        <div className="h-14 flex-shrink-0" />
      </div>

      {/* Test Button - Bottom Right Corner */}
      <button
        onClick={simulateTest}
        className="absolute bottom-6 right-6 w-12 h-12 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-lg hover:opacity-90 transition-all duration-300 flex items-center justify-center z-10"
        title="Simulate pronunciation test"
      >
        <StepForward size={20} />
      </button>
    </div>
  );
};
