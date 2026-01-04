import React, { useState, useEffect } from 'react';
import { Quiz, QuizQuestion } from '../../types';
import { Check, Info } from 'lucide-react';
import { ExplainDrawer } from '../ExplainDrawer';
import { RichTextParser } from '../RichTextParser';

interface MultipleChoiceProps {
  quiz: Quiz;
  isChecked: boolean;
  onCheck: () => void;
  header?: React.ReactNode;
}

export const MultipleChoice: React.FC<MultipleChoiceProps> = ({
  quiz,
  isChecked,
  onCheck,
  header,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [areAllAnswered, setAreAllAnswered] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');

  // Handle nested questions or single question
  // If quiz.questions exists (nested), use it. Otherwise assume the Quiz object itself is a question (flat legacy? or simple).
  // The Dart code uses `widget.quiz.questions`.
  const questions = quiz.questions && quiz.questions.length > 0 ? quiz.questions : [];

  // If no questions property, maybe the quiz itself defines one question?
  // Reference `MultipleChoice.dart`: `final questions = widget.quiz.questions;`
  // So we assume `questions` is populated.

  const handleOptionSelect = (questionId: string, optionKey: string) => {
    if (isChecked) return;

    setSelectedAnswers((prev) => {
      const next = { ...prev, [questionId]: optionKey };

      const allAnswered = questions.every((q) => next[q.id]);
      setAreAllAnswered(allAnswered);

      return next;
    });
  };

  const renderQuestion = (question: QuizQuestion) => {
    const selectedKey = selectedAnswers[question.id];
    const isCorrect = selectedKey === question.answer;

    return (
      <div key={question.id} className="mb-8">
        <h3 className="font-bold text-lg text-[hsl(var(--foreground))] mb-3">
          {question.question}
        </h3>

        <div className="space-y-3">
          {question.options.map((option) => {
            const isSelected = selectedKey === option.key;
            const isAnswerCorrect = option.key === question.answer;

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
                containerClass = 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10';
                textColor = 'text-[hsl(var(--primary))]';
                circleBorder = 'border-[hsl(var(--primary))]';
                circleBg = 'bg-[hsl(var(--primary))]';
                circleContent = <Check size={14} className="text-white" strokeWidth={3} />;
              } else if (isSelected && !isCorrect) {
                containerClass = 'border-red-500 bg-red-500/10';
                textColor = 'text-red-500';
                circleBorder = 'border-red-500'; // Based on Dart logic, selected is Primary?
                // Dart: circle border color logic: _isChecked && isAnswerCorrect ? Primary : (isSelected ? Primary : Border)
                // But circle bg logic: Same.
                // Wait, checking Dart again for 'isSelected && !isCorrect' in checked mode.
                // `isSelected` is true. `isAnswerCorrect` is false.
                // color: (isSelected ? appColors.primary : Colors.transparent) -> Primary.
                // border: (isSelected ? appColors.primary : appColors.border) -> Primary.
                // So even if wrong, the circle is Primary if selected.
                // BUT the Container border/bg would be Red (logic implied but not explicitly in snippet?
                // Wait, the Dart snippet I read earlier:
                /*
                    if (_isChecked) {
                      if (isAnswerCorrect) {
                         borderColor = appColors.primary; backgroundColor = ...primary...
                      } else if (isSelected && !isCorrect) {
                         borderColor = Colors.red; backgroundColor = ...red...
                      }
                    }
                   */
                // So container is Red.
                // Circle logic was separate in Dart snippet.
                // Let's stick to Container Red, Circle Primary (showing "You chose this").
                circleBorder = 'border-[hsl(var(--primary))]';
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
        {quiz.instruction && (
          <div className="mb-6 text-[hsl(var(--foreground))]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        {questions.map(renderQuestion)}
      </div>

      {areAllAnswered && !isChecked && (
        <div className="p-4 bg-[hsl(var(--background))]">
          <button
            onClick={onCheck}
            className="w-full py-4 bg-[hsl(var(--primary))] text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
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
