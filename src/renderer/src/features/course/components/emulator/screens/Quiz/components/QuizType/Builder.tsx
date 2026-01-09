import React, { useState, useEffect, useCallback } from 'react';
import { Check, RotateCcw, ChevronRight, BookOpen } from 'lucide-react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';
import { ExplainDrawer } from '../ExplainDrawer';

interface BuilderProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
  onExplainRequest?: (show: boolean) => void;
}

interface CardState {
  selectedIndices: number[];
  isCorrect: boolean | null;
  isChecked: boolean;
}

export const Builder: React.FC<BuilderProps> = ({ quiz, onExplainRequest }) => {
  // Support both new 'builders' and old 'sentences' fields for compatibility
  const items = quiz.builders || quiz.sentences || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [isExplainOpen, setIsExplainOpen] = useState(false);

  // Initialize card states
  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    items.forEach((item) => {
      initialStates[item.id] = {
        selectedIndices: [],
        isCorrect: null,
        isChecked: false,
      };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id]);

  // Sync explain drawer state with parent (to hide audio player etc if needed)
  useEffect(() => {
    onExplainRequest?.(isExplainOpen);
  }, [isExplainOpen, onExplainRequest]);

  const currentItem = items[currentIndex];
  // Backward compatibility fallback
  const itemBlocks = currentItem?.items || (currentItem as any)?.words || [];
  const itemHint = currentItem?.hint || (currentItem as any)?.translate;

  const currentState = cardStates[currentItem?.id] || {
    selectedIndices: [],
    isCorrect: null,
    isChecked: false,
  };

  // Handle item selection
  const handleItemClick = useCallback(
    (itemIndex: number) => {
      if (!currentItem || currentState.isChecked) return;

      setCardStates((prev) => {
        const current = prev[currentItem.id];
        const selected = current.selectedIndices;

        // If already selected, allow removing (last one only)
        if (selected.includes(itemIndex)) {
          if (selected[selected.length - 1] === itemIndex) {
            return {
              ...prev,
              [currentItem.id]: {
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
          [currentItem.id]: {
            ...current,
            selectedIndices: [...selected, itemIndex],
          },
        };
      });
    },
    [currentItem, currentState.isChecked],
  );

  // Check answer
  const checkAnswer = useCallback(() => {
    if (!currentItem) return;

    const isCorrect =
      JSON.stringify(currentState.selectedIndices) === JSON.stringify(currentItem.correctOrder);

    setCardStates((prev) => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        isCorrect,
        isChecked: true,
      },
    }));
  }, [currentItem, currentState.selectedIndices]);

  // Reset current item
  const resetCurrent = useCallback(() => {
    if (!currentItem) return;

    setCardStates((prev) => ({
      ...prev,
      [currentItem.id]: {
        selectedIndices: [],
        isCorrect: null,
        isChecked: false,
      },
    }));
  }, [currentItem]);

  // Go to next item
  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, items.length]);

  // Get correct sentence string
  const getCorrectString = () => {
    if (!currentItem || !currentItem.correctOrder) return '';
    return currentItem.correctOrder.map((i) => itemBlocks[i]).join(' ');
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No builder items available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden">
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        {currentItem && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Context Hint */}
            {itemHint && (
              <div className="p-4 rounded-xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))]">
                <p className="text-sm text-[hsl(var(--muted-foreground))] italic">💡 {itemHint}</p>
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
                  {currentState.selectedIndices.map((itemIndex, idx) => (
                    <span
                      key={idx}
                      onClick={() => !currentState.isChecked && handleItemClick(itemIndex)}
                      className={`px-3 py-2 rounded-lg font-medium transition-all ${
                        currentState.isChecked
                          ? 'bg-[hsl(var(--muted))]'
                          : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] cursor-pointer hover:opacity-80'
                      }`}
                    >
                      {currentItem.items?.[itemIndex]}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[hsl(var(--muted-foreground))] text-center">
                  Tap blocks below to build
                </p>
              )}
            </div>

            {/* Correct Answer (shown after check) */}
            {currentState.isChecked && !currentState.isCorrect && (
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500">
                <p className="text-sm text-green-600 font-medium">Correct answer:</p>
                <p className="text-[hsl(var(--foreground))] font-bold mt-1">{getCorrectString()}</p>
              </div>
            )}

            {/* Explanation Button (if incorrect or explicitly requested) */}
            {currentState.isChecked && currentItem.explain && (
              <div className="flex justify-end">
                <button
                  onClick={() => setIsExplainOpen(true)}
                  className="text-sm text-[hsl(var(--primary))] font-medium flex items-center gap-1 hover:underline"
                >
                  <BookOpen size={16} />
                  Explain Answer
                </button>
              </div>
            )}

            {/* Items Blocks */}
            <div className="flex flex-wrap gap-2 justify-center">
              {(currentItem.items || []).map((item, idx) => {
                const isSelected = currentState.selectedIndices.includes(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => handleItemClick(idx)}
                    disabled={currentState.isChecked || isSelected}
                    className={`px-4 py-2.5 rounded-xl font-medium text-base transition-all duration-200 ${
                      isSelected
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] opacity-50 cursor-not-allowed'
                        : currentState.isChecked
                          ? 'bg-[hsl(var(--muted))] cursor-not-allowed'
                          : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10 active:scale-95 cursor-pointer shadow-sm'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[hsl(var(--border))]/50">
        <div className="flex flex-col gap-3">
          {!currentState.isCorrect && (
            <button
              onClick={resetCurrent}
              className="w-full h-10 rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
              <RotateCcw size={18} />
              Reset
            </button>
          )}

          {!currentState.isChecked &&
            currentState.selectedIndices.length === (currentItem?.items?.length || 0) && (
              <button
                onClick={checkAnswer}
                className="w-full h-10 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md"
              >
                <Check size={20} />
                Check
              </button>
            )}

          {currentState.isChecked && currentIndex < items.length - 1 && (
            <button
              onClick={goToNext}
              className="w-full h-10 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md"
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
        explanation={currentItem?.explain || ''}
      />
    </div>
  );
};
