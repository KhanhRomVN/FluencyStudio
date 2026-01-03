import { useParams } from 'react-router-dom';
import { useState } from 'react';

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [activeLesson, setActiveLesson] = useState<string>('Lesson 1');

  // 4 panel split layout
  return (
    <div className="h-screen flex flex-col">
      <div className="border-b p-4">
        <h1 className="text-2xl font-bold">Course: {courseId}</h1>
        <p className="text-muted-foreground">Manage your course content and lessons</p>
      </div>

      <div className="flex-1 flex">
        {/* Panel 1: Lessons List */}
        <div className="w-64 border-r p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Lessons</h2>
          <div className="space-y-2">
            {['Lesson 1', 'Lesson 2', 'Lesson 3', 'Lesson 4'].map((lesson) => (
              <div
                key={lesson}
                className={`p-3 rounded cursor-pointer ${activeLesson === lesson ? 'bg-accent' : 'hover:bg-muted'}`}
                onClick={() => setActiveLesson(lesson)}
              >
                {lesson}
              </div>
            ))}
          </div>
        </div>

        {/* Panel 2: Main Content */}
        <div className="flex-1 p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Content</h2>
          <div className="border rounded-lg p-4 h-full">
            <p>Main content area for {activeLesson}</p>
            <p className="mt-4">
              This is where the lesson content, audio, video, or text will be displayed.
            </p>
          </div>
        </div>

        {/* Panel 3: Resources */}
        <div className="w-80 border-r p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Resources</h2>
          <div className="space-y-3">
            <div className="border rounded p-3">
              <h3 className="font-medium">Audio Files</h3>
              <p className="text-sm text-muted-foreground">MP3 files for listening practice</p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-medium">Images</h3>
              <p className="text-sm text-muted-foreground">Visual materials and diagrams</p>
            </div>
            <div className="border rounded p-3">
              <h3 className="font-medium">Videos</h3>
              <p className="text-sm text-muted-foreground">Video lessons and explanations</p>
            </div>
          </div>
        </div>

        {/* Panel 4: Notes & Controls */}
        <div className="w-96 p-4 overflow-auto">
          <h2 className="font-semibold mb-3">Notes & Controls</h2>
          <div className="space-y-4">
            <div className="border rounded p-3">
              <h3 className="font-medium mb-2">Take Notes</h3>
              <textarea
                className="w-full h-32 border rounded p-2 text-sm"
                placeholder="Write your notes here..."
              />
            </div>
            <div className="border rounded p-3">
              <h3 className="font-medium mb-2">Lesson Controls</h3>
              <div className="space-y-2">
                <button className="w-full bg-primary text-primary-foreground py-2 rounded">
                  Play Audio
                </button>
                <button className="w-full bg-secondary text-secondary-foreground py-2 rounded">
                  Show Transcript
                </button>
                <button className="w-full bg-accent text-accent-foreground py-2 rounded">
                  Mark as Completed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
