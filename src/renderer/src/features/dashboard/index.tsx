import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types/course';
import { folderService } from '../../shared/services/folderService';
import { debugWindowAPI } from '@shared/utils/debugAPI';
import { FolderOpen, Plus, Trash2, AlertCircle, RefreshCw, X } from 'lucide-react';

const STORAGE_KEY = 'fluency_course_paths';

const Dashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  // Base path is less relevant if we pick absolute paths, but keeping for display if passed down
  const [baseCoursesPath] = useState<string>('/home/user/Courses');

  // Load courses on component mount
  useEffect(() => {
    // Debug APIs on mount
    debugWindowAPI();
    loadCourses();
  }, []);

  // Function to load courses from persistence
  const loadCourses = async () => {
    try {
      const storedPaths = localStorage.getItem(STORAGE_KEY);
      if (storedPaths) {
        setIsValidating(true);
        const paths: string[] = JSON.parse(storedPaths);
        const loadedCourses: Course[] = [];

        // Load each course path safely
        for (const path of paths) {
          const course = await folderService.createCourseFromFolder(path);
          if (course) {
            loadedCourses.push(course);
          } else {
            const exists = await folderService.checkFolderExists(path);
            if (exists) {
              const validCourse = await folderService.createCourseFromFolder(path);
              if (validCourse) loadedCourses.push(validCourse);
            } else {
              loadedCourses.push({
                id: path,
                name: path.split('/').pop() || 'Unknown',
                folderPath: path,
                description: 'Folder missing',
                lessonCount: 0,
                isValid: false,
              });
            }
          }
        }
        setCourses(loadedCourses);
        setIsValidating(false);
      } else {
        setCourses([]);
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setIsValidating(false);
    }
  };

  // Function to save current course paths to storage
  const saveToStorage = (currentCourses: Course[]) => {
    const paths = currentCourses.map((c) => c.folderPath);
    // Remove duplicates just in case
    const uniquePaths = Array.from(new Set(paths));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(uniquePaths));
  };

  // Function to check if folders exist (Re-validation)
  const validateCourseFolders = async () => {
    setIsValidating(true);
    try {
      const updatedCourses = await Promise.all(
        courses.map(async (course) => {
          const isValid = await folderService.checkFolderExists(course.folderPath);
          return { ...course, isValid };
        }),
      );
      setCourses(updatedCourses);
      // We don't necessarily need to update storage here unless we remove them.
    } catch (error) {
      console.error('Error validating folders:', error);
    } finally {
      setIsValidating(false);
    }
  };

  // Remove courses with non-existent folders
  const removeInvalidCourses = () => {
    const validCourses = courses.filter((course) => course.isValid);
    setCourses(validCourses);
    saveToStorage(validCourses);
  };

  const handleRemoveCourse = (courseId: string) => {
    if (confirm('Are you sure you want to remove this course from the dashboard?')) {
      const newCourses = courses.filter((c) => c.id !== courseId);
      setCourses(newCourses);
      saveToStorage(newCourses);
    }
  };

  // Open folder picker
  const openFolderPicker = async () => {
    setIsAddingCourse(true);
    try {
      const result = await folderService.selectCourseFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];

        // Check if already exists
        if (courses.some((c) => c.folderPath === folderPath)) {
          alert('This course is already in your dashboard.');
          return;
        }

        // Create course from selected folder
        const newCourse = await folderService.createCourseFromFolder(folderPath);
        if (newCourse) {
          const newCourseList = [...courses, newCourse];
          setCourses(newCourseList);
          saveToStorage(newCourseList);
        } else {
          alert('Selected folder does not contain a valid course structure.');
        }
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
      alert('Error selecting folder. Please try again.');
    } finally {
      setIsAddingCourse(false);
    }
  };

  const openCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Dashboard</h1>
          <p className="text-muted-foreground">Manage your language learning courses</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={validateCourseFolders}
            disabled={isValidating}
            className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-accent disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Validating...
              </>
            ) : (
              <>
                <AlertCircle size={18} />
                Validate Folders
              </>
            )}
          </button>
          <button
            onClick={openFolderPicker}
            disabled={isAddingCourse || isValidating}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            {isAddingCourse ? (
              <>
                <RefreshCw className="animate-spin" size={18} />
                Adding...
              </>
            ) : (
              <>
                <Plus size={18} />
                Add Course Folder
              </>
            )}
          </button>
        </div>
      </div>

      {courses.filter((c) => !c.isValid).length > 0 && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-destructive" />
              <div>
                <h3 className="font-semibold">Invalid Course Folders</h3>
                <p className="text-sm text-muted-foreground">
                  {courses.filter((c) => !c.isValid).length} course folder(s) no longer exist or are
                  inaccessible.
                </p>
              </div>
            </div>
            <button
              onClick={removeInvalidCourses}
              className="px-3 py-1 bg-destructive text-destructive-foreground rounded flex items-center gap-2 text-sm"
            >
              <Trash2 size={16} />
              Remove Invalid
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className={`group relative border rounded-xl p-5 hover:shadow-lg transition-shadow cursor-pointer bg-card ${!course.isValid ? 'opacity-60' : ''}`}
            onClick={() => course.isValid && openCourse(course.id)}
          >
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCourse(course.id);
                }}
                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded-full"
                title="Remove from Dashboard"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex justify-between items-start mb-4 pr-6">
              <div>
                <h3 className="text-xl font-semibold truncate pr-2">{course.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {course.description || 'No description'}
                </p>
              </div>
            </div>

            {!course.isValid && (
              <div className="mb-2">
                <span className="px-2 py-1 text-xs bg-destructive/20 text-destructive rounded font-medium">
                  Folder Missing
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <FolderOpen size={16} className="min-w-[16px]" />
              <span className="truncate" title={course.folderPath}>
                {course.folderPath}
              </span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">{course.lessonCount} lessons</span>
              <button
                className={`px-3 py-1 rounded text-sm transition-colors ${course.isValid ? 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                disabled={!course.isValid}
              >
                {course.isValid ? 'Open Course' : 'Unavailable'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && !isValidating && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/5">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No courses yet</h3>
          <p className="text-muted-foreground mt-1 mb-6">
            Add your first course folder to get started
          </p>
          <button
            onClick={openFolderPicker}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 mx-auto hover:bg-primary/90 transition-all shadow-sm"
          >
            <Plus size={20} />
            Add Course Folder
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
