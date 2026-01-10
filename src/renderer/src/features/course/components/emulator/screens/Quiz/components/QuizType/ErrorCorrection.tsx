import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, ErrorCorrectionItem } from '../../types';
import { Check, ChevronRight, HelpCircle } from 'lucide-react';
import { RichTextParser } from '../RichTextParser';
import { ExplainDrawer } from '../ExplainDrawer';

interface ErrorCorrectionProps {
  quiz: Quiz;
  isChecked?: boolean;
  onCheck?: () => void;
}

interface Token {
  id: string;
  text: string;
  isError: boolean;
  errorId?: string;
  index: number;
}

interface CardState {
  solvedErrorIds: string[];
  attempts: number;
  selectedTokenIndex: number | null;
  inputValue: string;
  drafts: Record<number, string>;
  feedback: 'none' | 'correct' | 'incorrect';
  failedMessage?: string;
}

export const ErrorCorrection: React.FC<ErrorCorrectionProps> = ({ quiz }) => {
  const items = quiz.errorCorrections || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardStates, setCardStates] = useState<Record<string, CardState>>({});

  // Lifted state for explanation drawer
  const [activeExplainContent, setActiveExplainContent] = useState<string | null>(null);

  useEffect(() => {
    const initialStates: Record<string, CardState> = {};
    items.forEach((item) => {
      initialStates[item.id] = {
        solvedErrorIds: [],
        attempts: 0,
        selectedTokenIndex: null,
        inputValue: '',
        drafts: {},
        feedback: 'none',
      };
    });
    setCardStates(initialStates);
    setCurrentIndex(0);
  }, [quiz.id, items]);

  const parseTokens = useMemo(() => {
    return (item: ErrorCorrectionItem): Token[] => {
      const tokens: Token[] = [];
      const regex = /<error\s+id=['"]([^'"]+)['"]>(.*?)<\/error>/g;
      let lastIndex = 0;
      let match;
      let tokenCounter = 0;

      const addTextTokens = (text: string, isError: boolean, errorId?: string) => {
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        words.forEach((word) => {
          tokens.push({
            id: `token-${tokenCounter++}`,
            text: word,
            isError,
            errorId,
            index: tokenCounter,
          });
        });
      };

      while ((match = regex.exec(item.question)) !== null) {
        const textBefore = item.question.substring(lastIndex, match.index);
        addTextTokens(textBefore, false);
        const errorId = match[1];
        const errorContent = match[2];
        addTextTokens(errorContent, true, errorId);
        lastIndex = regex.lastIndex;
      }
      const textAfter = item.question.substring(lastIndex);
      addTextTokens(textAfter, false);
      return tokens;
    };
  }, []);

  const handleTokenClick = (item: ErrorCorrectionItem, token: Token) => {
    const currentState = cardStates[item.id];
    if (currentState.attempts > 0) return;

    if (token.errorId && currentState.solvedErrorIds.includes(token.errorId)) return;

    const savedDraft = currentState.drafts?.[token.index] || '';

    setCardStates((prev) => ({
      ...prev,
      [item.id]: {
        ...prev[item.id],
        selectedTokenIndex: token.index,
        inputValue: savedDraft,
        feedback: 'none',
      },
    }));
  };

  const handleInputChange = (item: ErrorCorrectionItem, value: string) => {
    setCardStates((prev) => {
      const currentState = prev[item.id];
      if (currentState.selectedTokenIndex === null) return prev;
      const currentDrafts = currentState.drafts || {};
      return {
        ...prev,
        [item.id]: {
          ...prev[item.id],
          inputValue: value,
          drafts: { ...currentDrafts, [currentState.selectedTokenIndex]: value },
          feedback: 'none',
        },
      };
    });
  };

  const submitCorrection = (item: ErrorCorrectionItem) => {
    const state = cardStates[item.id];
    if (state.selectedTokenIndex === null) return;
    if (state.attempts > 0) return;

    const tokens = parseTokens(item);
    const selectedToken = tokens.find((t) => t.index === state.selectedTokenIndex);
    if (!selectedToken) return;

    const userVal = state.inputValue.trim().toLowerCase();

    // Attempt Logic: One shot.

    // 1. Check if token is actually an error
    if (!selectedToken.isError || !selectedToken.errorId) {
      setCardStates((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          feedback: 'incorrect',
          attempts: 1,
          failedMessage: "Incorrect selection. The error wasn't here.",
        },
      }));
      return;
    }

    // 2. Check if correction is right
    const errorDef = item.errors.find((e) => e.id === selectedToken.errorId);
    if (errorDef && errorDef.correct.map((s) => s.toLowerCase()).includes(userVal)) {
      // Success
      setCardStates((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          solvedErrorIds: [...prev[item.id].solvedErrorIds, selectedToken.errorId!],
          feedback: 'correct',
          attempts: 1,
          selectedTokenIndex: null,
          inputValue: '',
        },
      }));
    } else {
      // Failure: Wrong correction
      const correctAns = errorDef?.correct[0] || 'unknown';
      setCardStates((prev) => ({
        ...prev,
        [item.id]: {
          ...prev[item.id],
          feedback: 'incorrect',
          attempts: 1,
          failedMessage: `Right spot, but wrong fix. Expected: "${correctAns}"`,
        },
      }));
    }
  };

  const goToNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const renderCard = (item: ErrorCorrectionItem, index: number) => {
    const state = cardStates[item.id] || {
      solvedErrorIds: [],
      attempts: 0,
      selectedTokenIndex: null,
      inputValue: '',
      drafts: {},
      feedback: 'none',
    };
    const isCurrent = index === currentIndex;
    const isFuture = index > currentIndex;
    const isCompleted = state.attempts > 0;
    const isSuccess = state.feedback === 'correct';

    const tokens = parseTokens(item);
    const selectedTokenObj = tokens.find((t) => t.index === state.selectedTokenIndex);
    const selectedGroupErrorId = selectedTokenObj?.errorId;

    if (isFuture) return null;

    return (
      <div
        key={item.id}
        className={`
            relative rounded-2xl border transition-all duration-500 ease-out flex flex-col
            ${isCurrent ? 'bg-[hsl(var(--card))] border-[hsl(var(--primary))]/50 shadow-lg' : 'bg-[hsl(var(--muted))]/50 opacity-75 pointer-events-none'}
            ${isCurrent ? 'animate-in slide-in-from-bottom-8 fade-in' : ''}
        `}
      >
        <div className="flex items-center justify-between p-3 border-b border-[hsl(var(--border))]/50">
          <div className="flex items-center gap-2">
            {isSuccess && !isCurrent && (
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check size={12} className="text-white" />
              </div>
            )}
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {index + 1}/{items.length}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 space-y-6">
          <div className="flex flex-wrap gap-x-2 gap-y-3 justify-start text-lg leading-relaxed items-center">
            {tokens.map((token) => {
              const isSolved = token.errorId && state.solvedErrorIds.includes(token.errorId);

              const isDirectlySelected = state.selectedTokenIndex === token.index;
              const isGroupHighlight =
                selectedGroupErrorId && token.errorId === selectedGroupErrorId;
              const isSelected = isDirectlySelected || isGroupHighlight;

              let displayContent = token.text;
              let statusClass = 'hover:bg-[hsl(var(--muted))]';

              if (isSolved) {
                const errorDef = item.errors.find((e) => e.id === token.errorId);
                const firstTokenOfError = tokens.find((t) => t.errorId === token.errorId);
                const isFirst = firstTokenOfError?.index === token.index;

                if (isFirst && errorDef) {
                  // SHOW ORIGINAL STRIKETHROUGH -> CORRECT
                  const errorTokens = tokens.filter((t) => t.errorId === token.errorId);
                  const originalText = errorTokens.map((t) => t.text).join(' ');

                  return (
                    <div
                      key={token.index}
                      className="inline-flex items-center gap-1.5 mx-1 p-1 rounded bg-green-50 border border-green-200"
                    >
                      <span className="text-red-400 line-through decoration-red-400 decoration-2 opacity-80 text-base">
                        {originalText}
                      </span>
                      <ChevronRight size={14} className="text-green-600" />
                      <span className="text-green-700 font-bold">{errorDef.correct[0]}</span>
                    </div>
                  );
                } else {
                  // Hide subsequent tokens of solved error
                  return null;
                }
              } else if (isCompleted && token.isError && !isSolved) {
                // REVEAL MISSED ERROR (Amber/Orange)
                const errorDef = item.errors.find((e) => e.id === token.errorId);
                const firstTokenOfError = tokens.find((t) => t.errorId === token.errorId);
                const isFirst = firstTokenOfError?.index === token.index;

                if (isFirst && errorDef) {
                  // SHOW ORIGINAL STRIKETHROUGH -> CORRECT (Amber)
                  const errorTokens = tokens.filter((t) => t.errorId === token.errorId);
                  const originalText = errorTokens.map((t) => t.text).join(' ');

                  return (
                    <div
                      key={token.index}
                      className="inline-flex items-center gap-1.5 mx-1 p-1 rounded bg-amber-50 border border-amber-200"
                    >
                      <span className="text-red-400 line-through decoration-red-400 decoration-2 opacity-80 text-base">
                        {originalText}
                      </span>
                      <ChevronRight size={14} className="text-amber-600" />
                      <span className="text-amber-700 font-bold">{errorDef.correct[0]}</span>
                    </div>
                  );
                } else {
                  return null;
                }
              } else if (isSelected) {
                statusClass =
                  'bg-[hsl(var(--muted))]/30 border-2 border-dashed border-[hsl(var(--muted-foreground))] text-[hsl(var(--foreground))] font-medium scale-105';
                if (state.feedback === 'incorrect' && isDirectlySelected) {
                  statusClass = 'bg-red-50 border-red-400 text-red-600 border-2 border-dashed';
                }
              } else if (isCompleted) {
                statusClass = 'opacity-50'; // Fade out unrelated text more
              }

              const draftValue = isDirectlySelected
                ? state.inputValue
                : state.drafts?.[token.index] || '';

              // Wrap token + potential draft arrow
              return (
                <div key={token.index} className="inline-flex items-center gap-1">
                  <span
                    onClick={() => !isCompleted && handleTokenClick(item, token)}
                    className={`
                                    px-2 py-0.5 rounded-lg cursor-pointer transition-all duration-200 select-none
                                    ${statusClass}
                               `}
                  >
                    {displayContent}
                  </span>

                  {draftValue && !isSolved && (
                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                      <ChevronRight size={14} className="text-[hsl(var(--muted-foreground))]" />
                      <span className="px-2 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] shadow-sm text-base">
                        {draftValue}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {state.selectedTokenIndex !== null && !isCompleted && (
            <div className="animate-in fade-in slide-in-from-bottom-2">
              <input
                autoFocus
                type="text"
                value={state.inputValue}
                onChange={(e) => handleInputChange(item, e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitCorrection(item)}
                placeholder="Type correction..."
                className="w-full h-10 px-3 rounded-lg border-2 border-dashed bg-transparent outline-none transition-all border-[hsl(var(--input))] focus:border-[hsl(var(--primary))]"
              />
            </div>
          )}

          {isCompleted && (
            <div className="animate-in zoom-in spin-in-1 duration-300 space-y-3">
              {/* Feedback Message */}
              {state.feedback === 'correct' ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium flex items-center gap-2">
                  <Check size={18} />
                  Excellent! Correct answer.
                </div>
              ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                  {state.failedMessage || 'Incorrect.'}
                </div>
              )}

              {/* Explanation Link */}
              {item.explain && (
                <div className="flex justify-start">
                  <button
                    onClick={() => setActiveExplainContent(item.explain || '')}
                    className="text-sm font-medium text-[hsl(var(--primary))] flex items-center gap-1 hover:underline"
                  >
                    <HelpCircle size={14} />
                    View Explanation
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isCurrent && (
          <div className="p-4 border-t border-[hsl(var(--border))]/50 mt-auto">
            {!isCompleted ? (
              <button
                onClick={() => submitCorrection(item)}
                disabled={state.selectedTokenIndex === null}
                className={`
                            w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm
                            ${
                              state.selectedTokenIndex === null
                                ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed opacity-50'
                                : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 active:scale-[0.98]'
                            }
                        `}
              >
                Check Answer
              </button>
            ) : currentIndex < items.length - 1 ? (
              <button
                onClick={goToNext}
                className="w-full h-11 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-sm animate-in slide-in-from-bottom-4"
              >
                Next
                <ChevronRight size={18} />
              </button>
            ) : (
              <div className="text-center text-[hsl(var(--muted-foreground))] font-medium py-2">
                Quiz Completed!
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden">
      {quiz.instruction && (
        <div className="p-3 text-center text-[hsl(var(--foreground))] opacity-80 border-b border-[hsl(var(--border))]/30 bg-[hsl(var(--background))] z-10 shadow-sm flex-shrink-0">
          <RichTextParser content={quiz.instruction} />
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-3xl mx-auto w-full [&::-webkit-scrollbar]:hidden flex flex-col justify-center">
        {items.slice(0, currentIndex + 1).map((item, index) => renderCard(item, index))}
        <div className="h-4 flex-shrink-0" />
      </div>

      {/* Root-Level Drawer */}
      <ExplainDrawer
        isOpen={!!activeExplainContent}
        onClose={() => setActiveExplainContent(null)}
        explanation={activeExplainContent || ''}
      />
    </div>
  );
};
