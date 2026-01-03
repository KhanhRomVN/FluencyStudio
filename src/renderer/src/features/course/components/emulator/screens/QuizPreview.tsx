import React from 'react';

interface QuizPreviewProps {
  quizData: any;
  lessonTitle?: string;
}

export const QuizPreview: React.FC<QuizPreviewProps> = ({ quizData, lessonTitle }) => {
  if (!quizData) return <div className="p-4 text-center">No Quiz Data</div>;

  const isGapFill = quizData.type === 'gap-fill';
  const isMultipleChoice =
    quizData.type === 'multiple-choice' || quizData.type === 'multiple-choice-multi-select';
  const isGroup = quizData.type === 'group';

  return (
    <div className="p-4 bg-white min-h-screen">
      <div className="mb-4 pb-2 border-b border-gray-100">
        <p className="text-xs text-gray-500 font-medium uppercase">{lessonTitle || 'Quiz'}</p>
        <h2 className="text-lg font-bold text-gray-900 mt-1">{quizData.title || 'Quiz Section'}</h2>
      </div>

      {/* Instruction */}
      {quizData.instruction && (
        <div
          className="bg-yellow-50 p-3 rounded-lg mb-4 text-sm text-yellow-800 border border-yellow-100"
          dangerouslySetInnerHTML={{ __html: quizData.instruction }}
        />
      )}

      {/* Audio Player Placeholder */}
      {quizData.audio && (
        <div className="mb-6 bg-gray-100 p-3 rounded-full flex items-center justify-between">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
            ▶
          </div>
          <div className="flex-1 mx-3 h-1 bg-gray-300 rounded-full">
            <div className="w-1/3 h-full bg-blue-600 rounded-full"></div>
          </div>
          <span className="text-xs text-gray-500 font-mono">01:23</span>
        </div>
      )}

      {/* Quiz Content Simulation */}
      <div className="space-y-6">
        {/* Render based on type */}
        {(isGapFill || (isGroup && quizData.question)) && (
          <div className="prose prose-sm max-w-none text-gray-700">
            {/* Simulate Gap Fill Text */}
            <div
              dangerouslySetInnerHTML={{
                __html: (quizData.question || '')
                  .replace(/<\/gap[^>]*>/g, '______')
                  .replace(/<gap[^>]*>/g, ''),
              }}
            />
          </div>
        )}

        {/* Render Questions for Group Type */}
        {quizData.questions &&
          quizData.questions.map((q: any, idx: number) => (
            <div key={q.id || idx} className="p-3 border border-gray-200 rounded-xl shadow-sm">
              <p className="font-medium text-gray-900 mb-3 text-sm">
                <span className="text-blue-600 font-bold mr-2">{q.id?.replace('q', '')}</span>
                {q.question}
              </p>

              {q.options && (
                <div className="space-y-2">
                  {q.options.map((opt: any) => (
                    <div
                      key={opt.key}
                      className="flex items-start p-2 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-200 transition-colors"
                    >
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs mr-3 flex-shrink-0 ${opt.key === q.answer ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-500'}`}
                      >
                        {opt.key}
                      </div>
                      <span className="text-sm text-gray-700">{opt.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
      </div>

      <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg mt-8 mb-4">
        Submit Answers
      </button>
    </div>
  );
};
