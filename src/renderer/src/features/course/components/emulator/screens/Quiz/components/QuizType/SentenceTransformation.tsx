import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronRight, RotateCcw, Info, Lightbulb } from 'lucide-react';
import { Quiz } from '../../types';
import { ExplainDrawer } from '../ExplainDrawer';
import { RichTextParser } from '../RichTextParser';

interface SentenceTransformationProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
}

interface CardState {
  userAnswer: string;
  isCorrect: boolean | null;
  isChecked: boolean;
}

export const SentenceTransformation: React.FC<SentenceTransformationProps> = ({ quiz }) => {
  const transformations = quiz.transformations || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');

  // Initialize card states
  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    transformations.forEach((item) => {
      initialStates[item.id] = {
        userAnswer: '',
        isCorrect: null,
        isChecked: false,
      };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id]);

  const currentItem = transformations[currentIndex];
  const currentState = cardStates[currentItem?.id] || {
    userAnswer: '',
    isCorrect: null,
    isChecked: false,
  };

  // Handle input change
  const handleInputChange = useCallback(
    (value: string) => {
      if (!currentItem || currentState.isChecked) return;

      setCardStates((prev) => ({
        ...prev,
        [currentItem.id]: {
          ...prev[currentItem.id],
          userAnswer: value,
        },
      }));
    },
    [currentItem, currentState.isChecked],
  );

  // Check answer
  const checkAnswer = useCallback(() => {
    if (!currentItem) return;

    const userAnswerNormalized = currentState.userAnswer.toLowerCase().trim();
    let isCorrect = false;

    if (Array.isArray(currentItem.answer)) {
      isCorrect = currentItem.answer.some(
        (ans) => ans.toLowerCase().trim() === userAnswerNormalized,
      );
    } else {
      isCorrect = currentItem.answer.toLowerCase().trim() === userAnswerNormalized;
    }

    setCardStates((prev) => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        isCorrect,
        isChecked: true,
      },
    }));
  }, [currentItem, currentState.userAnswer]);

  // Reset current
  const resetCurrent = useCallback(() => {
    if (!currentItem) return;

    setCardStates((prev) => ({
      ...prev,
      [currentItem.id]: {
        userAnswer: '',
        isCorrect: null,
        isChecked: false,
      },
    }));
  }, [currentItem]);

  // Go to next
  const goToNext = useCallback(() => {
    if (currentIndex < transformations.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, transformations.length]);

  // Get correct answer display
  const getCorrectAnswer = () => {
    if (!currentItem) return '';
    if (Array.isArray(currentItem.answer)) {
      return currentItem.answer[0];
    }
    return currentItem.answer;
  };

  if (transformations.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No transformations available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]/50">
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-bold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-2 py-0.5 rounded">
            {currentIndex + 1}/{transformations.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        {currentItem && (
          <div
            className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
            key={currentItem.id}
          >
            {/* Original Sentence */}
            <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
              <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase font-bold mb-2">
                Original Sentence
              </p>
              <p className="text-[16px] text-[hsl(var(--foreground))] leading-relaxed">
                {currentItem.original}
              </p>
            </div>

            {/* Keyword */}
            <div className="flex items-center gap-3">
              <Lightbulb size={20} className="text-yellow-500" />
              <div>
                <span className="text-[16px] text-[hsl(var(--muted-foreground))]">
                  Use the word:{' '}
                </span>
                <span className="font-bold text-[hsl(var(--primary))] uppercase tracking-wider">
                  {currentItem.keyword}
                </span>
              </div>
            </div>

            {/* Input Area */}
            <div className="space-y-2">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Rewrite the sentence with the same meaning:
              </p>
              <textarea
                value={currentState.userAnswer}
                onChange={(e) => handleInputChange(e.target.value)}
                disabled={currentState.isChecked}
                placeholder="Type your answer here..."
                className={`w-full h-32 p-4 rounded-xl border-2 transition-colors resize-none text-[hsl(var(--foreground))] text-[16px] ${
                  currentState.isChecked
                    ? currentState.isCorrect
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-red-500 bg-red-500/10'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] focus:border-[hsl(var(--primary))] focus:outline-none'
                }`}
              />
            </div>

            {/* Result Display */}
            {currentState.isChecked && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {currentState.isCorrect ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <Check size={20} strokeWidth={3} />
                    <span className="font-bold">Correct!</span>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500">
                    <p className="text-sm text-green-600 font-medium">Correct answer:</p>
                    <p className="text-[hsl(var(--foreground))] font-bold mt-1">
                      {getCorrectAnswer()}
                    </p>
                  </div>
                )}

                {currentItem.explain && (
                  <button
                    onClick={() => {
                      setCurrentExplanation(currentItem.explain || '');
                      setIsExplainOpen(true);
                    }}
                    className="flex items-center gap-2 text-[hsl(var(--primary))] text-sm font-bold hover:underline"
                  >
                    <Info size={16} />
                    View Explanation
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[hsl(var(--border))]/50 bg-[hsl(var(--card))]">
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={resetCurrent}
            className="h-12 px-4 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-medium flex items-center gap-2 hover:bg-[hsl(var(--muted))]/80 transition-colors"
          >
            <RotateCcw size={18} />
            Reset
          </button>

          {!currentState.isChecked && currentState.userAnswer.trim().length > 0 && (
            <button
              onClick={checkAnswer}
              className="h-12 px-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg"
            >
              <Check size={20} />
              Check
            </button>
          )}

          {currentState.isChecked && currentIndex < transformations.length - 1 && (
            <button
              onClick={goToNext}
              className="h-12 px-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg"
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </div>

      <ExplainDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        explanation={currentExplanation}
      />
    </div>
  );
};
