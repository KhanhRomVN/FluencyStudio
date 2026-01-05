import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';
import { WritingHintDrawer } from '../WritingHintDrawer';

interface WritingProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
}

export const Writing: React.FC<WritingProps> = ({ quiz, header }) => {
  const [content, setContent] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHintDrawer, setShowHintDrawer] = useState(false);
  const [currentHint, setCurrentHint] = useState<string>('');

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
        {header}

        {/* Input Area */}
        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-sm text-[hsl(var(--muted-foreground))]">
            <span>Minimum words: {quiz.min || 150}</span>
            <span>Word count: {wordCount}</span>
          </div>
          <textarea
            className="w-full h-64 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            placeholder="Type your answer here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitted}
          />
        </div>

        {/* Submit Button */}
        {!isSubmitted && wordCount >= (quiz.min || 150) && (
          <button
            onClick={handleSubmit}
            className="w-full py-3 rounded-lg bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Submit
          </button>
        )}

        {/* Example / Result Section */}
        {isSubmitted && quiz.example && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-bold text-lg mb-3 text-[hsl(var(--foreground))]">Sample Answer</h3>
            <div className="p-4 rounded-lg bg-[hsl(var(--secondary)/30)] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] leading-relaxed text-sm">
              <RichTextParser content={quiz.example} onHintClick={handleHintClick} />
            </div>
          </div>
        )}
      </div>

      <WritingHintDrawer
        isOpen={showHintDrawer}
        onClose={() => setShowHintDrawer(false)}
        hintContent={currentHint}
      />
    </div>
  );
};
