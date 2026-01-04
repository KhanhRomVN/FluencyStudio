import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion } from '../../types';
import { Check, Info } from 'lucide-react';
import { ExplainDrawer } from '../ExplainDrawer';
import { RichTextParser } from '../RichTextParser';

interface MultipleChoiceProps {
  quiz: Quiz;
  isChecked: boolean;
  onCheck: () => void;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
  onExplainRequest?: (isOpen: boolean) => void;
}

export const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  quiz,
  isChecked,
  onCheck,
  onUpdate,
  header,
  onExplainRequest,
}) => {
  // State now stores array of strings for each question ID
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string[] }>({});
  const [areAllAnswered, setAreAllAnswered] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');

  // Local state for editing in emulator
  const [instruction, setInstruction] = useState(quiz.instruction || '');

  // Notify parent about explain drawer state
  useEffect(() => {
    onExplainRequest?.(isExplainOpen);
  }, [isExplainOpen, onExplainRequest]);

  // Note: If quiz prop updates from outside, we might want to sync local state,
  // but for now we assume emulator is the driver of change or reset happens on remount.

  // Handle nested questions or single question
  const questions = quiz.questions && quiz.questions.length > 0 ? quiz.questions : [];

  const handleOptionSelect = (questionId: string, optionKey: string) => {
    if (isChecked) return;

    const question = questions.find((q) => q.id === questionId);
    // Determine if question allows multiple answers
    const isMultiSelect = question?.answers && question.answers.length > 0;

    setSelectedAnswers((prev) => {
      const currentSelection = prev[questionId] || [];
      let newSelection: string[];

      if (isMultiSelect) {
        // Toggle selection
        if (currentSelection.includes(optionKey)) {
          newSelection = currentSelection.filter((k) => k !== optionKey);
        } else {
          newSelection = [...currentSelection, optionKey];
        }
      } else {
        // Single select - replace
        newSelection = [optionKey];
      }

      const next = { ...prev, [questionId]: newSelection };

      // Check if all questions have enough answers selected
      const allAnswered = questions.every((q) => {
        const requiredCount = q.answers && q.answers.length > 0 ? q.answers.length : 1;
        const currentCount = next[q.id] ? next[q.id].length : 0;
        return currentCount >= requiredCount;
      });
      setAreAllAnswered(allAnswered);

      return next;
    });
  };

  const renderQuestion = (question: QuizQuestion) => {
    const userSelections = selectedAnswers[question.id] || [];

    // Normalize correct answers to a Set for easy lookup
    const correctAnswers = new Set<string>();
    if (question.answers && question.answers.length > 0) {
      question.answers.forEach((a) => correctAnswers.add(a));
    } else if (question.answer) {
      correctAnswers.add(question.answer);
    }

    const isQuestionCorrect =
      userSelections.length === correctAnswers.size &&
      userSelections.every((sel) => correctAnswers.has(sel));

    return (
      <div key={question.id} className="mb-8">
        <h3 className="font-bold text-lg text-[hsl(var(--foreground))] mb-3">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = userSelections.includes(option.key);
            const isAnswerCorrect = correctAnswers.has(option.key);

            let containerClass = 'border-[hsl(var(--border))] bg-transparent';
            let textColor = 'text-[hsl(var(--foreground))]';
            let circleBorder = 'border-[hsl(var(--border))]';
            let circleBg = 'bg-transparent';
            let circleContent = (
              <span className="text-xs font-bold text-[hsl(var(--muted-foreground))]">
                {option.key}
              </span>
            );

            if (isChecked) {
              if (isAnswerCorrect) {
                // Correct answer (whether selected or not, show it's correct)
                containerClass = 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10';
                textColor = 'text-[hsl(var(--primary))]';
                circleBorder = 'border-[hsl(var(--primary))]';
                circleBg = 'bg-[hsl(var(--primary))]';
                circleContent = <Check size={14} className="text-white" strokeWidth={3} />;
              } else if (isSelected && !isAnswerCorrect) {
                // User selected wrong answer
                containerClass = 'border-red-500 bg-red-500/10';
                textColor = 'text-red-500';
                circleBorder = 'border-[hsl(var(--primary))]'; // Keep primary circle to show "You chose this"
                circleBg = 'bg-[hsl(var(--primary))]';
                circleContent = <Check size={14} className="text-white" strokeWidth={3} />;
              }
            } else {
              if (isSelected) {
                containerClass = 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10';
                textColor = 'text-[hsl(var(--primary))]';
                circleBorder = 'border-[hsl(var(--primary))]';
                circleBg = 'bg-[hsl(var(--primary))]';
                circleContent = <Check size={14} className="text-white" strokeWidth={3} />;
              }
            }

            return (
              <div
                key={option.key}
                onClick={() => handleOptionSelect(question.id, option.key)}
                className={`
                    flex items-center p-3 rounded-lg border transition-all duration-200
                    ${containerClass}
                    ${!isChecked ? 'cursor-pointer hover:bg-[hsl(var(--muted))] active:scale-[0.99]' : ''}
                 `}
              >
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 transition-colors
                    ${circleBorder} ${circleBg}
                  `}
                >
                  {circleContent}
                </div>
                <span className={`text-[15px] font-medium ${textColor}`}>{option.text}</span>
              </div>
            );
          })}
        </div>

        {isChecked && question.explain && (
          <div
            className="mt-2 flex items-center text-[hsl(var(--primary))] text-sm font-bold underline cursor-pointer"
            onClick={() => {
              setCurrentExplanation(question.explain || '');
              setIsExplainOpen(true);
            }}
          >
            <Info size={16} className="mr-1" />
            Explain
          </div>
        )}
      </div>
    );
  };

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-[hsl(var(--muted-foreground))]">
        No questions available.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
        {header}
        {instruction && (
          <div className="mb-6 text-[hsl(var(--foreground))]">
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
        {questions.map(renderQuestion)}
      </div>

      {areAllAnswered && !isChecked && (
        <div className="p-4 bg-[hsl(var(--background))]">
          <button
            onClick={onCheck}
            className="w-full py-2 bg-[hsl(var(--primary))] text-white rounded-md font-bold text-base active:scale-[0.98] transition-all"
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
