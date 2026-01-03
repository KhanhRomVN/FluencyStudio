import React from 'react';

interface CoursePreviewProps {
  courseData: any; // Using any for flexibility with JSON data
}

export const CoursePreview: React.FC<CoursePreviewProps> = ({ courseData }) => {
  if (!courseData) return <div className="p-4 text-center">No Course Data</div>;

  return (
    <div className="p-4">
      {/* Simulation of Fluency_temp/lib/features/course/presentation/pages/course_detail_page.dart */}
      {courseData.imageUrl && (
        <img
          src={courseData.imageUrl}
          alt={courseData.title}
          className="w-full h-48 object-cover rounded-xl shadow-md mb-4"
        />
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{courseData.title}</h1>
      <p className="text-sm text-blue-600 font-semibold mb-4 uppercase tracking-wide">
        {courseData.publisher}
      </p>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Description</h2>
          <p className="text-gray-600 text-sm leading-relaxed mt-1">
            {courseData.fullDescription || courseData.shortDescription}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <span className="block text-xl font-bold text-blue-700">{courseData.pageCount}</span>
            <span className="text-xs text-blue-600">Pages</span>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <span className="block text-xl font-bold text-purple-700">
              {courseData.rating || '4.8'}
            </span>
            <span className="text-xs text-purple-600">Rating</span>
          </div>
        </div>

        <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg mt-6 active:scale-95 transition-transform">
          Start Learning
        </button>
      </div>
    </div>
  );
};
