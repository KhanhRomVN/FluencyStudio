import React, { useState, useEffect, useRef } from 'react';
import { Quiz, DictationItem } from '../../types';
import { Play, Pause, Check } from 'lucide-react';
import { RichTextParser } from '../RichTextParser';

interface DictationProps {
  quiz: Quiz;
  isChecked?: boolean;
  onCheck?: () => void;
}

export const Dictation: React.FC<DictationProps> = ({ quiz, isChecked = false, onCheck }) => {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [playingId, setPlayingId] = useState<string | null>(null);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  useEffect(() => {
    // Initialize inputs based on quiz.dictations logic if needed
  }, [quiz.id]);

  const dictationItems = quiz.dictations || [];

  const handlePlay = (item: DictationItem) => {
    // Stop others
    if (playingId) {
      if (audioRefs.current[playingId]) {
        audioRefs.current[playingId].pause();
        audioRefs.current[playingId].currentTime = 0;
      }
      window.speechSynthesis.cancel();
      setPlayingId(null);
    }

    if (playingId === item.id) {
      // Just stopping (already handled above)
      return;
    }

    setPlayingId(item.id);

    if (item.audio) {
      // Audio Mode
      const audio = new Audio(item.audio);
      audioRefs.current[item.id] = audio;

      audio.onended = () => setPlayingId(null);
      audio.onpause = () => setPlayingId(null);

      // No speed support for MP3 as per requirement
      audio.play().catch((e) => {
        console.error('Audio play failed', e);
        setPlayingId(null);
      });
    } else if (item.text) {
      // TTS Mode
      const utterance = new SpeechSynthesisUtterance(item.text);
      if (item.speed) utterance.rate = item.speed;

      utterance.onend = () => setPlayingId(null);
      utterance.onerror = () => setPlayingId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  const handleInputChange = (id: string, val: string) => {
    if (isChecked) return;
    setInputs((prev) => ({ ...prev, [id]: val }));
  };

  const checkAnswer = (item: DictationItem) => {
    const userVal = (inputs[item.id] || '').trim().toLowerCase();
    // Determine source text: transcript for audio mode, text for TTS mode
    const correctVal = (item.audio ? item.transcript : item.text) || '';

    // Remove punctuation for easier matching
    const userClean = userVal.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();
    const correctClean = correctVal
      .toLowerCase()
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .trim();

    return userClean === correctClean;
  };

  // Determine if we can check (all filled?)
  const allFilled =
    dictationItems.length > 0 &&
    dictationItems.every((d) => (inputs[d.id] || '').trim().length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden">
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px]">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        <div className="space-y-8 pb-8">
          {dictationItems.map((item, index) => {
            const isCorrect = isChecked && checkAnswer(item);
            const correctText = item.audio ? item.transcript : item.text;

            return (
              <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-4 mb-2">
                  <button
                    onClick={() => handlePlay(item)}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-md
                      ${
                        playingId === item.id
                          ? 'bg-[hsl(var(--primary))] text-white scale-110'
                          : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))/80]'
                      }
                    `}
                  >
                    {playingId === item.id ? (
                      <Pause size={20} fill="currentColor" />
                    ) : (
                      <Play size={20} fill="currentColor" className="ml-1" />
                    )}
                  </button>

                  <div className="flex-1">
                    <p className="text-[16px] font-bold text-[hsl(var(--muted-foreground))] mb-1">
                      Sentence {index + 1}
                      {!item.audio && item.speed && (
                        <span className="ml-2 text-xs font-normal opacity-70">
                          (Speed: {item.speed}x)
                        </span>
                      )}
                    </p>
                    <textarea
                      value={inputs[item.id] || ''}
                      onChange={(e) => handleInputChange(item.id, e.target.value)}
                      disabled={isChecked}
                      placeholder="Type what you hear..."
                      className={`
                        w-full p-3 rounded-xl border-2 bg-[hsl(var(--card))] resize-none transition-all text-[16px]
                        ${
                          isChecked
                            ? isCorrect
                              ? 'border-green-500 bg-green-500/10 text-green-700'
                              : 'border-red-500 bg-red-500/10 text-red-700'
                            : 'border-[hsl(var(--border))] focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-[hsl(var(--primary))/10]'
                        }
                      `}
                      rows={2}
                    />

                    {isChecked && !isCorrect && (
                      <div className="mt-2 p-3 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] text-sm">
                        <span className="font-bold text-green-600 block mb-1">Correct answer:</span>
                        <span className="text-[hsl(var(--foreground))]">{correctText}</span>
                      </div>
                    )}

                    {item.translate && (isChecked || false) && (
                      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] italic">
                        {item.translate}
                      </p>
                    )}
                  </div>
                </div>
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
