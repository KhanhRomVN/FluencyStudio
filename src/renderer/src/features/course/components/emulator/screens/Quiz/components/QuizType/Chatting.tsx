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

  const playAudio = (e: React.MouseEvent, text: string, audioUrl?: string, id?: string) => {
    e.stopPropagation(); // Prevent bubble click
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

  const handleReplay = () => {
    setVisibleChats([]);
    setCurrentIndex(0);
    setAnsweredState({});
    setExpandedExplanation(null);
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

    return undefined;
  }, [currentIndex, chats, visibleChats]);

  const handleOptionSelect = (optionKey: string, optionText: string) => {
    const currentChat = chats[currentIndex];

    // Check correctness
    const isCorrect = currentChat.answer === optionKey;

    setAnsweredState((prev) => ({
      ...prev,
      [currentChat.id]: { selected: optionKey, isCorrect },
    }));

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

  // Progress calculation
  // current index is roughly the number of turns completed.
  const progressPercent = Math.min(100, (currentIndex / chats.length) * 100);

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] text-sm relative">
      {/* Progress Bar */}
      <div className="w-full bg-[hsl(var(--muted))] h-1 absolute top-0 left-0 z-10">
        <div
          className="bg-green-500 h-1 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 [&::-webkit-scrollbar]:hidden scroll-smooth mt-1"
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

        <div className="space-y-4 pb-3">
          {visibleChats?.map((chat, index) => (
            <div
              key={chat.id || index}
              className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`flex items-end gap-2 max-w-[85%] ${chat.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Chat Bubble - Interactive */}
                <div
                  onClick={() =>
                    chat.explain &&
                    setExpandedExplanation(expandedExplanation === chat.id ? null : chat.id)
                  }
                  className={`
                        relative px-4 py-3 text-sm leading-snug rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-1 duration-200 cursor-pointer group
                        ${
                          chat.role === 'user'
                            ? 'bg-[hsl(var(--primary))] text-white rounded-br-sm'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-sm border border-[hsl(var(--border))]'
                        }
                        hover:brightness-95 transition-all
                        `}
                >
                  {chat.img && (
                    <img
                      src={chat.img}
                      alt="context"
                      className="rounded-lg mb-2 max-w-full h-auto object-cover"
                    />
                  )}

                  <div className="flex flex-col">
                    <span>{chat.content}</span>

                    {/* IPA Display */}
                    {chat.ipa && (
                      <span
                        className={`text-[11px] mt-1 font-mono opacity-80 ${chat.role === 'user' ? 'text-blue-100' : 'text-[hsl(var(--muted-foreground))]'}`}
                      >
                        /{chat.ipa}/
                      </span>
                    )}
                  </div>

                  {/* Hint indicator if explain exists */}
                  {chat.explain && (
                    <div
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ${expandedExplanation === chat.id ? 'opacity-100' : ''}`}
                    />
                  )}
                </div>

                {/* Audio Button */}
                <button
                  onClick={(e) => playAudio(e, chat.content, chat.audio, chat.id)}
                  className={`p-1.5 rounded-full hover:bg-[hsl(var(--action-hover))] transition-colors ${playingAudioId === chat.id ? 'text-[hsl(var(--primary))]' : 'text-[hsl(var(--muted-foreground))]'}`}
                >
                  <Volume2
                    size={16}
                    className={playingAudioId === chat.id ? 'animate-pulse' : ''}
                  />
                </button>
              </div>

              {/* Explanation Panel - Inline but styled distinctively */}
              {expandedExplanation === chat.id && chat.explain && (
                <div
                  className={`mt-2 ml-2 text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] p-3 rounded-lg max-w-[85%] animate-in fade-in slide-in-from-top-1 duration-200 select-none`}
                >
                  <div className="flex items-start gap-2">
                    <Info size={14} className="mt-0.5 text-[hsl(var(--primary))]" />
                    <span className="italic">{chat.explain}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in slide-in-from-bottom-1">
              <div className="bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-2xl rounded-bl-none px-4 py-3 border border-[hsl(var(--border))]">
                <div className="flex space-x-1.5">
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
        <div className="p-4 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] animate-in slide-in-from-bottom-2 duration-300 z-10 shadow-lg -mt-px relative">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3 text-center">
            Select the best response
          </p>
          <div className="grid gap-2.5 max-w-xl mx-auto">
            {currentChat.options?.map((option) => {
              // Determine state
              const isSelected = currentAnswerState?.selected === option.key;
              const isCorrectAnswer = currentAnswerState?.isCorrect && isSelected;
              const isWrongAnswer = !currentAnswerState?.isCorrect && isSelected;

              // Styles
              let borderClass = 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary))]';
              let bgClass = 'bg-[hsl(var(--background))] hover:bg-[hsl(var(--accent))]';
              let icon = null;

              if (isCorrectAnswer) {
                borderClass = 'border-green-500 ring-1 ring-green-500';
                bgClass = 'bg-green-500/10';
                icon = <Check size={16} className="text-green-600" strokeWidth={3} />;
              } else if (isWrongAnswer) {
                borderClass = 'border-red-500 ring-1 ring-red-500';
                bgClass = 'bg-red-500/10';
                icon = <X size={16} className="text-red-500" strokeWidth={3} />;
              }

              return (
                <button
                  key={option.key}
                  onClick={() =>
                    !currentAnswerState?.isCorrect && handleOptionSelect(option.key, option.text)
                  }
                  disabled={currentAnswerState?.isCorrect}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all duration-200
                    ${borderClass} ${bgClass}
                    active:scale-[0.98] outline-none
                `}
                >
                  <span className="text-sm text-[hsl(var(--foreground))] font-medium flex-1 pr-2">
                    {option.text}
                  </span>
                  {icon}
                </button>
              );
            })}
          </div>
          {currentAnswerState?.selected && !currentAnswerState?.isCorrect && (
            <p className="text-center text-xs text-red-500 font-bold mt-2 animate-pulse">
              Try again!
            </p>
          )}
        </div>
      )}

      {/* End Completed Screen */}
      {currentIndex >= chats.length && !isTyping && (
        <div className="p-6 text-center animate-in zoom-in-95 duration-500 flex flex-col items-center justify-center bg-[hsl(var(--background))] h-full absolute inset-0 z-20">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <Check size={40} className="text-green-600" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">
            Lesson Completed!
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] mb-8 max-w-xs mx-auto">
            Great job! You've finished this conversation practice.
          </p>

          <button
            onClick={handleReplay}
            className="px-8 py-3 bg-[hsl(var(--primary))] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            Practice Again
          </button>
        </div>
      )}
    </div>
  );
};
