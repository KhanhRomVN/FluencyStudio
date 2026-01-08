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
  FileSearch,
  BookOpenText,
  AudioLines,
  ArrowLeft,
  Download,
} from 'lucide-react';
import { FilePreviewPanel } from './components/FilePreviewPanel';
import { CodeBlock } from '../../components/CodeBlock';
import { EmulatorFrame } from './components/emulator/EmulatorFrame';
import { CourseDetailScreen } from './components/emulator/screens/CourseDetailScreen';
import { QuizPage } from './components/emulator/screens/Quiz';
import { TranscriptDrawer } from './components/TranscriptDrawer';
import { folderService } from '../../shared/services/folderService';
import { EmulatorEditProvider, useEmulatorEdit } from './components/emulator/EmulatorEditContext';

const STORAGE_KEY = 'fluency_course_paths';

type SelectionType = 'course' | 'lesson' | 'quiz';

interface SelectionState {
  type: SelectionType;
  data: any; // Data used for the Emulator (specific item)
  sourceData?: any; // Data used for the Source Code Preview (file context)
  id: string;
  parentData?: any; // To store parent lesson when a quiz is selected, or parent context
}

const CoursePageContent = () => {
  const { activeElementContent } = useEmulatorEdit();
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
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [filePreviewWidth, setFilePreviewWidth] = useState(384); // Default 384px (w-96)
  const [committedWidth, setCommittedWidth] = useState(384); // Width after resize ends
  const widthRef = useRef(384); // Track live width for event handlers
  const [isResizing, setIsResizing] = useState(false);

  // State for Source Code Preview switching (quiz -> passage/transcript)
  const [sourceViewMode, setSourceViewMode] = useState<'quiz' | 'passage' | 'transcript'>('quiz');
  const [linkedSourceData, setLinkedSourceData] = useState<any>(null);
  const [linkedSourcePath, setLinkedSourcePath] = useState<string>('');

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      // Calculate new width: Mouse X - Sidebar Width (roughly)
      // A more robust way: FilePreview Right Edge - Mouse X? No, it's Left Edge + Width
      // Let's use simple delta. But we need to know where we started.
      // Better approach: Since Sidebar is fixed breadth, we can calculate based on page coord.
      // Sidebar is 320px (w-80) constant.
      // FilePreview starts at 320px.
      // So Width = MouseX - 320.

      const newWidth = e.clientX - 320;

      // Min width 250, Max width 800
      if (newWidth > 250 && newWidth < 800) {
        setFilePreviewWidth(newWidth);
        widthRef.current = newWidth;
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setCommittedWidth(widthRef.current); // Commit the final width
      document.body.style.cursor = 'default';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isResizing]);

  // State for course path
  const [coursePath, setCoursePath] = useState<string | null>(null);

  // Find course path from ID
  useEffect(() => {
    if (!courseId) return;
    try {
      const storedPaths = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      let foundPath = '';
      for (const path of storedPaths) {
        const folderName = path.split('/').pop() || '';
        const id = folderName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        if (id === courseId) {
          foundPath = path;
          break;
        }
      }
      if (foundPath) {
        setCoursePath(foundPath);
      } else {
        console.error('Course path not found for ID:', courseId);
        setLoading(false);
      }
    } catch (e) {
      console.error('Error finding course path:', e);
      setLoading(false);
    }
  }, [courseId]);

  // Reset source view mode when selection changes
  useEffect(() => {
    setSourceViewMode('quiz');
    setLinkedSourceData(null);
    setLinkedSourcePath('');
  }, [selection.id]);

  // Watch linked source file for changes
  useEffect(() => {
    if (!linkedSourcePath) return;

    const handleFileChange = async () => {
      console.log('[CoursePage] Linked source file changed, reloading...', linkedSourcePath);
      try {
        const data = await folderService.parseCourseMetadata(linkedSourcePath);
        if (data) {
          setLinkedSourceData(data);
        }
      } catch (error) {
        console.error('Error reloading linked source:', error);
      }
    };

    console.log('[CoursePage] Watching linked source file:', linkedSourcePath);
    folderService.watchFile(linkedSourcePath, handleFileChange);

    return () => {
      folderService.unwatchFile(linkedSourcePath, handleFileChange);
    };
  }, [linkedSourcePath]);

  // Load linked source (passage/transcript) data
  const loadLinkedSource = async (relativePath: string, type: 'passage' | 'transcript') => {
    if (!relativePath || !selection.parentData?._filePath) return;

    try {
      // Resolve relative path from the lesson file location
      const lessonDir = selection.parentData._filePath.substring(
        0,
        selection.parentData._filePath.lastIndexOf('/'),
      );
      const absolutePath = `${lessonDir}/${relativePath.replace('./', '')}`;

      // Load the JSON file
      const data = await folderService.parseCourseMetadata(absolutePath);
      if (data) {
        setLinkedSourceData(data);
        setLinkedSourcePath(absolutePath);
        setSourceViewMode(type);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
    }
  };

  // Handle linked source data update (save)
  const handleLinkedSourceChange = (newCode: string) => {
    try {
      const parsed = JSON.parse(newCode);
      setLinkedSourceData(parsed);

      // Debounced save
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        if (linkedSourcePath) {
          const result = await folderService.saveFile(
            linkedSourcePath,
            JSON.stringify(parsed, null, 2),
          );
          if (!result.success) {
            console.error('Failed to save linked source:', result.error);
          } else {
            console.log('Linked source saved:', linkedSourcePath);
          }
        }
      }, 1000);
    } catch (e) {
      // Invalid JSON
    }
  };

  // Load course data and watch for changes
  useEffect(() => {
    if (!coursePath) return;

    const load = async (isRefresh = false) => {
      if (!isRefresh) setLoading(true); // Only show loading spinner on initial load
      try {
        const courseData = await folderService.loadCourseFromPath(coursePath);
        if (courseData) {
          setCourse(courseData);

          // Update selection with new data
          setSelection((prev) => {
            // If just initializing, set default
            if (prev.id === 'course-root' && !prev.data) {
              return {
                type: 'course',
                data: courseData,
                sourceData: courseData,
                id: 'course-root',
              };
            }

            // Otherwise try to maintain selection with fresh data
            let newData = prev.data;
            let newSourceData = prev.sourceData;
            let newParentData = prev.parentData;

            if (prev.type === 'course') {
              newData = courseData;
              newSourceData = courseData;
            } else if (prev.type === 'lesson') {
              let foundLesson = courseData.lessons?.find((l: any) => l.id === prev.id);

              // Fallback: Try index if ID match failed
              if (!foundLesson && courseData.lessons && prev.data) {
                // Try to find index in previous course data if possible, or assume stable order?
                // We don't have easy access to old course data here.
                // But we can guess the index from the lessons list if we had it.
                // Actually, we can rely on the fact that if ID changed, the user probably edited the *current* file.
                // Let's rely on finding by index if we can determine it.
                // We can't determine old index easily without scanning old `course` state, but we are inside setSelection updater.
                // Hack: we can try to find a lesson with same title? Or just grab the first one if only 1?
                // Better: Pass the old course state into this logic?
                // Actually, let's use the `course` state from the outer scope!
                // `course` (state) is still the OLD course at this exact moment of execution (synchronous setSelection call inside async load).
                // Wait, `setCourse` was called just before. React state might not be updated yet in closure?
                // NO. `setCourse` schedules update. `course` variable in this specific render cycle is still the OLD course.
                // So we CAN use `course` to find the old index.

                const oldIndex = course?.lessons?.findIndex((l: any) => l.id === prev.id);
                if (oldIndex !== undefined && oldIndex !== -1) {
                  foundLesson = courseData.lessons[oldIndex];
                }
              }

              if (foundLesson) {
                newData = foundLesson;
                newSourceData = foundLesson;
              }
            } else if (prev.type === 'quiz') {
              const parentId = prev.parentData?.id;
              // We need to find the NEW parent lesson.
              // If parent lesson ID changed, we have a bigger problem (cascading ID change).
              // Let's assume parent lesson ID is stable for now, or apply similar fallback.
              let foundLesson = courseData.lessons?.find((l: any) => l.id === parentId);

              if (!foundLesson && course?.lessons) {
                // Fallback for Lesson ID change
                const oldLessonIndex = course.lessons.findIndex((l: any) => l.id === parentId);
                if (oldLessonIndex !== -1) {
                  foundLesson = courseData.lessons[oldLessonIndex];
                }
              }

              if (foundLesson && foundLesson.quiz) {
                let foundQuiz = foundLesson.quiz.find((q: any) => q.id === prev.id);

                // Fallback: Try index
                if (!foundQuiz && prev.parentData?.quiz) {
                  const oldQuizIndex = prev.parentData.quiz.findIndex((q: any) => q.id === prev.id);
                  if (oldQuizIndex !== -1 && foundLesson.quiz[oldQuizIndex]) {
                    foundQuiz = foundLesson.quiz[oldQuizIndex];
                  }
                }

                if (foundQuiz) {
                  newData = { ...foundQuiz, _lessonTitle: foundLesson.title };
                  newSourceData = foundQuiz;
                  newParentData = foundLesson;
                }
              }
            }

            return {
              ...prev,
              data: newData,
              sourceData: newSourceData,
              parentData: newParentData,
            };
          });
        }
      } catch (e) {
        console.error('Error loading course:', e);
      } finally {
        if (!isRefresh) setLoading(false);
      }
    };

    // Initial load
    load();

    // Setup watcher
    const handleFileChange = (path: string, event: string) => {
      console.log(`[Watcher] File ${event}: ${path}`);
      load(true);
    };

    folderService.watchFile(coursePath, handleFileChange);

    return () => {
      folderService.unwatchFile(coursePath, handleFileChange);
    };
  }, [coursePath]);

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

  const handleDataUpdate = (parsed: any) => {
    // 1. Update Course State (In-Memory Consistency)
    setCourse((prevCourse: any) => {
      if (!prevCourse) return prevCourse;
      const newCourse = { ...prevCourse };

      if (selection.type === 'course') {
        return { ...parsed, _filePath: prevCourse._filePath };
      } else if (selection.type === 'lesson') {
        if (newCourse.lessons) {
          newCourse.lessons = newCourse.lessons.map((l: any) =>
            l.id === selection.id ? { ...parsed, _filePath: l._filePath } : l,
          );
        }
      } else if (selection.type === 'quiz') {
        const parentLessonId = selection.parentData?.id;
        if (parentLessonId && newCourse.lessons) {
          newCourse.lessons = newCourse.lessons.map((l: any) => {
            if (l.id === parentLessonId) {
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
        contentToSave = JSON.stringify(parsed, null, 2);
      } else if (selection.type === 'lesson') {
        filePathToSave = selection.data._filePath;
        contentToSave = JSON.stringify(parsed, null, 2);
      } else if (selection.type === 'quiz') {
        const parentLesson = selection.parentData;
        if (parentLesson && parentLesson._filePath) {
          filePathToSave = parentLesson._filePath;
          const updatedLesson = { ...parentLesson };
          if (updatedLesson.quiz) {
            updatedLesson.quiz = updatedLesson.quiz.map((q: any) =>
              q.id === selection.id ? parsed : q,
            );
          }
          contentToSave = JSON.stringify(updatedLesson, null, 2);
        }
      }

      if (filePathToSave && contentToSave) {
        console.log('Autosaving file:', filePathToSave);
        const result = await folderService.saveFile(filePathToSave, contentToSave);
        if (!result.success) {
          console.error('Autosave failed:', result.error);
        } else {
          console.log('Autosave success');
        }
      }
    }, 1000);

    // 3. Update Local Selection State (UI)
    setSelection((prev) => {
      if (prev.type === 'quiz') {
        const updatedParent = prev.parentData ? { ...prev.parentData } : {};
        if (updatedParent.quiz) {
          updatedParent.quiz = updatedParent.quiz.map((q: any) => (q.id === prev.id ? parsed : q));
        }
        return {
          ...prev,
          sourceData: parsed,
          data: { ...parsed, _lessonTitle: prev.data._lessonTitle },
          parentData: updatedParent,
        };
      }
      return {
        ...prev,
        sourceData: parsed,
        data: { ...parsed, _filePath: prev.data._filePath },
      };
    });
  };

  const handleCodeChange = (newCode: string) => {
    try {
      const parsed = JSON.parse(newCode);
      handleDataUpdate(parsed);
    } catch (e) {
      // Invalid JSON
    }
  };

  const handleExportCourse = async () => {
    if (!course || !coursePath) return;

    try {
      const defaultFileName = `${course.title.replace(/[^a-z0-9]/gi, '_')}.zip`;
      const result = await folderService.showSaveDialog({
        title: 'Export Course',
        defaultPath: defaultFileName,
        filters: [{ name: 'ZIP Files', extensions: ['zip'] }],
      });

      if (!result.canceled && result.filePath) {
        const exportResult = await folderService.exportCourseToZip(coursePath, result.filePath);
        if (exportResult.success) {
          console.log('Course exported successfully to:', result.filePath);
        } else {
          console.error('Export failed:', exportResult.error);
        }
      }
    } catch (error) {
      console.error('Error exporting course:', error);
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
            onQuizUpdate={handleDataUpdate}
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFilePreviewOpen(!isFilePreviewOpen)}
            className={`p-2 rounded-md transition-colors relative ${
              isFilePreviewOpen
                ? 'bg-muted text-primary'
                : course.bookUrl
                  ? 'text-green-500 hover:bg-muted hover:text-green-600'
                  : 'text-muted-foreground hover:bg-muted hover:text-primary'
            }`}
            title={
              course.bookUrl ? `Toggle File Preview (${course.bookUrl})` : 'Toggle File Preview'
            }
          >
            <FileSearch size={20} />
            {course.bookUrl && !isFilePreviewOpen && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>
          <button
            onClick={handleExportCourse}
            className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
            title="Export Course to ZIP"
          >
            <Download size={20} />
          </button>
          <button
            onClick={() => setIsTranscriptDrawerOpen(true)}
            className="p-2 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-primary"
            title="Open Transcript Processor"
          >
            <AudioWaveform size={20} />
          </button>
        </div>
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
                                className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm ${selection.id === quiz.id && selection.parentData?.id === lesson.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuizClick(quiz, lesson);
                                }}
                              >
                                <CheckCircle
                                  size={14}
                                  className={
                                    selection.id === quiz.id &&
                                    selection.parentData?.id === lesson.id
                                      ? 'opacity-100'
                                      : 'opacity-70'
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

        {/* FILE PREVIEW PANEL */}
        {isFilePreviewOpen && (
          <div className="flex bg-background relative shrink-0" style={{ width: filePreviewWidth }}>
            <FilePreviewPanel
              width={committedWidth}
              bookUrl={course.bookUrl}
              coursePath={coursePath || undefined}
              targetPage={selection.type === 'quiz' ? selection.data?.page : undefined}
            />
            {/* Resizer Handle */}
            <div
              className="w-1 cursor-col-resize hover:bg-primary active:bg-primary transition-colors flex items-center justify-center bg-transparent relative z-10 -ml-0.5"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
            />
          </div>
        )}

        {/* CODE BLOCK AREA */}
        <div className="flex-1 flex flex-col min-w-0 border-r">
          <div className="h-10 border-b flex items-center px-4 bg-muted/20 justify-between">
            <div className="flex items-center gap-2">
              {sourceViewMode !== 'quiz' && (
                <button
                  onClick={() => {
                    setSourceViewMode('quiz');
                    setLinkedSourceData(null);
                    setLinkedSourcePath('');
                  }}
                  className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                  title="Back to Quiz"
                >
                  <ArrowLeft size={14} />
                </button>
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {sourceViewMode === 'quiz' && 'Source Code Preview'}
                {sourceViewMode === 'passage' && 'Passage Editor'}
                {sourceViewMode === 'transcript' && 'Transcript Editor'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Switch buttons - only show for quiz type with passage/transcript */}
              {selection.type === 'quiz' && sourceViewMode === 'quiz' && (
                <>
                  {selection.sourceData?.passage && (
                    <button
                      onClick={() => loadLinkedSource(selection.sourceData.passage, 'passage')}
                      className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary flex items-center gap-1"
                      title="Edit Passage"
                    >
                      <BookOpenText size={14} />
                      <span className="text-xs">Passage</span>
                    </button>
                  )}
                  {selection.sourceData?.transcript && (
                    <button
                      onClick={() =>
                        loadLinkedSource(selection.sourceData.transcript, 'transcript')
                      }
                      className="p-1.5 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-primary flex items-center gap-1"
                      title="Edit Transcript"
                    >
                      <AudioLines size={14} />
                      <span className="text-xs">Transcript</span>
                    </button>
                  )}
                </>
              )}
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                JSON
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <CodeBlock
              key={
                sourceViewMode === 'quiz' ? `quiz-${selection.id}` : `linked-${linkedSourcePath}`
              }
              code={
                sourceViewMode === 'quiz'
                  ? JSON.stringify(selection.sourceData || selection.data, null, 2)
                  : JSON.stringify(linkedSourceData, null, 2)
              }
              language="json"
              themeConfig={{ background: '#1e1e1e10' }}
              readOnly={false}
              onChange={sourceViewMode === 'quiz' ? handleCodeChange : handleLinkedSourceChange}
              highlightText={activeElementContent}
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

const CoursePage = () => {
  return (
    <EmulatorEditProvider>
      <CoursePageContent />
    </EmulatorEditProvider>
  );
};

export default CoursePage;
