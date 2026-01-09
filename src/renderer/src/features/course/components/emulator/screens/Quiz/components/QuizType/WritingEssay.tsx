import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';
import { HintDrawer } from '../HintDrawer';

interface WritingProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
}

export const WritingEssay: React.FC<WritingProps> = ({ quiz }) => {
  const [content, setContent] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHintDrawer, setShowHintDrawer] = useState(false);
  const [currentHint, setCurrentHint] = useState<string>('');

  // Reset state when quiz changes
  React.useEffect(() => {
    setContent('');
    setIsSubmitted(false);
    setShowHintDrawer(false);
    setCurrentHint('');
  }, [quiz.id]);

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const handleSubmit = () => {
    setIsSubmitted(true);
    // You might want to save the user's answer here or via onUpdate
  };

  const handleHintClick = (hint: string) => {
    setCurrentHint(hint);
    setShowHintDrawer(true);
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden pb-24">
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        {/* Input Area */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-sm text-[hsl(var(--muted-foreground))]">
            <span>Minimum words: {quiz.min || 150}</span>
            <span>Word count: {wordCount}</span>
          </div>
          {isSubmitted ? (
            <div className="text-[hsl(var(--foreground))] leading-relaxed text-[16px] whitespace-pre-wrap">
              {content}
            </div>
          ) : (
            <textarea
              className="w-full h-64 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] text-[16px]"
              placeholder="Type your answer here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSubmitted}
            />
          )}
        </div>

        {/* Example / Result Section */}
        {isSubmitted && quiz.example && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold text-[16px] mb-3 text-[hsl(var(--foreground))]">
              Sample Answer
            </h3>
            <div className="text-[hsl(var(--foreground))] leading-relaxed text-[16px]">
              <RichTextParser content={quiz.example} onHintClick={handleHintClick} />
            </div>
          </div>
        )}
      </div>

      {/* Fixed Submit Button */}
      {!isSubmitted && wordCount >= (quiz.min || 150) && (
        <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))]">
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Submit
          </button>
        </div>
      )}

      <HintDrawer
        isOpen={showHintDrawer}
        onClose={() => setShowHintDrawer(false)}
        hintContent={currentHint}
      />
    </div>
  );
};
