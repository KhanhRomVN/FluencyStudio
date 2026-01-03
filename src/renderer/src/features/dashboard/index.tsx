import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types/course';
import { folderService } from '../../shared/services/folderService';
import { debugWindowAPI } from '@shared/utils/debugAPI';
import { FolderOpen, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [baseCoursesPath, _setBaseCoursesPath] = useState<string>('/home/user/Courses');

  // Load courses on component mount
  useEffect(() => {
    // Debug APIs on mount
    debugWindowAPI();
    loadCourses();
  }, []);

  // Function to load courses from file system
  const loadCourses = async () => {
    try {
      // In a real app, you would load from persistent storage
      // For now, we'll use mock data but with real folder validation
      const mockCourses: Course[] = [
        {
          id: 'cambridge_ielts_18',
          name: 'Cambridge IELTS 18',
          folderPath: `${baseCoursesPath}/Cambridge_IELTS_18`,
          description: 'IELTS preparation course with full tests',
          lessonCount: 4,
          isValid: true,
        },
        {
          id: 'toefl_preparation_2024',
          name: 'TOEFL Preparation 2024',
          folderPath: `${baseCoursesPath}/TOEFL_Preparation_2024`,
          description: 'Complete TOEFL speaking and writing practice',
          lessonCount: 8,
          isValid: true,
        },
        {
          id: 'business_english_mastery',
          name: 'Business English Mastery',
          folderPath: `${baseCoursesPath}/Business_English_Mastery`,
          description: 'Professional communication skills',
          lessonCount: 12,
          isValid: true,
        },
      ];

      // Validate each course folder
      const validatedCourses = await Promise.all(
        mockCourses.map(async (course) => {
          const isValid = await folderService.checkFolderExists(course.folderPath);
          return { ...course, isValid };
        }),
      );

      setCourses(validatedCourses);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  // Function to check if folders exist
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
  };

  // Open folder picker
  const openFolderPicker = async () => {
    setIsAddingCourse(true);
    try {
      const result = await folderService.selectCourseFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        const folderPath = result.filePaths[0];

        // Create course from selected folder
        const newCourse = await folderService.createCourseFromFolder(folderPath);
        if (newCourse) {
          setCourses([...courses, newCourse]);
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
          <p className="text-sm text-muted-foreground mt-1">
            Base path: <code className="bg-muted px-1 rounded">{baseCoursesPath}</code>
          </p>
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
                  {courses.filter((c) => !c.isValid).length} course folder(s) no longer exist
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
            className={`border rounded-xl p-5 hover:shadow-lg transition-shadow cursor-pointer ${!course.isValid ? 'opacity-60' : ''}`}
            onClick={() => course.isValid && openCourse(course.id)}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{course.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{course.description}</p>
              </div>
              {!course.isValid && (
                <span className="px-2 py-1 text-xs bg-destructive/20 text-destructive rounded">
                  Invalid
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <FolderOpen size={16} />
              <span className="truncate">{course.folderPath}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">{course.lessonCount} lessons</span>
              <button
                className={`px-3 py-1 rounded text-sm ${course.isValid ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                disabled={!course.isValid}
              >
                {course.isValid ? 'Open Course' : 'Folder Missing'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed rounded-xl">
          <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No courses yet</h3>
          <p className="text-muted-foreground mt-1">Add your first course folder to get started</p>
          <button
            onClick={openFolderPicker}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 mx-auto"
          >
            <Plus size={18} />
            Add Course Folder
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
