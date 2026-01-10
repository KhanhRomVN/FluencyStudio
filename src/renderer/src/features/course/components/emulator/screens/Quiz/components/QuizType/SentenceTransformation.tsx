import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronRight, Info, Lightbulb } from 'lucide-react';
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
  gapInputs?: Record<string, string>;
}

export const SentenceTransformation: React.FC<SentenceTransformationProps> = ({ quiz }) => {
  const questions = quiz.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');

  // Initialize card states
  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    questions.forEach((item) => {
      initialStates[item.id] = {
        userAnswer: '',
        isCorrect: null,
        isChecked: false,
      };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id]);

  const currentItem = questions[currentIndex];
  const currentState = cardStates[currentItem?.id] || {
    userAnswer: '',
    isCorrect: null,
    isChecked: false,
  };

  // Helper to ensure gaps have IDs (for parser compatibility)
  const processQuestionText = useCallback((text: string) => {
    if (!text) return '';
    let gapCount = 0;
    // Matches </gap> or <gap> that does NOT have an 'id=' attribute
    // Replaces them with </gap id='gap-N'> to satisfy RichTextParser
    return text.replace(/<\/?gap(?![^>]*\bid=['"])[^>]*>/gi, () => {
      gapCount++;
      return `</gap id='gap-${gapCount}'>`;
    });
  }, []);

  const processedQuestion = React.useMemo(() => {
    return processQuestionText(currentItem?.question || '');
  }, [currentItem, processQuestionText]);

  // Handle input change for a specific gap in a specific question
  const handleInputChange = useCallback(
    (questionId: string, gapId: string, value: string) => {
      if (cardStates[questionId]?.isChecked) return;

      setCardStates((prev) => {
        const questionState = prev[questionId] || {
          userAnswer: '', // Unused in this mode
          isCorrect: null,
          isChecked: false,
          gapInputs: {},
        };

        return {
          ...prev,
          [questionId]: {
            ...questionState,
            gapInputs: {
              ...questionState.gapInputs,
              [gapId]: value,
            },
          },
        };
      });
    },
    [cardStates],
  );

  // Check answer for current question
  const checkAnswer = useCallback(() => {
    if (!currentItem || !currentItem.answer) return;
    let rawQuestion = processQuestionText(currentItem.question || '');

    const stripHtml = (html: string) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      return doc.body.textContent || '';
    };

    const inputs = currentState.gapInputs || {};

    let filledQuestion = rawQuestion.replace(/<\/gap\s+id=['"]([^'"]+)['"]\s*>/gi, (_match, id) => {
      return inputs[id] || '';
    });

    const userSentence = stripHtml(filledQuestion).replace(/\s+/g, ' ').trim();

    // 3. Compare with answer(s)
    let isCorrect = false;
    if (Array.isArray(currentItem.answer)) {
      isCorrect = currentItem.answer.some(
        (ans) =>
          stripHtml(ans).replace(/\s+/g, ' ').toLowerCase().trim() === userSentence.toLowerCase(),
      );
    } else {
      isCorrect =
        stripHtml(currentItem.answer).replace(/\s+/g, ' ').toLowerCase().trim() ===
        userSentence.toLowerCase();
    }

    setCardStates((prev) => ({
      ...prev,
      [currentItem.id]: {
        ...prev[currentItem.id],
        isCorrect,
        isChecked: true,
      },
    }));
  }, [currentItem, currentState.gapInputs]);

  // Reset current
  const resetCurrent = useCallback(() => {
    if (!currentItem) return;

    setCardStates((prev) => ({
      ...prev,
      [currentItem.id]: {
        userAnswer: '',
        isCorrect: null,
        isChecked: false,
        gapInputs: {},
      },
    }));
  }, [currentItem]);

  // Go to next
  const goToNext = useCallback(() => {
    if (questions.length > 0 && currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, questions.length]);

  if (questions.length === 0) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-[hsl(var(--muted-foreground))]">
        <p>No questions available.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden">
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
            {/* Requirement */}
            {currentItem.require && (
              <div className="flex flex-row gap-3">
                <div className="text-[16px] text-[hsl(var(--muted-foreground))]">
                  <RichTextParser content={currentItem.require} />
                </div>
              </div>
            )}

            {/* Original Sentence */}
            <div className="p-4 rounded-xl border border-[hsl(var(--border))]">
              <div className="text-[16px] text-[hsl(var(--foreground))] leading-relaxed">
                <RichTextParser content={currentItem.original || ''} />
              </div>
            </div>

            {/* Input Area (Gap Style) */}
            <div className="space-y-2">
              <div className="text-[16px] leading-relaxed text-[hsl(var(--foreground))]">
                <RichTextParser
                  content={processedQuestion}
                  onGapFound={(gapId) => {
                    const inputs = currentState.gapInputs || {};
                    const val = inputs[gapId] || '';
                    const isChecked = currentState.isChecked;
                    // Auto-width calculation relative to content
                    const widthCh = Math.max(4, val.length + 1);

                    return (
                      <span className="inline-block mx-1 align-baseline">
                        <input
                          type="text"
                          value={val}
                          disabled={isChecked}
                          onChange={(e) => handleInputChange(currentItem.id, gapId, e.target.value)}
                          className={`
                               min-w-[60px]
                               border-b-2 
                               bg-transparent 
                               outline-none 
                               text-center 
                               font-bold 
                               text-[hsl(var(--foreground))]
                               text-[16px]
                               transition-all
                               p-0
                               leading-none
                               ${
                                 isChecked
                                   ? currentState.isCorrect
                                     ? 'border-green-500 text-green-600'
                                     : 'border-red-500 text-red-500' // Always red if wrong overall, unless we do per-gap
                                   : 'border-[hsl(var(--primary))]/50 focus:border-[hsl(var(--primary))]'
                               }
                             `}
                          style={{ width: `${widthCh}ch` }}
                        />
                      </span>
                    );
                  }}
                />
              </div>
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
                    <p className="text-sm text-green-600 font-medium mb-2">Correct answer:</p>
                    <div className="space-y-1">
                      {Array.isArray(currentItem.answer) ? (
                        currentItem.answer.map((ans, i) => (
                          <div
                            key={i}
                            className="flex gap-2 items-start text-[hsl(var(--foreground))]"
                          >
                            <span className="font-bold text-green-600 bg-green-200/50 w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            <span className="font-medium">{ans}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[hsl(var(--foreground))] font-bold">
                          {currentItem.answer}
                        </p>
                      )}
                    </div>
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
      <div className="p-4 border-t border-[hsl(var(--border))]/50">
        <div className="flex flex-col gap-3">
          {!currentState.isChecked && (
            <button
              onClick={checkAnswer}
              className="w-full h-10 rounded-md bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-md"
            >
              <Check size={20} />
              Check
            </button>
          )}

          {currentState.isChecked && currentIndex < questions.length - 1 && (
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
        explanation={currentExplanation}
      />
    </div>
  );
};
