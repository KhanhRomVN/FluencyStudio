import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, QuizAnswer } from '../../types';

import { RichTextParser } from '../RichTextParser';
import { ExplainDrawer } from '../ExplainDrawer';

interface GapFillProps {
  quiz: Quiz;
  isChecked: boolean;
  onCheck: () => void;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
  onExplainRequest?: (isOpen: boolean) => void;
}

export const GapFill: React.FC<GapFillProps> = ({
  quiz,
  isChecked,
  onCheck,
  onUpdate,
  header,
  onExplainRequest,
}) => {
  const [inputs, setInputs] = useState<{ [key: string]: string }>({});
  const [areAllGapsFilled, setAreAllGapsFilled] = useState(false);
  const [isExplainOpen, setIsExplainOpen] = useState(false);
  const [currentExplanation, setCurrentExplanation] = useState('');

  // Local state for editing
  const [instruction, setInstruction] = useState(quiz.instruction || '');
  const [question, setQuestion] = useState(quiz.question || '');

  // Notify parent about explain drawer state
  useEffect(() => {
    onExplainRequest?.(isExplainOpen);
  }, [isExplainOpen, onExplainRequest]);

  // Initialize checks
  useEffect(() => {
    if (!question) return;
    // Dart format: </gap id='...'>
    const regex = /<\/gap id='(.*?)'>/g;
    let match;
    let count = 0;
    while ((match = regex.exec(question)) !== null) {
      count++;
    }
  }, [question]);

  const handleInputChange = (id: string, value: string) => {
    setInputs((prev) => {
      const next = { ...prev, [id]: value };

      // Check if all filled
      const regex = /<\/gap id='(.*?)'>/g;
      let match;
      let allFilled = true;
      while ((match = regex.exec(question)) !== null) {
        const gapId = match[1];
        if (!next[gapId] || next[gapId].trim() === '') {
          allFilled = false;
        }
      }
      setAreAllGapsFilled(allFilled);

      return next;
    });
  };

  const renderContent = () => {
    if (!question) return null;

    return (
      <RichTextParser
        content={question}
        sectionId="question"
        onChange={(newContent) => {
          setQuestion(newContent);
          onUpdate?.({ ...quiz, question: newContent });
        }}
        onGapFound={(id) => {
          const answerObj = quiz.answers?.find((a) => a.id === id);

          let possibleAnswers: string[] = [];
          if (Array.isArray(answerObj?.answer)) {
            possibleAnswers = answerObj?.answer.map(String) || [];
          } else if (answerObj?.answer) {
            possibleAnswers = [String(answerObj.answer)];
          }

          const userAnswer = inputs[id] || '';

          const isCorrect =
            isChecked &&
            possibleAnswers.some(
              (ans) => ans.toLowerCase().trim() === userAnswer.toLowerCase().trim(),
            );

          const longestAnswerLength = possibleAnswers.reduce(
            (max, ans) => Math.max(max, ans.length),
            0,
          );
          const maxLength = longestAnswerLength > 0 ? longestAnswerLength : 20;
          const displayCorrectAnswer = possibleAnswers.length > 0 ? possibleAnswers[0] : '';

          if (isChecked) {
            const explanation = answerObj?.explain || '';
            const handleExplain = () => {
              setCurrentExplanation(explanation);
              setIsExplainOpen(true);
            };

            if (isCorrect) {
              return (
                <span
                  key={`correct-${id}`}
                  onClick={handleExplain}
                  className="inline-block mx-1 font-bold text-[hsl(var(--primary))] cursor-pointer hover:underline"
                >
                  {userAnswer}
                </span>
              );
            } else {
              return (
                <span
                  key={`wrong-${id}`}
                  onClick={handleExplain}
                  className="inline-flex items-center mx-1 gap-1 cursor-pointer hover:underline"
                >
                  <span className="text-red-500 line-through decoration-red-500">{userAnswer}</span>
                  <span className="text-[hsl(var(--primary))] font-bold">
                    {displayCorrectAnswer}
                  </span>
                </span>
              );
            }
          }

          // Input Mode
          return (
            <span className="inline-block mx-1 align-baseline">
              <input
                type="text"
                value={userAnswer}
                maxLength={maxLength}
                onChange={(e) => handleInputChange(id, e.target.value)}
                className="
                  min-w-[40px]
                  border-b border-[hsl(var(--primary))]/50 
                  bg-transparent 
                  outline-none 
                  text-center 
                  font-bold 
                  text-[hsl(var(--foreground))]
                  focus:border-[hsl(var(--primary))] 
                  focus:border-b-2
                  transition-all
                  p-0
                "
                style={{ width: `${Math.max(2, maxLength)}ch` }}
              />
            </span>
          );
        }}
      />
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 text-[15px] leading-relaxed text-[hsl(var(--foreground))] [&::-webkit-scrollbar]:hidden">
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
        <div>{renderContent()}</div>
      </div>

      {areAllGapsFilled && !isChecked && (
        <div className="p-2 bg-[hsl(var(--background))]">
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
