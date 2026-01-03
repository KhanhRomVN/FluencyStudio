import React, { useState, useEffect, useMemo } from 'react';
import { Quiz, QuizAnswer } from '../../types';
import { RichTextParser } from '../RichTextParser';

interface GapFillQuizProps {
  quiz: Quiz;
  isChecked: boolean;
  onCheck: () => void;
}

export const GapFillQuiz: React.FC<GapFillQuizProps> = ({ quiz, isChecked, onCheck }) => {
  const [inputs, setInputs] = useState<{ [key: string]: string }>({});
  const [areAllGapsFilled, setAreAllGapsFilled] = useState(false);

  // Initialize checks
  useEffect(() => {
    if (!quiz.question) return;
    // Dart format: </gap id='...'>
    const regex = /<\/gap id='(.*?)'>/g;
    let match;
    let count = 0;
    while ((match = regex.exec(quiz.question)) !== null) {
      count++;
    }
  }, [quiz.question]);

  const handleInputChange = (id: string, value: string) => {
    setInputs((prev) => {
      const next = { ...prev, [id]: value };

      // Check if all filled
      const regex = /<\/gap id='(.*?)'>/g;
      let match;
      let allFilled = true;
      while ((match = regex.exec(quiz.question)) !== null) {
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
    if (!quiz.question) return null;

    return (
      <RichTextParser
        content={quiz.question}
        onGapFound={(id) => {
          const answerObj = quiz.answers?.find((a) => a.id === id);
          const correctAnswer = answerObj?.answer || '';
          const userAnswer = inputs[id] || '';

          const isCorrect =
            isChecked && userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
          const maxLength = correctAnswer.length > 0 ? correctAnswer.length : 20;

          if (isChecked) {
            if (isCorrect) {
              return (
                <span className="inline-block mx-1 font-bold text-[hsl(var(--primary))]">
                  {userAnswer}
                </span>
              );
            } else {
              return (
                <span className="inline-flex items-center mx-1 gap-1">
                  <span className="text-red-500 line-through decoration-red-500">{userAnswer}</span>
                  <span className="text-[hsl(var(--primary))] font-bold">{correctAnswer}</span>
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
      <div className="flex-1 overflow-y-auto px-4 py-4 text-[17px] leading-relaxed text-[hsl(var(--foreground))]">
        <div className="flex flex-wrap items-baseline">{renderContent()}</div>
      </div>

      {areAllGapsFilled && !isChecked && (
        <div className="p-4 bg-[hsl(var(--background))]">
          <button
            onClick={onCheck}
            className="w-full py-4 bg-[hsl(var(--primary))] text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all"
          >
            Check answers
          </button>
        </div>
      )}
    </div>
  );
};
