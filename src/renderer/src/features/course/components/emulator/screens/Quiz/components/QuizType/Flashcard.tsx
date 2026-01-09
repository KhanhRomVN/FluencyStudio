import React, { useState, useEffect } from 'react';
import { Quiz } from '../../types';
import { ChevronLeft, ChevronRight, RotateCw, Volume2 } from 'lucide-react';
import { RichTextParser } from '../RichTextParser';

interface FlashcardProps {
  quiz: Quiz;
}

export const Flashcard: React.FC<FlashcardProps> = ({ quiz }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [quiz.id]);

  const cards = quiz.flashcards || [];
  const currentCard = cards[currentIndex];

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev + 1), 150); // Wait for potential flip reset anim
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex((prev) => prev - 1), 150);
    }
  };

  const playAudio = (src: string) => {
    if (isPlaying) return;
    setIsPlaying(true);
    const audio = new Audio(src);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
  };

  if (cards.length === 0) {
    return <div className="p-4 text-center">No flashcards data.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-3 [&::-webkit-scrollbar]:hidden flex flex-col">
        {quiz.instruction && (
          <div className="mb-4 text-[hsl(var(--foreground))] text-[16px] shrink-0">
            <RichTextParser content={quiz.instruction} />
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          {/* Card Container */}
          <div
            className="relative w-full max-w-sm aspect-[3/4] perspective-1000 cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}
            >
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden rounded-2xl shadow-xl bg-gradient-to-br from-[hsl(var(--primary))/20] to-[hsl(var(--primary))/5] border border-[hsl(var(--primary))/20] flex flex-col items-center justify-center p-6 text-center">
                <span className="absolute top-4 left-4 text-xs font-bold text-[hsl(var(--primary))] uppercase tracking-widest">
                  Front
                </span>

                {currentCard.image && (
                  <img
                    src={currentCard.image}
                    alt="Flashcard visual"
                    className="w-32 h-32 object-contain mb-4 rounded-lg bg-white/50"
                  />
                )}

                <h3 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-2">
                  {currentCard.front}
                </h3>

                {currentCard.frontAudio && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentCard.frontAudio!);
                    }}
                    className="mt-4 p-3 rounded-full bg-[hsl(var(--primary))] text-white hover:opacity-90 transition-transform active:scale-95"
                  >
                    <Volume2 size={24} />
                  </button>
                )}

                <div className="absolute bottom-4 text-[hsl(var(--muted-foreground))] text-[16px] flex items-center gap-1 opacity-60">
                  <RotateCw size={14} /> Click to flip
                </div>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl shadow-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-col items-center justify-center p-6 text-center">
                <span className="absolute top-4 left-4 text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-widest">
                  Back
                </span>

                <p className="text-xl text-[hsl(var(--foreground))] mb-4">{currentCard.back}</p>

                {currentCard.backAudio && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playAudio(currentCard.backAudio!);
                    }}
                    className="mt-2 p-3 rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))/80] transition-transform active:scale-95"
                  >
                    <Volume2 size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-[hsl(var(--border))] bg-[hsl(var(--background))] flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="p-3 rounded-xl bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[hsl(var(--secondary))/80] transition-colors"
        >
          <ChevronLeft size={24} />
        </button>

        <div className="text-[16px] font-bold text-[hsl(var(--muted-foreground))]">
          {currentIndex + 1} / {cards.length}
        </div>

        <button
          onClick={handleNext}
          disabled={currentIndex === cards.length - 1}
          className="p-3 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-colors"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <style>{`
          .perspective-1000 { perspective: 1000px; }
          .transform-style-3d { transform-style: preserve-3d; }
          .backface-hidden { backface-visibility: hidden; }
          .rotate-y-180 { transform: rotateY(180deg); }
       `}</style>
    </div>
  );
};
