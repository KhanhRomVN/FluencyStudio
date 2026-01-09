import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Check,
  ChevronRight,
  Volume2,
  Languages,
  Ear,
  StepForward,
} from 'lucide-react';
import { Quiz, ChatMessage } from '../../types';
import { RichTextParser } from '../RichTextParser';

interface ChattingSpeechProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
  onTestSkip?: () => void;
}

// Reuse speech types from PronunciationDrill or similar
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

const PASS_THRESHOLD = 75;

export const ChattingSpeech: React.FC<ChattingSpeechProps> = ({ quiz }) => {
  const chats = quiz.chats || [];

  // State
  const [visibleCount, setVisibleCount] = useState(0);
  const [activeUserIndex, setActiveUserIndex] = useState(-1); // Index of the user message currently being attempted

  // Map of message ID -> pass status
  const [messageStates, setMessageStates] = useState<
    Record<string, { passed: boolean; score: number }>
  >({});

  const [isRecording, setIsRecording] = useState(false);
  const [showTranslate, setShowTranslate] = useState<Record<string, boolean>>({});
  const [showIpa, setShowIpa] = useState<Record<string, boolean>>({});
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Helper to find next user turn
  const findNextUserIndex = (startIndex: number) => {
    for (let i = startIndex; i < chats.length; i++) {
      if (chats[i].role === 'user') return i;
    }
    return -1;
  };

  // Initialize
  useEffect(() => {
    // Reset states
    setMessageStates({});
    setTranscript('');
    setIsRecording(false);

    // Initial calculation: Show up to first user message (inclusive)
    // If no user message, show all.
    const firstUserIdx = findNextUserIndex(0);
    if (firstUserIdx !== -1) {
      setVisibleCount(firstUserIdx + 1);
      setActiveUserIndex(firstUserIdx);
      // Mark all preceding assistant messages as "shown" (no state needed really)
    } else {
      setVisibleCount(chats.length);
      setActiveUserIndex(-1);
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
  }, [visibleCount, transcript]); // also scroll on transcript update to keep input in view?

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const initRecognition = useCallback(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return null;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    return recognition;
  }, []);

  const calculateScore = (spoken: string, target: string): number => {
    const spokenLower = spoken
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .trim();
    // Target is the answer word mixed with the question text?
    // Wait, the "question" has gaps. The user speaks the FULL sentence (implied).
    // Or just the answer?
    // Usually speech builder = full sentence.
    // Let's assume full sentence reconstruction.

    // We need to reconstruct the "ideal" sentence from question + answer.
    // Simple approach: remove tags from question, fill gap with answer.
    // If multiple gaps, we need logic. Assuming 1 gap for now or answer is array?
    // Types says answer is string.

    // Reconstruct target:
    // This requires strict parsing. For now, let's just strip HTML from 'question' and put 'answer' in?
    // Actually, simpler: construct normalized target string.
    // But 'question' has `<gap>`.
    // Let's rely on standard text similarity.
    // We can strip `<gap>` and insert `answer`.

    // Quick Parse: replace <gap...></gap> with answer.
    // Regex for gap: /<gap[^>]*>.*?<\/gap>/gi or just /<gap[^>]*\/>/
    const targetLower = target
      .toLowerCase()
      .replace(/[.,!?]/g, '')
      .trim();

    if (spokenLower === targetLower) return 100;

    // Word match
    const spokenWords = spokenLower.split(/\s+/);
    const targetWords = targetLower.split(/\s+/);
    let matches = 0;
    targetWords.forEach((w) => {
      if (spokenWords.includes(w)) matches++;
    });
    return Math.round((matches / targetWords.length) * 100);
  };

  const getTargetSentence = (msg: ChatMessage) => {
    if (!msg.question || !msg.answer) return '';
    // Replace <gap> with answer.
    // Simple regex replace.
    // Assuming single answer for now as per JSON example `answer: "present"`.
    const q = msg.question;
    // Remove all tags except gap? No, remove all tags. Use answer.
    // Actually, we want to construct the text.
    // "I don't understand ... <gap> ... versus went"
    // We need to replace `<gap>` (or `<gap></gap>`) with `msg.answer`.
    // Current JSON: `<gap></gap>`
    let text = q.replace(/<gap[^>]*>.*?<\/gap>/gi, msg.answer); // handles <gap>content</gap>
    text = text.replace(/<gap[^>]*\/>/gi, msg.answer); // handles <gap/>

    // If the gap was distinct, say `<p>...</p><gap></gap><p>...</p>`
    // The replace above might miss if gap is empty and has no content regex match?
    // The regex `/<gap[^>]*>.*?<\/gap>/` matches `<gap></gap>`.

    // Strip other HTML
    const doc = new DOMParser().parseFromString(text, 'text/html');
    return doc.body.textContent || '';
  };

  const startRecording = useCallback(() => {
    if (activeUserIndex === -1) return;
    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setTranscript('');
    setIsRecording(true);

    const currentMsg = chats[activeUserIndex];
    if (!currentMsg) return;

    const targetText = getTargetSentence(currentMsg);

    recognition.onresult = (event: { resultIndex: any; results: string | any[] }) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      }

      if (finalTranscript) {
        setTranscript(finalTranscript);
        const score = calculateScore(finalTranscript, targetText);

        // Update state
        if (score >= PASS_THRESHOLD) {
          setMessageStates((prev) => ({
            ...prev,
            [currentMsg.id]: { passed: true, score },
          }));
          // Stop success? user handles stop or auto?
          // Usually auto-stop on success.
          recognition.stop();
        }
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      // If passed, maybe auto-advance?
      // "explain... xuất hiện ngay sau khi người dùng nói" implies we stay on this state but show content.
      // User then clicks "Next"?
      // Or we just unlock "Next".
    };

    recognition.start();
  }, [activeUserIndex, chats, initRecognition]);

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  };

  const handleContinue = () => {
    // Move to next user index
    const nextUserIdx = findNextUserIndex(activeUserIndex + 1);
    if (nextUserIdx !== -1) {
      setVisibleCount(nextUserIdx + 1);
      setActiveUserIndex(nextUserIdx);
      setTranscript('');
    } else {
      // No more user messages, show all assistant messages till end
      setVisibleCount(chats.length);
      setActiveUserIndex(-1); // Finished
    }
  };

  const handleTestSkip = () => {
    if (activeUserIndex === -1) return;
    const currentMsg = chats[activeUserIndex];
    if (!currentMsg) return;

    // Simulate a passing score
    setMessageStates((prev) => ({
      ...prev,
      [currentMsg.id]: { passed: true, score: 85 },
    }));

    // Set a simulated transcript
    const simulatedText = getTargetSentence(currentMsg);
    setTranscript(simulatedText);
  };

  // Renderers
  const renderBubble = (chat: ChatMessage, index: number) => {
    const isUser = chat.role === 'user';
    const isActive = index === activeUserIndex;
    const state = messageStates[chat.id];
    const isPassed = state?.passed || false;
    const effectivelyPassed =
      isPassed || (activeUserIndex !== -1 && index < activeUserIndex) || activeUserIndex === -1;

    const toggleTranslate = () => {
      setShowTranslate((prev) => ({ ...prev, [chat.id]: !prev[chat.id] }));
    };

    const toggleIpa = () => {
      setShowIpa((prev) => ({ ...prev, [chat.id]: !prev[chat.id] }));
    };

    const handleSpeak = () => {
      if (isUser && chat.question) {
        const fullText = getTargetSentence(chat);
        speakText(fullText);
      } else if (!isUser && chat.content) {
        speakText(chat.content);
      }
    };

    return (
      <div
        key={chat.id}
        className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300`}
      >
        {/* Time display if available */}
        {chat.time && (
          <div
            className={`text-xs text-[hsl(var(--muted-foreground))] mb-0.5 ${isUser ? 'text-right' : 'text-left'}`}
          >
            {chat.time}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed relative ${
            isUser
              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-br-none'
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-none'
          }`}
        >
          {isUser ? (
            <div>
              <RichTextParser
                content={chat.question || ''}
                onGapFound={() => {
                  const answerLength = chat.answer?.length || 5;
                  const underscores = '_'.repeat(answerLength);
                  return (
                    <span
                      className={`inline-block mx-1 font-bold tracking-widest ${
                        effectivelyPassed
                          ? 'text-[hsl(var(--primary-foreground))]'
                          : 'text-[hsl(var(--primary-foreground))] opacity-70'
                      }`}
                    >
                      {effectivelyPassed ? chat.answer : underscores}
                    </span>
                  );
                }}
              />
            </div>
          ) : (
            <div>{chat.content}</div>
          )}
        </div>

        {/* Icon buttons below bubble */}
        {(chat.translate || chat.ipa || (isUser && chat.question)) && (
          <div className="flex items-center gap-2">
            {/* TTS Button */}
            {((isUser && chat.question) || (!isUser && chat.content)) && (
              <button
                onClick={handleSpeak}
                className="p-1 hover:bg-[hsl(var(--muted))] rounded transition-colors"
                title="Play audio"
              >
                <Volume2 size={14} className="text-[hsl(var(--muted-foreground))]" />
              </button>
            )}

            {/* Translate Toggle */}
            {chat.translate && (
              <button
                onClick={toggleTranslate}
                className={`p-1 hover:bg-[hsl(var(--muted))] rounded transition-colors ${
                  showTranslate[chat.id] ? 'bg-[hsl(var(--muted))]' : ''
                }`}
                title="Toggle translation"
              >
                <Languages size={14} className="text-[hsl(var(--muted-foreground))]" />
              </button>
            )}

            {/* IPA Toggle - only for user & when passed */}
            {isUser && chat.ipa && effectivelyPassed && (
              <button
                onClick={toggleIpa}
                className={`p-1 hover:bg-[hsl(var(--muted))] rounded transition-colors ${
                  showIpa[chat.id] ? 'bg-[hsl(var(--muted))]' : ''
                }`}
                title="Toggle IPA"
              >
                <Ear size={14} className="text-[hsl(var(--muted-foreground))]" />
              </button>
            )}
          </div>
        )}

        {/* Conditionally shown content */}
        <div
          className={`flex flex-col gap-1 max-w-[80%] ${isUser ? 'items-end text-right' : 'items-start text-left'}`}
        >
          {/* Translation - toggleable */}
          {chat.translate && showTranslate[chat.id] && (
            <div className="text-xs text-[hsl(var(--muted-foreground))] italic px-2 py-1 bg-[hsl(var(--muted))/30] rounded">
              <RichTextParser content={chat.translate} />
            </div>
          )}

          {/* IPA - toggleable, only for user when passed */}
          {isUser && chat.ipa && effectivelyPassed && showIpa[chat.id] && (
            <div className="text-xs font-mono text-[hsl(var(--primary))] px-2 py-1 bg-[hsl(var(--muted))/30] rounded">
              {chat.ipa}
            </div>
          )}

          {/* Explain - always show when passed */}
          {isUser && chat.explain && effectivelyPassed && (
            <div className="text-xs text-[hsl(var(--muted-foreground))] flex items-start gap-1 px-2 py-1 bg-[hsl(var(--muted))/30] rounded mt-1">
              <RichTextParser content={chat.explain} />
            </div>
          )}

          {/* Transcript for active turn */}
          {isActive && transcript && (
            <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1 italic">
              "{transcript}"
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden relative">
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden pb-32"
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

      {/* Controls */}
      {/* Test Skip Button (Emulator only) */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={handleTestSkip}
          className="p-2 rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted))]/80 transition-colors"
          title="Simulate user response (test mode)"
        >
          <StepForward size={20} className="text-[hsl(var(--foreground))]" />
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-4 z-10 pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          {/* Mic Button - Only if active user turn exists */}
          {activeUserIndex !== -1 && (
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                  : 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          )}

          {/* Continue Button - If passed current active user turn */}
          {activeUserIndex !== -1 && messageStates[chats[activeUserIndex]?.id]?.passed && (
            <button
              onClick={handleContinue}
              className="h-12 px-5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-sm font-bold hover:opacity-90 flex items-center gap-2 transition-all active:scale-95 shadow-md animate-in zoom-in duration-300"
            >
              Continue
              <ChevronRight size={18} />
            </button>
          )}

          {/* Finish State */}
          {activeUserIndex === -1 && visibleCount > 0 && (
            <div className="bg-green-500 text-white px-5 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
              <Check size={18} />
              Completed!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
