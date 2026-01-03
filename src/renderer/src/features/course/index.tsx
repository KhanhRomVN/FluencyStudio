import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight, ChevronDown, BookOpen, FileText, CheckCircle, Palette } from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';
import { EmulatorFrame } from './components/emulator/EmulatorFrame';
import { CourseDetailScreen } from './components/emulator/screens/CourseDetailScreen';
import { QuizPage } from './components/emulator/screens/Quiz';
import { folderService } from '../../shared/services/folderService';

const STORAGE_KEY = 'fluency_course_paths';

type SelectionType = 'course' | 'lesson' | 'quiz';

interface SelectionState {
  type: SelectionType;
  data: any; // Data used for the Emulator (specific item)
  sourceData?: any; // Data used for the Source Code Preview (file context)
  id: string;
}

const CoursePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // State for sidebar expansion
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  // State for selection
  const [selection, setSelection] = useState<SelectionState>({
    type: 'course',
    data: null,
    id: 'course-root',
  });

  const [emulatorTheme, setEmulatorTheme] = useState<'DefaultDark' | 'SoftTeal'>('SoftTeal');

  // Load course data
  useEffect(() => {
    const loadCourseData = async () => {
      if (!courseId) return;
      setLoading(true);
      try {
        const storedPaths = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        let foundPath = '';

        // Simple ID matching logic (must match folderService creation logic)
        for (const path of storedPaths) {
          const folderName = path.split('/').pop() || '';
          const id = folderName.toLowerCase().replace(/[^a-z0-9]/g, '_');
          if (id === courseId) {
            foundPath = path;
            break;
          }
        }

        if (foundPath) {
          const courseData = await folderService.loadCourseFromPath(foundPath);
          if (courseData) {
            setCourse(courseData);
            // Initial selection
            setSelection({
              type: 'course',
              data: courseData,
              sourceData: courseData,
              id: 'course-root',
            });
          } else {
            console.error('Failed to load course data from path:', foundPath);
          }
        } else {
          console.error('Course path not found for ID:', courseId);
        }
      } catch (e) {
        console.error('Error loading course:', e);
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId]);

  const toggleLesson = (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
    }
    setExpandedLessons(newExpanded);
  };

  const handleCourseClick = () => {
    if (!course) return;
    setSelection({
      type: 'course',
      data: course,
      sourceData: course,
      id: 'course-root',
    });
  };

  const handleLessonClick = (lesson: any) => {
    toggleLesson(lesson.id);
    setSelection({
      type: 'lesson',
      data: lesson,
      sourceData: lesson,
      id: lesson.id,
    });
  };

  const handleQuizClick = (quiz: any, lesson: any) => {
    setSelection({
      type: 'quiz',
      data: { ...quiz, _lessonTitle: lesson.title },
      sourceData: quiz,
      id: quiz.id,
    });
  };

  const handleCodeChange = (newCode: string) => {
    try {
      const parsed = JSON.parse(newCode);

      setSelection((prev) => {
        // If we are editing a quiz, we need to preserve the _lessonTitle
        if (prev.type === 'quiz') {
          return {
            ...prev,
            sourceData: parsed,
            data: { ...parsed, _lessonTitle: prev.data._lessonTitle },
          };
        }

        // Default case
        return {
          ...prev,
          sourceData: parsed,
          data: parsed,
        };
      });
    } catch (e) {
      // Invalid JSON, just ignore update or maybe show error state?
      // For now, allow typing (but it won't update emulator until valid)
      // Actually, if we rely on prop update for CodeBlock value, we might block typing if we don't update state.
      // But CodeBlock is uncontrolled-ish for typing (it keeps its own model).
      // The prop `code` is only used to set value if it differs using setValue.
      // Since we only update state on valid JSON, invalid JSON usage keeps local editor state but doesn't trigger emulator update.
      // However, if we switch files, we depend on `code` prop.
    }
  };

  // Render content based on selection
  const renderEmulatorContent = () => {
    if (!selection.data) return <div className="p-4 text-center">Loading...</div>;

    switch (selection.type) {
      case 'course':
        return <CourseDetailScreen courseData={selection.data} />;
      case 'lesson':
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-500">
            <BookOpen size={48} className="mb-4 text-blue-200" />
            <h3 className="text-lg font-medium text-gray-700">{selection.data.title}</h3>
            <p className="text-sm mt-2">Select a quiz from the sidebar to preview.</p>
          </div>
        );
      case 'quiz':
        return <QuizPage quizData={selection.data} />;
      default:
        return <div>Select an item</div>;
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading course data...</div>;
  }

  if (!course) {
    return (
      <div className="h-screen flex items-center justify-center">
        Course not found. Please return to dashboard.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="h-14 border-b flex items-center px-4 bg-card">
        <h1 className="text-lg font-semibold">Course Designer: {course.title}</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* SIDEBAR */}
        <div className="w-80 border-r bg-muted/10 flex flex-col">
          <div className="p-3 font-medium text-xs uppercase text-muted-foreground tracking-wider">
            Structure
          </div>
          <div className="flex-1 overflow-y-auto p-2 pt-0">
            <div className="space-y-1">
              {/* Course Root Item */}
              <div
                className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${selection.id === 'course-root' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                onClick={handleCourseClick}
              >
                <BookOpen size={16} />
                <span className="truncate">{course.title}</span>
              </div>

              {/* Lessons List */}
              <div className="pl-4 mt-2 border-l ml-3 space-y-2">
                {course.lessons &&
                  course.lessons.map((lesson: any) => (
                    <div key={lesson.id}>
                      <div
                        className={`flex items-center gap-1 p-2 rounded-md cursor-pointer hover:bg-muted ${selection.id === lesson.id ? 'bg-accent' : ''}`}
                        onClick={() => handleLessonClick(lesson)}
                      >
                        {expandedLessons.has(lesson.id) ? (
                          <ChevronDown size={14} className="text-muted-foreground" />
                        ) : (
                          <ChevronRight size={14} className="text-muted-foreground" />
                        )}
                        <FileText size={16} className="text-blue-500" />
                        <span className="text-sm truncate">{lesson.title}</span>
                      </div>

                      {/* Quizzes List */}
                      {expandedLessons.has(lesson.id) && (
                        <div className="pl-6 mt-1 space-y-0.5">
                          {lesson.quiz &&
                            lesson.quiz.map((quiz: any) => (
                              <div
                                key={quiz.id}
                                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm ${selection.id === quiz.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuizClick(quiz, lesson);
                                }}
                              >
                                <CheckCircle
                                  size={14}
                                  className={
                                    selection.id === quiz.id ? 'opacity-100' : 'opacity-70'
                                  }
                                />
                                <span className="truncate">{quiz.title}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* CODE BLOCK AREA */}
        <div className="flex-1 flex flex-col min-w-0 border-r">
          <div className="h-10 border-b flex items-center px-4 bg-muted/20 justify-between">
            <span className="text-xs font-medium text-muted-foreground">Source Code Preview</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">JSON</span>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <CodeBlock
              code={JSON.stringify(selection.sourceData || selection.data, null, 2)}
              language="json"
              themeConfig={{ background: '#1e1e1e10' }}
              readOnly={false}
              onChange={handleCodeChange}
            />
          </div>
        </div>

        {/* MOBILE EMULATOR AREA */}
        <div className="w-[450px] border-l bg-background/20 flex flex-col items-center justify-center relative">
          <button
            onClick={() =>
              setEmulatorTheme((prev) => (prev === 'DefaultDark' ? 'SoftTeal' : 'DefaultDark'))
            }
            className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background text-muted-foreground hover:text-foreground transition-colors md:ring-1 ring-border"
            title="Toggle Emulator Theme"
          >
            <Palette size={16} />
          </button>
          <EmulatorFrame theme={emulatorTheme}>{renderEmulatorContent()}</EmulatorFrame>
        </div>
      </div>
    </div>
  );
};

export default CoursePage;
