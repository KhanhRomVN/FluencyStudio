import React, { useState } from 'react';
import { Quiz, ErrorCorrectionItem } from '../../types';
import { Check, X, Info } from 'lucide-react';
import { RichTextParser } from '../RichTextParser';

interface ErrorCorrectionProps {
  quiz: Quiz;
  isChecked?: boolean;
  onCheck?: () => void;
}

export const ErrorCorrection: React.FC<ErrorCorrectionProps> = ({
  quiz,
  isChecked = false,
  onCheck,
}) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const items = quiz.errorCorrections || [];

  const handleInputChange = (id: string, val: string) => {
    if (isChecked) return;
    setInputs((prev) => ({ ...prev, [id]: val }));
  };

  const checkAnswer = (item: ErrorCorrectionItem) => {
    const userVal = (inputs[item.id] || '').trim().toLowerCase();
    const correctVal = item.correction.trim().toLowerCase();
    return userVal === correctVal;
  };

  const allFilled =
    items.length > 0 && items.every((item) => (inputs[item.id] || '').trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        <div className="space-y-6 pb-8">
          {items.map((item, index) => {
            const isCorrect = isChecked && checkAnswer(item);

            return (
              <div
                key={item.id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm"
              >
                <div className="mb-3">
                  <span className="font-bold text-[hsl(var(--primary))] mr-2">Q{index + 1}.</span>
                  <span className="text-[hsl(var(--foreground))] text-[16px]">{item.sentence}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-1 uppercase tracking-wider">
                      Correction
                    </label>
                    <input
                      type="text"
                      value={inputs[item.id] || ''}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      disabled={isChecked}
                      placeholder="Type the corrected word/phrase..."
                      className={`
                                w-full p-3 rounded-lg border-2 bg-[hsl(var(--background))] transition-all text-[16px]
                                ${
                                  isChecked
                                    ? isCorrect
                                      ? 'border-green-500 bg-green-500/10 text-green-700'
                                      : 'border-red-500 bg-red-500/10 text-red-700'
                                    : 'border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))/10]'
                                }
                            `}
                    />
                  </div>
                </div>

                {isChecked && !isCorrect && (
                  <div className="mt-3 flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700">
                    <X className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-bold">Correct answer:</p>
                      <p>{item.correction}</p>
                      <p className="text-xs mt-1 opacity-80">
                        Error was: <span className="line-through">{item.error}</span>
                      </p>
                    </div>
                  </div>
                )}

                {isChecked && item.explain && (
                  <div className="mt-3 flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-700">
                    <Info className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <p className="font-bold">Explanation:</p>
                      <p>{item.explain}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {!isChecked && allFilled && onCheck && (
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <button
            onClick={onCheck}
            className="w-full py-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg"
          >
            <Check size={20} strokeWidth={3} />
            Check Answers
          </button>
        </div>
      )}
    </div>
  );
};
