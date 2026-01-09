import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bookmark, Repeat2, RotateCcw, Mic, MicOff, Check, ChevronUp } from 'lucide-react';
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

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

  // Text-to-Speech function
  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

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

  // Restart current card
  const restartCard = useCallback(() => {
    const currentDrill = drills[currentIndex];
    setCardStates((prev) => ({
      ...prev,
      [currentDrill.id]: { score: 0, passed: false, attempts: 0, bestScore: 0 },
    }));
    setTranscript('');
  }, [currentIndex, drills]);

  // Move to next card
  const goToNext = useCallback(() => {
    if (currentIndex < drills.length - 1) {
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
  }, [currentIndex, drills.length]);

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

  // Render hidden word text
  const renderHiddenText = (drill: PronunciationDrillItem, isPassed: boolean) => {
    if (!drill.hiddenWord) {
      return <span className="text-lg font-bold">{drill.text}</span>;
    }

    const words = drill.text.split(' ');
    return (
      <span className="text-[16px] font-bold">
        {words.map((word, idx) => {
          const isHidden = word.toLowerCase().includes(drill.hiddenWord!.toLowerCase());
          if (isHidden && !isPassed) {
            return (
              <span key={idx}>
                <span className="inline-block border-b-2 border-dashed border-[hsl(var(--primary))] px-2 mx-0.5">
                  {'_'.repeat(word.length)}
                </span>
                {idx < words.length - 1 ? ' ' : ''}
              </span>
            );
          }
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

          {isCurrent && (
            <div className="flex items-center gap-1">
              <button
                className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
                title="Save (coming soon)"
              >
                <Bookmark size={18} />
              </button>
              <button
                onClick={() => speakText(drill.text)}
                disabled={isSpeaking}
                className={`p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors ${
                  isSpeaking
                    ? 'text-[hsl(var(--primary))] animate-pulse'
                    : 'text-[hsl(var(--muted-foreground))]'
                }`}
                title="Listen"
              >
                <Repeat2 size={18} />
              </button>
              <button
                onClick={restartCard}
                className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-[hsl(var(--muted-foreground))]"
                title="Restart"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-6 text-center space-y-4">
          {/* Main Text */}
          <div className="text-[hsl(var(--foreground))]">{renderHiddenText(drill, isPassed)}</div>

          {/* IPA */}
          <div className="text-[hsl(var(--primary))] text-base font-mono">{drill.ipa}</div>

          {/* Translation */}
          <div className="text-[hsl(var(--muted-foreground))] text-sm italic">
            {drill.translate}
          </div>

          {/* Score Display */}
          {isCurrent && state.attempts > 0 && (
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
                w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg
                ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                    : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
                }
              `}
            >
              {isRecording ? <MicOff size={28} /> : <Mic size={28} />}
            </button>

            {state.passed && currentIndex < drills.length - 1 && (
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

  if (drills.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No pronunciation drills available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]/50">
        <p className="font-bold">Pronunciation Drill</p>
      </div>

      {/* Cards Container - Scrollable */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:hidden"
      >
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        {/* Passed cards */}
        {drills.slice(0, currentIndex).map((drill, index) => renderCard(drill, index))}

        {/* Current card */}
        {drills[currentIndex] && renderCard(drills[currentIndex], currentIndex)}
      </div>
    </div>
  );
};
