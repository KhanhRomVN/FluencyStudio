import React, { useState, useEffect, useCallback } from 'react';
import { Check, RotateCcw, ChevronRight } from 'lucide-react';
import { Quiz } from '../../types';

interface SentenceBuilderProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
}

interface CardState {
  selectedIndices: number[];
  isCorrect: boolean | null;
  isChecked: boolean;
}

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({ quiz, header }) => {
  const sentences = quiz.sentences || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  // Initialize card states
  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    sentences.forEach((sentence) => {
      initialStates[sentence.id] = {
        selectedIndices: [],
        isCorrect: null,
        isChecked: false,
      };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id]);

  const currentSentence = sentences[currentIndex];
  const currentState = cardStates[currentSentence?.id] || {
    selectedIndices: [],
    isCorrect: null,
    isChecked: false,
  };

  // Handle word selection
  const handleWordClick = useCallback(
    (wordIndex: number) => {
      if (!currentSentence || currentState.isChecked) return;

      setCardStates((prev) => {
        const current = prev[currentSentence.id];
        const selected = current.selectedIndices;

        // If already selected, allow removing (last one only)
        if (selected.includes(wordIndex)) {
          if (selected[selected.length - 1] === wordIndex) {
            return {
              ...prev,
              [currentSentence.id]: {
                ...current,
                selectedIndices: selected.slice(0, -1),
              },
            };
          }
          return prev;
        }

        // Add to selection
        return {
          ...prev,
          [currentSentence.id]: {
            ...current,
            selectedIndices: [...selected, wordIndex],
          },
        };
      });
    },
    [currentSentence, currentState.isChecked],
  );

  // Check answer
  const checkAnswer = useCallback(() => {
    if (!currentSentence) return;

    const isCorrect =
      JSON.stringify(currentState.selectedIndices) === JSON.stringify(currentSentence.correctOrder);

    setCardStates((prev) => ({
      ...prev,
      [currentSentence.id]: {
        ...prev[currentSentence.id],
        isCorrect,
        isChecked: true,
      },
    }));
  }, [currentSentence, currentState.selectedIndices]);

  // Reset current sentence
  const resetCurrent = useCallback(() => {
    if (!currentSentence) return;

    setCardStates((prev) => ({
      ...prev,
      [currentSentence.id]: {
        selectedIndices: [],
        isCorrect: null,
        isChecked: false,
      },
    }));
  }, [currentSentence]);

  // Go to next sentence
  const goToNext = useCallback(() => {
    if (currentIndex < sentences.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, sentences.length]);

  // Get correct sentence string
  const getCorrectSentence = () => {
    if (!currentSentence) return '';
    return currentSentence.correctOrder.map((i) => currentSentence.words[i]).join(' ');
  };

  if (sentences.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No sentences available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[hsl(var(--border))]/50">
        {header}
        {quiz.instruction && (
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{quiz.instruction}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs font-bold text-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 px-2 py-0.5 rounded">
            {currentIndex + 1}/{sentences.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
        {currentSentence && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Translation Hint */}
            {currentSentence.translate && (
              <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
                <p className="text-sm text-[hsl(var(--muted-foreground))] italic">
                  💡 {currentSentence.translate}
                </p>
              </div>
            )}

            {/* Built Sentence Display */}
            <div
              className={`min-h-[80px] p-4 rounded-xl border-2 border-dashed transition-colors ${
                currentState.isChecked
                  ? currentState.isCorrect
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                  : 'border-[hsl(var(--primary))]/50 bg-[hsl(var(--card))]'
              }`}
            >
              {currentState.selectedIndices.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {currentState.selectedIndices.map((wordIndex, idx) => (
                    <span
                      key={idx}
                      onClick={() => !currentState.isChecked && handleWordClick(wordIndex)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        currentState.isChecked
                          ? 'bg-[hsl(var(--muted))]'
                          : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] cursor-pointer hover:opacity-80'
                      }`}
                    >
                      {currentSentence.words[wordIndex]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))] text-center">
                  Tap words below to build the sentence
                </p>
              )}
            </div>

            {/* Correct Answer (shown after check) */}
            {currentState.isChecked && !currentState.isCorrect && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500">
                <p className="text-sm text-green-600 font-medium">Correct answer:</p>
                <p className="text-[hsl(var(--foreground))] font-bold mt-1">
                  {getCorrectSentence()}
                </p>
              </div>
            )}

            {/* Word Blocks */}
            <div className="flex flex-wrap gap-2 justify-center">
              {currentSentence.words.map((word, idx) => {
                const isSelected = currentState.selectedIndices.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleWordClick(idx)}
                    disabled={currentState.isChecked || isSelected}
                    className={`px-4 py-2.5 rounded-xl font-medium text-base transition-all duration-200 ${
                      isSelected
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] opacity-50 cursor-not-allowed'
                        : currentState.isChecked
                          ? 'bg-[hsl(var(--muted))] cursor-not-allowed'
                          : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 active:scale-95 cursor-pointer shadow-sm'
                    }`}
                  >
                    {word}
                  </button>
                );
              })}
            </div>
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

          {!currentState.isChecked &&
            currentState.selectedIndices.length === currentSentence?.words.length && (
              <button
                onClick={checkAnswer}
                className="h-12 px-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg"
              >
                <Check size={20} />
                Check
              </button>
            )}

          {currentState.isChecked && currentIndex < sentences.length - 1 && (
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
    </div>
  );
};
