import React, { useState, useEffect, useMemo } from 'react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';
import { ExplainDrawer } from '../ExplainDrawer';
import { ChevronDown, Check, X, Info } from 'lucide-react';

// Extend Quiz type to include matchings and quizNumber as per user JSON
interface MatchingItem {
  id: string;
  question: string;
  answer: string;
  explain: string;
}

interface MatchingDropdownQuiz extends Quiz {
  matchings?: MatchingItem[];
  quizNumber?: number;
}

interface MatchingDropdownProps {
  quiz: MatchingDropdownQuiz;
  isChecked: boolean;
  onCheck: () => void;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
  onExplainRequest?: (isOpen: boolean) => void;
}

interface Option {
  key: string;
  text: string;
}

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
  const [questionContent, setQuestionContent] = useState(quiz.question || '');

  // Parse options from the question content (The Box)
  const options = useMemo(() => {
    const opts: Option[] = [];
    if (!questionContent) return opts;

    // Pattern to match: <p><span style='bold'>A</span> experience on stage</p>
    // Adjust regex to be flexible with attributes and whitespace
    // Capture group 1: Letter, Capture group 2: Text content
    const regex = /<span[^>]*>\s*([A-Z])\s*<\/span>\s*(.*?)(?=<\/p>)/gi;

    let match;
    // We iterate over the string finding matches
    // Note: This simple regex assumes the structure provided in the JSON.
    // If the HTML structure is complex (nested divs), DOM parsing might be better
    // but regex is often sufficient for this predictable format.
    const tempContent = questionContent.replace(/[\n\r]/g, ''); // Remove newlines for easier regex

    while ((match = regex.exec(tempContent)) !== null) {
      if (match[1] && match[2]) {
        opts.push({
          key: match[1].trim(),
          text: match[2].trim(),
        });
      }
    }

    // Sort options alphabetically by key just in case
    return opts.sort((a, b) => a.key.localeCompare(b.key));
  }, [questionContent]);

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
    const correctKey = getCorrectOptionKey(matching.answer);
    const isCorrect = isChecked && selectedKey === correctKey;
    const isWrong = isChecked && !isCorrect;

    return (
      <div
        key={matching.id}
        className="flex items-center justify-between py-3 border-b border-[hsl(var(--border))] last:border-0"
      >
        <div className="text-[15px] font-medium text-[hsl(var(--foreground))] flex-1 mr-4">
          <RichTextParser content={matching.question} />
        </div>

        <div className="flex items-center gap-2">
          {/* Dropdown */}
          <div className="relative">
            <select
              value={selectedKey}
              onChange={(e) => handleSelect(matching.id, e.target.value)}
              disabled={isChecked}
              className={`
                 max-w-[400px] // Limit width to prevent overflow
                 appearance-none
                 pl-4 pr-10 py-2
                 rounded-md
                 border-2
                 font-bold
                 bg-[hsl(var(--background))]
                 text-[hsl(var(--foreground))]
                 cursor-pointer
                 focus:outline-none focus:border-[hsl(var(--primary))]
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
              style={{ minWidth: '80px' }} // Standard width for letter
            >
              <option value="" disabled>
                -
              </option>
              {options.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.key}
                </option>
              ))}
            </select>

            <ChevronDown
              size={16}
              className={`
                 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
                 ${isChecked ? (isCorrect ? 'text-green-500' : 'text-red-500') : 'text-[hsl(var(--muted-foreground))]'}
               `}
            />
          </div>

          {/* Feedback & Explain */}
          {isChecked && (
            <div className="flex items-center gap-2 ml-2">
              {isCorrect ? (
                <Check size={20} className="text-green-500" strokeWidth={3} />
              ) : (
                <div className="flex items-center gap-2">
                  {correctKey && (
                    <span className="text-green-600 font-bold text-lg bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded">
                      {correctKey}
                    </span>
                  )}
                  <X size={20} className="text-red-500" strokeWidth={3} />
                </div>
              )}

              {matching.explain && (
                <button
                  onClick={() => {
                    setCurrentExplanation(matching.explain);
                    setIsExplainOpen(true);
                  }}
                  className="ml-2 text-[hsl(var(--primary))] hover:text-[hsl(var(--primary))]/80 transition-colors"
                  title="Show Explanation"
                >
                  <Info size={20} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}
        </div>
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
