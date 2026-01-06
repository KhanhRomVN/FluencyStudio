import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, MatchingItem } from '../../types';
import { RichTextParser } from '../RichTextParser';
import { ExplainDrawer } from '../ExplainDrawer';
import { ChevronDown, Info, AlertCircle } from 'lucide-react';

// Extended from Quiz which now includes these fields

interface MatchingDropdownQuiz extends Quiz {
  options?: string[] | { key: string; text: string }[];
}

interface MatchingDropdownProps {
  quiz: MatchingDropdownQuiz;
  isChecked: boolean;
  onCheck: () => void;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
  onExplainRequest?: (isOpen: boolean) => void;
}

// Option interface removed as it was unused or better defined inline if needed

export const MatchingDropdown: React.FC<MatchingDropdownProps> = ({
  quiz,
  isChecked,
  onCheck,
  onUpdate,
  header,
  onExplainRequest,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');

  // Local state for editing
  const [instruction, setInstruction] = useState(quiz.instruction || '');

  useEffect(() => {
    setInstruction(quiz.instruction || '');
  }, [quiz.instruction]);

  // Generate options from the quiz.options array
  const options = useMemo(() => {
    if (!quiz.options || !Array.isArray(quiz.options)) return [];

    // Handle case where options are already objects with keys
    if (quiz.options.length > 0 && typeof quiz.options[0] === 'object') {
      return quiz.options as { key: string; text: string }[];
    }

    // Handle string array case - generate keys (A, B, C...)
    return (quiz.options as string[]).map((text, index) => ({
      key: String.fromCharCode(65 + index),
      text: text,
    }));
  }, [quiz.options]);

  // Derived state: Available options for each row
  // We want to hide options that are already selected in OTHER rows
  // ONLY IF subtype is NOT 'multi-answer'
  const getAvailableOptions = (currentMatchingId: string) => {
    // If subtype is multi-answer, all options are always available
    if (quiz.subtype === 'multi-answer') {
      return options;
    }

    // Default behavior (single-answer): Hide options selected in other rows
    const selectedKeys = Object.entries(selectedAnswers)
      .filter(([id]) => id !== currentMatchingId) // Ignore current row's selection
      .map(([, key]) => key);

    return options.filter((opt) => !selectedKeys.includes(opt.key));
  };

  // Notify parent about explain drawer state
  useEffect(() => {
    onExplainRequest?.(isExplainOpen);
  }, [isExplainOpen, onExplainRequest]);

  const handleSelect = (matchingId: string, value: string) => {
    if (isChecked) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [matchingId]: value,
    }));
  };

  const getCorrectOptionKey = (correctAnswerText: string): string | undefined => {
    // Find the option key (A, B...) where the text matches the answer text
    // Normalize string for comparison (trim, lowercase?)
    // The prompt says: answer: "original, new ideas", option: "B" -> "original, new ideas"
    // So exact or loose match.
    const normalizedTarget = correctAnswerText.trim().toLowerCase();

    // Try exact match first
    const exact = options.find((o) => o.text.trim().toLowerCase() === normalizedTarget);
    if (exact) return exact.key;

    // Try verifying if one contains the other? The prompt examples are exact matches.
    return undefined;
  };

  const areAllAnswered = useMemo(() => {
    const matchings = quiz.matchings || [];
    if (matchings.length === 0) return true;
    return matchings.every((m) => selectedAnswers[m.id]);
  }, [quiz.matchings, selectedAnswers]);

  const renderMatchingRow = (matching: MatchingItem) => {
    const selectedKey = selectedAnswers[matching.id] || '';
    // Correct Text lookup - finding option text that matches matching.answer
    // Note: matching.answer itself *is* the text in this data structure,
    // but let's stick to using matching.answer directly as requested "Display correct answer".
    const correctText = matching.answer;

    // We still calculate correctness
    const correctKey = getCorrectOptionKey(matching.answer);
    const isCorrect = isChecked && selectedKey === correctKey;
    const isWrong = isChecked && !isCorrect;

    const selectedOption = options.find((o) => o.key === selectedKey);
    const selectedText = selectedOption ? selectedOption.text : 'Choose an answer';

    return (
      <div
        key={matching.id}
        className="py-3 border-b border-[hsl(var(--border))] last:border-0 flex flex-col gap-2"
      >
        {/* Question Row */}
        <div className="text-[15px] font-medium text-[hsl(var(--foreground))]">
          <RichTextParser content={matching.question} />
        </div>

        {/* Dropdown Row */}
        <div className="flex items-center gap-3 w-full">
          {/* Dropdown Container */}
          <div className="relative group flex-1">
            {/* Visual Display Layer (The "Fake" Select) */}
            <div
              className={`
                   w-full min-h-[36px] h-auto
                   flex items-center justify-between
                   pl-3 pr-2 py-1.5
                   rounded-md border-2
                   text-sm font-bold
                   bg-[hsl(var(--background))]
                   text-[hsl(var(--foreground))]
                   transition-colors
                   ${
                     isChecked
                       ? isCorrect
                         ? 'border-green-500 text-green-600 bg-green-50/10'
                         : 'border-red-500 text-red-600 bg-red-50/10'
                       : selectedKey
                         ? 'border-[hsl(var(--primary))]'
                         : 'border-[hsl(var(--input))]'
                   }
                `}
            >
              <span className="whitespace-normal break-words leading-tight mr-2 select-none">
                {selectedText}
              </span>

              <ChevronDown
                size={16}
                className={`
                     shrink-0
                     ${isChecked ? (isCorrect ? 'text-green-500' : 'text-red-500') : 'text-[hsl(var(--muted-foreground))]'}
                   `}
              />
            </div>

            {/* Interactive Layer (The Real Hidden Select) */}
            <select
              value={selectedKey}
              onChange={(e) => handleSelect(matching.id, e.target.value)}
              disabled={isChecked}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                Choose an answer
              </option>
              {getAvailableOptions(matching.id).map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.text}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Icons (Check/X) - Flex Sibling */}
          {isChecked && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Info button only for Correct or Undetermined, for Wrong we show it below */}
              {!isWrong && matching.explain && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentExplanation(matching.explain);
                    setIsExplainOpen(true);
                  }}
                  className="text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors"
                  title="Show Explanation"
                >
                  <Info size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Row: Correction Display (Only when wrong) */}
        {isWrong && (
          <div
            className="flex items-center gap-2 mt-1 cursor-pointer group/explain w-fit"
            onClick={() => {
              if (matching.explain) {
                setCurrentExplanation(matching.explain);
                setIsExplainOpen(true);
              }
            }}
          >
            <AlertCircle size={16} className="text-red-500 shrink-0" strokeWidth={2.5} />
            <span className="text-[13px] font-bold text-red-500/90 hover:underline decoration-red-500/50 underline-offset-2">
              {correctText}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
        {header}

        {/* Instruction */}
        {instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-base">
            <RichTextParser
              content={instruction}
              sectionId="instruction"
              onChange={(newContent) => {
                setInstruction(newContent);
                onUpdate?.({ ...quiz, instruction: newContent });
              }}
            />
          </div>
        )}

        {/* Matchings List */}
        <div className="space-y-1">{quiz.matchings?.map(renderMatchingRow)}</div>
      </div>

      {/* Check Button */}
      {areAllAnswered && !isChecked && (
        <div className="p-4 bg-[hsl(var(--background))] border-t border-[hsl(var(--border))]">
          <button
            onClick={onCheck}
            className="w-full py-3 bg-[hsl(var(--primary))] text-primary-foreground rounded-lg font-bold text-base hover:bg-[hsl(var(--primary))]/90 active:scale-[0.99] transition-all shadow-sm"
          >
            Check answers
          </button>
        </div>
      )}

      <ExplainDrawer
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        explanation={currentExplanation}
      />
    </div>
  );
};
