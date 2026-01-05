import React, { useState, useEffect, useMemo } from 'react';
import { Mic, CheckCircle2, ChevronRight, MicOff } from 'lucide-react';
import { Quiz, QuizQuestion } from '../../types';
import { RichTextParser } from '../RichTextParser';
import { WritingHintDrawer } from '../WritingHintDrawer';

interface SpeakingProps {
  quiz: Quiz;
  onUpdate?: (updatedQuiz: Quiz) => void;
  header?: React.ReactNode;
}

export const Speaking: React.FC<SpeakingProps> = ({ quiz, header }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [stepSubmitted, setStepSubmitted] = useState<Record<number, boolean>>({});

  const [isRecording, setIsRecording] = useState(false);
  const [showHintDrawer, setShowHintDrawer] = useState(false);
  const [currentHint, setCurrentHint] = useState<string>('');

  // Reset state when quiz changes
  useEffect(() => {
    setActiveIndex(0);
    setAnswers({});
    setStepSubmitted({});
    setIsRecording(false);
    setShowHintDrawer(false);
    setCurrentHint('');
  }, [quiz.id]);

  // Normalize questions: if quiz.questions exists, use it; otherwise wrap quiz itself (Part 2 style)
  const questions: (QuizQuestion | Quiz)[] = useMemo(() => {
    if (quiz.questions && quiz.questions.length > 0) return quiz.questions;
    return [quiz];
  }, [quiz]);

  const currentQuestion = questions[activeIndex];
  const totalQuestions = questions.length;

  const currentAnswer = answers[activeIndex] || '';
  const isCurrentSubmitted = stepSubmitted[activeIndex] || false;
  const hasNext = activeIndex < totalQuestions - 1;

  const handleHintClick = (hint: string) => {
    setCurrentHint(hint);
    setShowHintDrawer(true);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  const handleTextChange = (val: string) => {
    setAnswers((prev) => ({ ...prev, [activeIndex]: val }));
  };

  const handleSubmitStep = () => {
    setStepSubmitted((prev) => ({ ...prev, [activeIndex]: true }));
    setIsRecording(false); // Stop recording on submit
  };

  const handleNext = () => {
    setActiveIndex((prev) => prev + 1);
    setIsRecording(false);
  };

  const handleFinish = () => {
    // Final completion logic if needed
    console.log('Quiz finished', answers);
  };

  // Helper to safely get example content
  const getExample = (q: any) => q.example;

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] overflow-hidden relative">
      <div className="flex-1 overflow-y-auto p-4 [&::-webkit-scrollbar]:hidden pb-32">
        {header}

        {quiz.instruction && questions.length > 1 && (
          <div className="mb-6 text-[hsl(var(--foreground))]">
            <RichTextParser content={quiz.instruction} onHintClick={handleHintClick} />
          </div>
        )}

        <div
          className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
          key={activeIndex}
        >
          {/* Question Display */}
          <div className="w-full">
            {/* Type guard/check for properties */}
            {'topic' in currentQuestion && currentQuestion.topic && (
              <div className="text-sm font-bold text-[hsl(var(--primary))] mb-2 uppercase tracking-wider">
                {currentQuestion.topic}
              </div>
            )}

            {currentQuestion.question && (
              <div className="text-base leading-relaxed text-[hsl(var(--foreground))]">
                {currentQuestion.question}
              </div>
            )}

            {/* Part 2: Instruction serves as the main question if proper question is missing */}
            {!currentQuestion.question &&
              'instruction' in currentQuestion &&
              currentQuestion.instruction && (
                <div className="text-base leading-relaxed text-[hsl(var(--foreground))]">
                  <RichTextParser
                    content={currentQuestion.instruction}
                    onHintClick={handleHintClick}
                  />
                </div>
              )}

            {'exampleQuestion' in currentQuestion && currentQuestion.exampleQuestion && (
              <ul className="list-disc list-inside space-y-2 mt-2 font-normal text-base text-[hsl(var(--muted-foreground))]">
                {currentQuestion.exampleQuestion.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Input Area */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm text-[hsl(var(--muted-foreground))] px-1">
              <span>Your Answer / Notes</span>
              {/* <span>{currentAnswer.length} chars</span> */}
            </div>
            {isCurrentSubmitted ? (
              <div className="text-[hsl(var(--foreground))] leading-relaxed text-sm whitespace-pre-wrap p-4 bg-[hsl(var(--secondary)/10)] rounded-lg italic min-h-[120px]">
                {currentAnswer}
              </div>
            ) : (
              <textarea
                className="w-full h-48 p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] resize-none focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                placeholder="Type your answer here..."
                value={currentAnswer}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={isCurrentSubmitted}
              />
            )}
          </div>

          {/* Sample Answer Section */}
          {isCurrentSubmitted && getExample(currentQuestion) && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pt-4 pb-8">
              <h3 className="font-bold text-lg mb-3 text-[hsl(var(--foreground))] flex items-center gap-2">
                <CheckCircle2 size={18} className="text-green-500" />
                Sample Answer
              </h3>
              <div className="p-4 rounded-lg bg-[hsl(var(--secondary)/30)] border border-[hsl(var(--border))] text-[hsl(var(--foreground))] leading-relaxed text-sm">
                <RichTextParser
                  content={getExample(currentQuestion) || ''}
                  onHintClick={handleHintClick}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Controls */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center pointer-events-none z-10">
        <div className="flex items-center gap-4 bg-[hsl(var(--background))/80] backdrop-blur-md p-2 rounded-full border border-[hsl(var(--border))] shadow-lg pointer-events-auto">
          {/* Mic Toggle */}
          <button
            onClick={toggleRecording}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-md ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-500/30'
                : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary)/80)]'
            }`}
          >
            {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          {/* Action Button: Submit or Next */}
          {!isCurrentSubmitted && currentAnswer.trim().length > 0 && (
            <button
              onClick={handleSubmitStep}
              className="h-14 px-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold hover:opacity-90 flex items-center gap-2 transition-all active:scale-95"
            >
              <CheckCircle2 size={20} />
              Submit
            </button>
          )}

          {isCurrentSubmitted && (
            <button
              onClick={hasNext ? handleNext : handleFinish}
              className="h-14 px-6 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-bold hover:opacity-90 flex items-center gap-2 transition-all active:scale-95"
            >
              {hasNext ? (
                <>
                  Next
                  <ChevronRight size={20} />
                </>
              ) : (
                <>
                  Finish
                  <CheckCircle2 size={20} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <WritingHintDrawer
        isOpen={showHintDrawer}
        onClose={() => setShowHintDrawer(false)}
        hintContent={currentHint}
      />
    </div>
  );
};
