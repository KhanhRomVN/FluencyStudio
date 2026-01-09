import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Check, ChevronUp } from 'lucide-react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';

interface SpeechBuilderProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
}

interface CardState {
  score: number;
  passed: boolean;
  attempts: number;
  bestScore: number;
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

export const SpeechBuilder: React.FC<SpeechBuilderProps> = ({ quiz }) => {
  // Support both new 'builders' and old 'sentences' fields for compatibility
  const items = quiz.builders || quiz.sentences || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Initialize card states
  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    items.forEach((item) => {
      initialStates[item.id] = { score: 0, passed: false, attempts: 0, bestScore: 0 };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id]);

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

  // Construct target sentence from Builder item
  const getTargetSentence = (item: any) => {
    // New logic: Use answers array to fill gaps in question
    if (item.question && item.answers) {
      let text = item.question;
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = text;
      const gaps = tempDiv.getElementsByTagName('gap');

      // Replace gaps with answers in the temp DOM
      for (let i = 0; i < gaps.length; i++) {
        const gapId = gaps[i].getAttribute('id');
        // Find answer by ID
        const answerObj = item.answers.find((a: any) => a.id === gapId);
        if (answerObj) {
          gaps[i].textContent = answerObj.answer;
        } else if (item.answers[i]) {
          // Fallback to index if no ID match (legacy/safety)
          gaps[i].textContent = item.answers[i].answer;
        }
      }
      return tempDiv.textContent || '';
    }

    // Fallback old logic
    if (!item || !item.correctOrder || !item.items) return '';
    return item.correctOrder.map((i: number) => item.items[i]).join(' ');
  };

  // Start recording
  const startRecording = useCallback(() => {
    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setTranscript('');
    setIsRecording(true);

    const currentItem = items[currentIndex];
    const targetText = getTargetSentence(currentItem);

    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        const score = calculateScore(finalTranscript, targetText);

        setCardStates((prev) => {
          const currentState = prev[currentItem.id] || {
            score: 0,
            passed: false,
            attempts: 0,
            bestScore: 0,
          };
          const newBestScore = Math.max(currentState.bestScore, score);
          const newPassed = newBestScore >= PASS_THRESHOLD;

          return {
            ...prev,
            [currentItem.id]: {
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
  }, [currentIndex, items, initRecognition]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Move to next card
  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setTranscript('');

      // Scroll to show the new current card
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [currentIndex, items.length]);

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score === 0) return 'text-[hsl(var(--muted-foreground))]';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number): string => {
    if (score === 0) return 'bg-[hsl(var(--muted))]';
    if (score >= 80) return 'bg-green-500/20';
    if (score >= 60) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  // Render a single card
  const renderCard = (item: any, index: number) => {
    const state = cardStates[item.id] || { score: 0, passed: false, attempts: 0, bestScore: 0 };
    const isCurrent = index === currentIndex;
    const isPassed = index < currentIndex || state.passed;
    const isFuture = index > currentIndex;
    const targetText = getTargetSentence(item);

    // Hide future cards
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
        {/* Card Header */}
        <div className="flex items-center justify-between p-4 border-b border-[hsl(var(--border))]/50">
          <div className="flex items-center gap-2">
            {isPassed && !isCurrent && (
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={14} className="text-white" strokeWidth={3} />
              </div>
            )}
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {index + 1}/{items.length}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6 text-center space-y-6">
          {/* Context Hint */}
          {(item.hint || item.translate) && (
            <div className="text-sm text-[hsl(var(--muted-foreground))] italic">
              <RichTextParser content={item.hint || item.translate} />
            </div>
          )}
          {/* Scrambled Words Display */}
          {/* Question Display with Gaps */}
          {item.question ? (
            <div className="text-xl font-medium leading-relaxed">
              <RichTextParser
                content={item.question}
                onGapFound={(id) => {
                  // Find answer by ID
                  const answerObj = item.answers?.find((a: any) => a.id === id);
                  // If not found by ID, try index fallback if the ID looks like an index or just sequential?
                  // Actually let's just stick to ID first.
                  const answerText = answerObj?.answer || '';

                  // Calculate underscores based on answer length
                  const gapLength = answerText.length > 0 ? answerText.length : 5;
                  const underscores = '_'.repeat(gapLength);

                  return (
                    <span
                      key={id}
                      className={`
                          inline-block mx-1 font-bold tracking-widest
                          ${state.passed ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--primary))] opacity-50'}
                      `}
                    >
                      {state.passed ? answerText : underscores}
                    </span>
                  );
                }}
              />
            </div>
          ) : (
            /* Legacy Scrambled Words Display */
            <div className="flex flex-wrap gap-2 justify-center">
              {item.items?.map((word: string, idx: number) => (
                <span
                  key={idx}
                  className={`
                            px-3 py-1.5 rounded-lg font-medium text-sm
                            ${
                              state.passed
                                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]'
                            }
                        `}
                >
                  {word}
                </span>
              ))}
            </div>
          )}
          {/* Reveal Correct Answer if Passed */}
          {state.passed && (
            <div className="text-lg font-bold text-[hsl(var(--primary))] animate-in fade-in slide-in-from-bottom-2">
              {targetText}
            </div>
          )}
          {/* Score Display */}
          {isCurrent && state.attempts > 0 && !state.passed && (
            <div className={`mt-4 p-3 rounded-xl ${getScoreBgColor(state.score)}`}>
              <div className={`text-3xl font-bold ${getScoreColor(state.score)}`}>
                {state.bestScore}%
              </div>
              {transcript && (
                <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  You said: "{transcript}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Card Actions (Current Card Only) */}
        {isCurrent && (
          <div className="p-4 border-t border-[hsl(var(--border))]/50 flex items-center justify-center gap-4">
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

            {state.passed && currentIndex < items.length - 1 && (
              <button
                onClick={goToNext}
                className="h-14 px-6 rounded-full bg-green-500 text-white font-bold flex items-center gap-2 hover:bg-green-600 transition-colors shadow-lg"
              >
                Next
                <ChevronUp size={20} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No speech builder items available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden">
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
          {items.slice(0, currentIndex).map((item, index) => renderCard(item, index))}

          {/* Current card */}
          {items[currentIndex] && renderCard(items[currentIndex], currentIndex)}
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
    </div>
  );
};
