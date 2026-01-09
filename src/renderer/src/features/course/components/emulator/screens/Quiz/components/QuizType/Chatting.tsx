import React from 'react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';

interface ChattingProps {
  quiz: Quiz;
  isChecked?: boolean;
  onCheck?: () => void;
  onExplainRequest?: (isOpen: boolean) => void;
}

export const Chatting: React.FC<ChattingProps> = ({ quiz }) => {
  const chats = quiz.chats || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
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
                  max-w-[80%] rounded-2xl px-5 py-3 text-[16px] leading-relaxed shadow-sm
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
