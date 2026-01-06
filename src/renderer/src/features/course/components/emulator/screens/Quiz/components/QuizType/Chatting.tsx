import React, { useState, useEffect } from 'react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';

interface ChattingProps {
  quiz: Quiz;
  isChecked?: boolean;
  onCheck?: () => void;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
  onExplainRequest?: (isOpen: boolean) => void;
}

export const Chatting: React.FC<ChattingProps> = ({ quiz, header, onUpdate }) => {
  const [instruction, setInstruction] = useState(quiz.instruction || '');

  // Sync with quiz prop changes
  useEffect(() => {
    setInstruction(quiz.instruction || '');
  }, [quiz.id, quiz.instruction]);

  const chats = quiz.chats || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
        {header}
        {instruction && (
          <div className="mb-6 text-[hsl(var(--foreground))] text-center">
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

        <div className="space-y-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-2xl px-5 py-3 text-[15px] leading-relaxed shadow-sm
                  ${
                    chat.role === 'user'
                      ? 'bg-[hsl(var(--primary))] text-white rounded-br-none'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-none'
                  }
                `}
              >
                {chat.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
