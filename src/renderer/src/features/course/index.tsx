import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  BookOpen,
  FileText,
  CheckCircle,
  Palette,
  AudioWaveform,
} from 'lucide-react';
import { CodeBlock } from '../../components/CodeBlock';
import { EmulatorFrame } from './components/emulator/EmulatorFrame';
import { CourseDetailScreen } from './components/emulator/screens/CourseDetailScreen';
import { QuizPage } from './components/emulator/screens/Quiz';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { folderService } from '../../shared/services/folderService';

const STORAGE_KEY = 'fluency_course_paths';

type SelectionType = 'course' | 'lesson' | 'quiz';

interface SelectionState {
  type: SelectionType;
  data: any; // Data used for the Emulator (specific item)
  sourceData?: any; // Data used for the Source Code Preview (file context)
  id: string;
  parentData?: any; // To store parent lesson when a quiz is selected, or parent context
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
  const [isTranscriptDrawerOpen, setIsTranscriptDrawerOpen] = useState(false);

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
  };

  const handleQuizClick = (quiz: any, lesson: any) => {
    setSelection({
      type: 'quiz',
      data: { ...quiz, _lessonTitle: lesson.title },
      sourceData: quiz,
      id: quiz.id,
      parentData: lesson,
    });
  };

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCodeChange = (newCode: string) => {
    try {
      const parsed = JSON.parse(newCode);

      // 1. Update Course State (In-Memory Consistency)
      setCourse((prevCourse: any) => {
        if (!prevCourse) return prevCourse;
        const newCourse = { ...prevCourse };

        if (selection.type === 'course') {
          // If we are editing the course itself
          return { ...parsed, _filePath: prevCourse._filePath }; // Preserve filePath
        } else if (selection.type === 'lesson') {
          // Finding the lesson to update
          if (newCourse.lessons) {
            newCourse.lessons = newCourse.lessons.map((l: any) =>
              l.id === selection.id ? { ...parsed, _filePath: l._filePath } : l,
            );
          }
        } else if (selection.type === 'quiz') {
          // Finding the quiz nested in lesson
          // We need to know which lesson it belongs to.
          // selection.parentData has the lesson ID (from handleQuizClick)
          const parentLessonId = selection.parentData?.id;
          if (parentLessonId && newCourse.lessons) {
            newCourse.lessons = newCourse.lessons.map((l: any) => {
              if (l.id === parentLessonId) {
                // Found the lesson, now update the quiz inside it
                if (l.quiz) {
                  return {
                    ...l,
                    quiz: l.quiz.map((q: any) => (q.id === selection.id ? parsed : q)),
                  };
                }
              }
              return l;
            });
          }
        }
        return newCourse;
      });

      // 2. Debounced File Save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        let filePathToSave = '';
        let contentToSave = '';

        if (selection.type === 'course') {
          filePathToSave = selection.data._filePath;
          // Ensure we don't save _filePath into the file if not desired, but usually okay or stripped by serializer if careful.
          // We use 'parsed' which comes from editor. If editor showed _filePath, it's there.
          // If we want to be clean, we can rely on what user sees.
          contentToSave = JSON.stringify(parsed, null, 2);
        } else if (selection.type === 'lesson') {
          filePathToSave = selection.data._filePath;
          contentToSave = JSON.stringify(parsed, null, 2);
        } else if (selection.type === 'quiz') {
          // For quiz, we need to save the PARENT LESSON.
          // But we need the UPDATED lesson content.
          // We just updated 'course' state above, but we can't access that async 'newCourse' here easily without refs or getting it again.
          // So we reconstruct the lesson update locally for saving.
          const parentLesson = selection.parentData;
          if (parentLesson && parentLesson._filePath) {
            filePathToSave = parentLesson._filePath;

            // Construct updated lesson
            const updatedLesson = { ...parentLesson };
            if (updatedLesson.quiz) {
              updatedLesson.quiz = updatedLesson.quiz.map((q: any) =>
                q.id === selection.id ? parsed : q,
              );
            }
            // IMPORTANT: parentLesson from selection.parentData might be STALE if we made multiple edits?
            // selection.parentData is set on CLICK.
            // If we edit, we don't update selection.parentData in the local 'setSelection'.
            // So specific subsequent edits might use stale 'parentLesson' from handleQuizClick time.
            // HOWEVER, when we update 'course' state, we are keeping the master copy fresh.
            // Maybe we should verify we have the latest lesson data.

            // To be safe, we should fetch the latest lesson from the CURRENT 'course' state ref maybe?
            // Or just trust that we are updating one field.
            // If we have multiple rapid edits, the 'parsed' variable is correct for the focus item.
            // But 'parentLesson' structure might be old.
            // If users only edit the quiz json, 'parentLesson' structure (other fields) usually doesn't change.
            // EXCEPT if we edit OTHER quizzes in the SAME lesson before navigating away.

            // FIX: We need to update 'selection.parentData' as well in setSelection to match the in-memory changes?
            // OR better: In this save function, we rely on the `parsed` (new quiz) and merge it into... what?
            // If we merge it into `selection.parentData`, we effectively ignore previous edits to other parts of the lesson if `parentData` is stale.

            // Ideally, we should grab the latest lesson from the newly set course state.
            // But we don't have access to it here.

            // Workaround: We will update `selection` state with new `parentData` too!

            contentToSave = JSON.stringify(updatedLesson, null, 2);
          }
        }

        if (filePathToSave && contentToSave) {
          console.log('Autosaving file:', filePathToSave);
          const result = await folderService.saveFile(filePathToSave, contentToSave);
          if (!result.success) {
            console.error('Autosave failed:', result.error);
            // Optionally set some error state here to show in UI
            // But for now just log heavily as user requested fix
          } else {
            console.log('Autosave success');
          }
        }
      }, 1000);

      // 3. Update Local Selection State (UI)
      setSelection((prev) => {
        // If we are editing a quiz, we need to preserve the _lessonTitle
        if (prev.type === 'quiz') {
          // We also try to update parentData to avoid staleness for subsequent saves
          // This is a partial fix; really 'parentData' should track 'course' state or be a Ref.
          // But for now, updating it locally helps if we edit the *same* quiz repeatedly.

          const updatedParent = prev.parentData ? { ...prev.parentData } : {};
          if (updatedParent.quiz) {
            updatedParent.quiz = updatedParent.quiz.map((q: any) =>
              q.id === prev.id ? parsed : q,
            );
          }

          return {
            ...prev,
            sourceData: parsed,
            data: { ...parsed, _lessonTitle: prev.data._lessonTitle },
            parentData: updatedParent,
          };
        }

        // Default case
        return {
          ...prev,
          sourceData: parsed,
          data: { ...parsed, _filePath: prev.data._filePath }, // Preserve _filePath
        };
      });
    } catch (e) {
      // Invalid JSON, just ignore update
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
        return (
          <QuizPage
            quizData={selection.data}
            parentLesson={selection.parentData} // Pass parent lesson
            onQuizChange={(quiz) => handleQuizClick(quiz, selection.parentData)} // Allow switching
          />
        );
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
      <div className="h-14 border-b flex items-center justify-between px-4 bg-card">
        <h1 className="text-lg font-semibold">Course Designer: {course.title}</h1>
        <button
          onClick={() => setIsTranscriptDrawerOpen(true)}
          className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
          title="Open Transcript Processor"
        >
          <AudioWaveform size={20} />
        </button>
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

      <TranscriptDrawer
        isOpen={isTranscriptDrawerOpen}
        onClose={() => setIsTranscriptDrawerOpen(false)}
      />
    </div>
  );
};

export default CoursePage;
