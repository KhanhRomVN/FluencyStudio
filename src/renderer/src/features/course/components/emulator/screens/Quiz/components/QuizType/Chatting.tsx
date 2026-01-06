import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Quiz } from '../../types';
import { RichTextParser } from '../RichTextParser';
import { Check, Info, Volume2, X } from 'lucide-react';

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
  const [visibleChats, setVisibleChats] = useState<typeof quiz.chats>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [answeredState, setAnsweredState] = useState<{
    [id: string]: { selected: string; isCorrect: boolean };
  }>({});
  const [expandedExplanation, setExpandedExplanation] = useState<string | null>(null);

  // Memoize chats to avoid useEffect dependency issues
  const chats = useMemo(() => quiz.chats || [], [quiz.chats]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Audio handling
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleChats, isTyping, expandedExplanation]);

  const playAudio = (text: string, audioUrl?: string, id?: string) => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        setPlayingAudioId(null);
      }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingAudioId(id || null);
      audio.play();
      audio.onended = () => setPlayingAudioId(null);
    } else {
      // Fallback to TTS
      if (window.speechSynthesis) {
        if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        setPlayingAudioId(id || null);
        utterance.onend = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Process conversation flow
  useEffect(() => {
    if (currentIndex >= chats.length) return;

    const currentChat = chats[currentIndex];

    // If already visible, don't re-process
    if (visibleChats && visibleChats.find((c) => c.id === currentChat.id)) return;

    // Bot message logic
    if (currentChat.role === 'bot') {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setVisibleChats((prev) => {
          // Prevent duplicate addition
          if (prev?.find((c) => c.id === currentChat.id)) return prev;
          return [...(prev || []), currentChat];
        });
        setIsTyping(false);
        setCurrentIndex((prev) => prev + 1);

        // Auto-play audio for bot if available (optional, maybe distracting, so kept manual for now)
      }, 1000);
      return () => clearTimeout(timer);
    }

    // User message logic
    // If it DOESN'T have options, it's just a narrative user line
    if (currentChat.role === 'user' && (!currentChat.options || currentChat.options.length === 0)) {
      const timer = setTimeout(() => {
        setVisibleChats((prev) => {
          if (prev?.find((c) => c.id === currentChat.id)) return prev;
          return [...(prev || []), currentChat];
        });
        setCurrentIndex((prev) => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }

    // If it has options, we wait for user interaction.
    // However, if we are revisiting and it was technically "done", we might need to handle that,
    // but here we rely on local state flow.
  }, [currentIndex, chats, visibleChats]); // Added visibleChats to deps to check existence

  const handleOptionSelect = (optionKey: string, optionText: string) => {
    const currentChat = chats[currentIndex];

    // Check correctness
    const isCorrect = currentChat.answer === optionKey;

    setAnsweredState((prev) => ({
      ...prev,
      [currentChat.id]: { selected: optionKey, isCorrect },
    }));

    // If incorrect, we verify but do NOT advance content immediately?
    // User requested "cơ chế chọn đúng sai". Usually implies you must pick correct one to proceed or just show result.
    // Let's allow proceeding only if correct, or just proceed with the chosen one but mark it?
    // For educational flow, usually we want them to get it right.
    // But to keep flow smooth: if correct -> advance. If wrong -> show error shake/effect but stay.

    if (isCorrect) {
      // Resolve the chat content with the correct selected text
      const resolvedChat = { ...currentChat, content: optionText }; // Use option text

      // Small delay to see success state
      setTimeout(() => {
        setVisibleChats((prev) => [...(prev || []), resolvedChat]);
        setCurrentIndex((prev) => prev + 1);
      }, 800);
    }
  };

  const currentChat = chats[currentIndex];
  // Show options if it's user turn, has options, and logic determines we are at this step
  const showOptions =
    currentChat?.role === 'user' && currentChat.options && currentChat.options.length > 0;

  // Current interaction state
  const currentAnswerState = currentChat ? answeredState[currentChat.id] : undefined;

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] text-sm">
      {/* Reduced base text size */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 [&::-webkit-scrollbar]:hidden scroll-smooth"
      >
        {header}
        {instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-center text-xs opacity-80">
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

        <div className="space-y-3 pb-3">
          {visibleChats?.map((chat, index) => (
            <div
              key={chat.id || index}
              className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex items-end gap-2 max-w-[85%] ${chat.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Chat Bubble */}
                <div
                  className={`
                        relative px-3 py-2 text-sm leading-snug rounded-xl shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200
                        ${
                          chat.role === 'user'
                            ? 'bg-[hsl(var(--primary))] text-white rounded-br-none'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-none border border-[hsl(var(--border))]'
                        }
                        `}
                >
                  {chat.content}

                  {/* IPA Display */}
                  {chat.ipa && (
                    <div
                      className={`text-[10px] mt-1 font-mono opacity-80 ${chat.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}
                    >
                      /{chat.ipa}/
                    </div>
                  )}
                </div>

                {/* Audio Button */}
                <button
                  onClick={() => playAudio(chat.content, chat.audio, chat.id)}
                  className={`p-1.5 rounded-full hover:bg-[hsl(var(--action-hover))] transition-colors ${playingAudioId === chat.id ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                >
                  <Volume2
                    size={14}
                    className={playingAudioId === chat.id ? 'animate-pulse' : ''}
                  />
                </button>

                {/* Explain Button (if available) */}
                {chat.explain && (
                  <button
                    onClick={() =>
                      setExpandedExplanation(expandedExplanation === chat.id ? null : chat.id)
                    }
                    className={`p-1.5 rounded-full hover:bg-[hsl(var(--action-hover))] transition-colors text-[hsl(var(--muted-foreground))]`}
                  >
                    <Info size={14} />
                  </button>
                )}
              </div>

              {/* Explanation Panel */}
              {expandedExplanation === chat.id && chat.explain && (
                <div
                  className={`mt-1 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] p-2 rounded-md max-w-[85%] animate-in fade-in zoom-in-95 duration-200`}
                >
                  <span className="font-bold text-[hsl(var(--primary))]">Explain: </span>
                  {chat.explain}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1">
              <div className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-xl rounded-bl-none px-3 py-2 border border-[hsl(var(--border))]">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-[hsl(var(--foreground))] opacity-40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-[hsl(var(--foreground))] opacity-40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-[hsl(var(--foreground))] opacity-40 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Options Area */}
      {showOptions && (
        <div className="p-3 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] animate-in slide-in-from-bottom-2 duration-300 z-10">
          <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-2 text-center">
            Choose the best response:
          </p>
          <div className="grid gap-2 max-w-xl mx-auto">
            {currentChat.options?.map((option) => {
              // Determine state
              const isSelected = currentAnswerState?.selected === option.key;
              const isCorrectAnswer = currentAnswerState?.isCorrect && isSelected;
              const isWrongAnswer = !currentAnswerState?.isCorrect && isSelected;

              // Styles
              let borderClass = 'border-[hsl(var(--border))]';
              let bgClass = 'bg-[hsl(var(--background))] hover:bg-[hsl(var(--accent))]';
              let icon = null;

              if (isCorrectAnswer) {
                borderClass = 'border-green-500';
                bgClass = 'bg-green-500/10';
                icon = <Check size={14} className="text-green-600" />;
              } else if (isWrongAnswer) {
                borderClass = 'border-red-500';
                bgClass = 'bg-red-500/10';
                icon = <X size={14} className="text-red-500" />;
              }

              return (
                <button
                  key={option.key}
                  onClick={() =>
                    !currentAnswerState?.isCorrect && handleOptionSelect(option.key, option.text)
                  }
                  disabled={currentAnswerState?.isCorrect}
                  className={`
                    w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all duration-200
                    ${borderClass} ${bgClass}
                    active:scale-[0.99]
                `}
                >
                  <span className="text-sm text-[hsl(var(--foreground))] font-medium flex-1">
                    {option.text}
                  </span>
                  {icon}
                </button>
              );
            })}
          </div>
          {currentAnswerState?.selected && !currentAnswerState?.isCorrect && (
            <p className="text-center text-xs text-red-500 font-medium mt-2 animate-pulse">
              Try again!
            </p>
          )}
        </div>
      )}

      {/* End Indicator */}
      {currentIndex >= chats.length && !isTyping && (
        <div className="p-3 text-center animate-in fade-in duration-500">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 mb-1">
            <Check size={16} strokeWidth={3} />
          </div>
          <p className="text-xs text-[hsl(var(--muted-foreground))] font-medium">Completed</p>
        </div>
      )}
    </div>
  );
};
