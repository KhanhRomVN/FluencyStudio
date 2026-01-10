import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, StepForward, HelpCircle } from 'lucide-react';
import { Quiz, ChatMessage } from '../../types';
import { RichTextParser } from '../RichTextParser';

interface ChattingSpeechProps {
  quiz: Quiz;
}

interface WordFeedback {
  word: string;
  status: 'correct' | 'incorrect' | 'missing' | 'extra';
}

interface MessageScore {
  score: number;
  feedback: WordFeedback[];
  transcript: string;
}

export const ChattingSpeech: React.FC<ChattingSpeechProps> = ({ quiz }) => {
  const chats = quiz.chats || [];

  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [messageScores, setMessageScores] = useState<Record<string, MessageScore>>({});
  const [visibleCount, setVisibleCount] = useState(0);
  const [ipaVisible, setIpaVisible] = useState<Record<string, boolean>>({});

  // Long press handling
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper to extract translate text from <p translate='...'> attribute
  const extractTranslate = (html: string): string | null => {
    const match = html.match(/<p[^>]*translate=['"]([^'"]*)['"]/i);
    return match ? match[1] : null;
  };

  // Helper to get text content from HTML
  const getTextContent = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Helper to find next user turn
  const findNextUserIndex = (startIndex: number) => {
    for (let i = startIndex; i < chats.length; i++) {
      if (chats[i].isUser) return i;
    }
    return -1;
  };

  // Init visible count
  useEffect(() => {
    const firstUserIdx = findNextUserIndex(0);
    if (firstUserIdx !== -1) {
      setVisibleCount(firstUserIdx + 1);
    } else {
      setVisibleCount(chats.length);
    }
  }, [quiz.id]);

  // Scroll to bottom when visible count changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      setTimeout(() => {
        scrollContainerRef.current?.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [visibleCount]);

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Calculate similarity score
  const calculateScore = (spoken: string, target: string): number => {
    const spokenLower = spoken.toLowerCase().trim();
    const targetLower = target.toLowerCase().trim();

    if (spokenLower === targetLower) return 100;

    const spokenWords = spokenLower.split(/\s+/);
    const targetWords = targetLower.split(/\s+/);

    let matches = 0;
    targetWords.forEach((word) => {
      if (spokenWords.some((sw) => sw.includes(word) || word.includes(sw))) {
        matches++;
      }
    });

    return Math.round((matches / targetWords.length) * 100);
  };

  // Simulate pronunciation with some errors
  const simulatePronunciation = (targetText: string): string => {
    const words = targetText.split(' ');
    const result: string[] = [];
    const errorRate = 0.3;

    words.forEach((word) => {
      const rand = Math.random();

      if (rand < errorRate * 0.4) {
        return; // Skip word
      } else if (rand < errorRate * 0.7) {
        const wrongWords = ['the', 'a', 'an', 'is', 'was', 'were', 'very', 'much', 'so'];
        result.push(wrongWords[Math.floor(Math.random() * wrongWords.length)]);
      } else if (rand < errorRate) {
        const chars = word.split('');
        const idx = Math.floor(Math.random() * chars.length);
        chars[idx] = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        result.push(chars.join(''));
      } else {
        result.push(word);
      }
    });

    if (Math.random() < 0.2) {
      const extraWords = ['um', 'uh', 'like', 'actually'];
      const extraWord = extraWords[Math.floor(Math.random() * extraWords.length)];
      const insertPos = Math.floor(Math.random() * (result.length + 1));
      result.splice(insertPos, 0, extraWord);
    }

    return result.join(' ');
  };

  // Levenshtein distance
  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  // Analyze word-by-word feedback
  const analyzeWordFeedback = (spoken: string, target: string): WordFeedback[] => {
    const spokenWords = spoken
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w);
    const targetWords = target
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .filter((w) => w);

    const feedback: WordFeedback[] = new Array(targetWords.length);
    const usedSpokenIndices = new Set<number>();

    // First pass: exact matches
    targetWords.forEach((targetWord, targetIdx) => {
      const spokenIdx = spokenWords.findIndex(
        (w, idx) => !usedSpokenIndices.has(idx) && w === targetWord,
      );

      if (spokenIdx !== -1) {
        feedback[targetIdx] = { word: targetWord, status: 'correct' };
        usedSpokenIndices.add(spokenIdx);
      }
    });

    // Second pass: similar matches
    targetWords.forEach((targetWord, targetIdx) => {
      if (feedback[targetIdx]) return;

      const spokenIdx = spokenWords.findIndex(
        (w, idx) =>
          !usedSpokenIndices.has(idx) &&
          (w.includes(targetWord) ||
            targetWord.includes(w) ||
            levenshteinDistance(w, targetWord) <= 2),
      );

      if (spokenIdx !== -1) {
        feedback[targetIdx] = { word: targetWord, status: 'incorrect' };
        usedSpokenIndices.add(spokenIdx);
      } else {
        feedback[targetIdx] = { word: targetWord, status: 'missing' };
      }
    });

    // Third pass: extra words
    const extraWords: WordFeedback[] = [];
    spokenWords.forEach((spokenWord, idx) => {
      if (!usedSpokenIndices.has(idx)) {
        extraWords.push({ word: spokenWord, status: 'extra' });
      }
    });

    return [...feedback, ...extraWords];
  };

  // Simulate test for a message
  const handleSimulateTest = (chatId: string, targetText: string, messageIndex: number) => {
    const simulatedTranscript = simulatePronunciation(targetText);
    const score = calculateScore(simulatedTranscript, targetText);
    const feedback = analyzeWordFeedback(simulatedTranscript, targetText);

    setMessageScores((prev) => ({
      ...prev,
      [chatId]: {
        score,
        feedback,
        transcript: simulatedTranscript,
      },
    }));

    // If score is good (>= 50%) and this is the last visible message, advance
    if (score >= 50 && messageIndex === visibleCount - 1) {
      const nextUserIdx = findNextUserIndex(visibleCount);
      if (nextUserIdx !== -1) {
        setVisibleCount(nextUserIdx + 1);
      } else {
        setVisibleCount(chats.length);
      }
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startPos.current = { x: e.clientX, y: e.clientY };
    isLongPress.current = false;

    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (longPressTimer.current) {
      const dist = Math.sqrt(
        Math.pow(e.clientX - startPos.current.x, 2) + Math.pow(e.clientY - startPos.current.y, 2),
      );
      if (dist > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
  };

  const handlePointerUp = (messageId: string, e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!isLongPress.current) {
      e.stopPropagation();
      setActiveMessageId((prev) => (prev === messageId ? null : messageId));
    }

    setTimeout(() => {
      isLongPress.current = false;
    }, 0);
  };

  const handlePointerCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    isLongPress.current = false;
  };

  // Get score color
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  // Render text with pronunciation feedback
  const renderTextWithFeedback = (text: string, feedback: WordFeedback[]) => {
    return (
      <span className="text-sm">
        {feedback.map((item, idx) => {
          if (item.status === 'extra') return null;

          let colorClass = '';
          if (item.status === 'correct') {
            colorClass = 'text-[hsl(var(--primary))]';
          } else if (item.status === 'incorrect' || item.status === 'missing') {
            colorClass = 'text-red-500';
          }

          return (
            <span key={idx}>
              <span className={colorClass}>{item.word}</span>
              {idx < feedback.filter((f) => f.status !== 'extra').length - 1 ? ' ' : ''}
            </span>
          );
        })}
      </span>
    );
  };

  // Renderers
  const renderBubble = (chat: ChatMessage, index: number) => {
    const isUserMessage = chat.isUser;
    const translateText = extractTranslate(chat.question);
    const isTranslateActive = activeMessageId === chat.id;
    const scoreData = messageScores[chat.id];
    const targetText = getTextContent(chat.question);
    const showIpaButton = scoreData && scoreData.score < 50 && chat.ipa;

    const handleSpeak = () => {
      speakText(targetText);
    };

    const handleTestClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleSimulateTest(chat.id, targetText, index);
    };

    const toggleIpa = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIpaVisible((prev) => ({ ...prev, [chat.id]: !prev[chat.id] }));
    };

    return (
      <div
        key={chat.id}
        className={`flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full`}
      >
        <div
          className={`flex flex-col gap-1 w-full ${isUserMessage ? 'items-end' : 'items-start'}`}
        >
          {/* Role/Name badge */}
          <div
            className={`flex items-center gap-1.5 text-xs ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <span className="font-semibold text-[hsl(var(--primary))]">{chat.role}</span>
            {chat.name && (
              <span className="text-[hsl(var(--muted-foreground))]">({chat.name})</span>
            )}
            {chat.time && (
              <span className="text-[hsl(var(--muted-foreground))] font-mono ml-1">
                {chat.time}
              </span>
            )}
          </div>

          {/* Bubble */}
          <div
            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed relative ${
              isUserMessage
                ? 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border-2 border-[hsl(var(--primary))]/30 border-solid rounded-br-none'
                : 'bg-transparent text-[hsl(var(--foreground))] border-2 border-[hsl(var(--primary))] border-dashed rounded-bl-none'
            }`}
          >
            <span
              className={`inline cursor-pointer transition-all duration-200 select-text ${
                isTranslateActive
                  ? 'bg-[hsl(var(--primary))]/20 shadow-sm'
                  : 'hover:bg-[hsl(var(--primary))]/5'
              } [&_p]:inline [&_p]:m-0 [&_span]:inline [&_span]:m-0`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={(e) => handlePointerUp(chat.id, e)}
              onPointerCancel={handlePointerCancel}
              onContextMenu={(e) => e.preventDefault()}
            >
              {scoreData ? (
                renderTextWithFeedback(targetText, scoreData.feedback)
              ) : (
                <RichTextParser content={chat.question} />
              )}
            </span>

            {/* Translation - inline next to text */}
            {translateText && isTranslateActive && (
              <span className="inline ml-1 py-0.5 px-1.5 rounded bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-medium italic text-xs [&_p]:inline [&_p]:m-0 [&_span]:inline [&_span]:m-0 animate-in fade-in zoom-in-95 duration-200 border border-[hsl(var(--border))]">
                {translateText}
              </span>
            )}

            {/* IPA Display */}
            {ipaVisible[chat.id] && chat.ipa && (
              <div className="block mt-1 text-xs text-[hsl(var(--muted-foreground))] font-mono bg-[hsl(var(--muted))]/30 px-1.5 py-0.5 rounded w-fit animate-in fade-in zoom-in-95">
                {chat.ipa}
              </div>
            )}

            {/* Score badge */}
            {scoreData && (
              <div className="flex items-center gap-2 mt-1">
                <div className={`text-xs font-bold ${getScoreColor(scoreData.score)}`}>
                  {scoreData.score}%
                </div>
                {/* IPA Toggle Button */}
                {showIpaButton && (
                  <button
                    onClick={toggleIpa}
                    className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors"
                    title="Show Pronunciation Guide"
                  >
                    <HelpCircle size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* User Transcript Display */}
          {scoreData && isUserMessage && (
            <div className="max-w-[80%] mt-1 px-2 py-1 rounded bg-[hsl(var(--muted))]/30 border border-dashed border-[hsl(var(--border))]">
              <div className="text-xs text-[hsl(var(--muted-foreground))] italic">
                "{scoreData.transcript}"
              </div>
            </div>
          )}

          {/* Icon buttons below bubble */}
          <div
            className={`flex items-center gap-2 ${isUserMessage ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* TTS Button */}
            <button
              onClick={handleSpeak}
              className="p-1 hover:bg-[hsl(var(--muted))] rounded transition-colors"
              title="Play audio"
            >
              <Volume2 size={14} className="text-[hsl(var(--muted-foreground))]" />
            </button>

            {/* Test button - ONLY for User */}
            {isUserMessage && (
              <button
                onClick={handleTestClick}
                className="p-1 hover:bg-[hsl(var(--muted))] rounded transition-colors"
                title="Test pronunciation"
              >
                <StepForward size={14} className="text-[hsl(var(--muted-foreground))]" />
              </button>
            )}
          </div>
        </div>

        {/* Explanation - Centered after completion */}
        {scoreData && chat.explain && (
          <div className="w-full flex justify-center mt-3 mb-1 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-transparent border border-dashed border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] text-sm px-4 py-2 rounded-xl max-w-[90%] text-center italic">
              <RichTextParser content={chat.explain} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden relative">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden pb-8"
      >
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-sm text-center opacity-80">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}

        <div className="flex flex-col">
          {chats.slice(0, visibleCount).map((chat, i) => renderBubble(chat, i))}
        </div>
      </div>
    </div>
  );
};
