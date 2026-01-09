import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Course } from '../../types/course';
import { folderService } from '../../shared/services/folderService';
import { debugWindowAPI } from '../../shared/utils/debugAPI';
import { FolderOpen, RefreshCw, Trash2 } from 'lucide-react';

const STORAGE_KEY = 'fluency_courses_root_path';

const Dashboard = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    debugWindowAPI();
    loadRootPath();
  }, []);

  const loadRootPath = async () => {
    const savedPath = localStorage.getItem(STORAGE_KEY);
    if (savedPath) {
      setRootPath(savedPath);
      await scanCourses(savedPath);
    }
  };

  const scanCourses = async (path: string) => {
    setIsLoading(true);
    try {
      const exists = await folderService.checkFolderExists(path);
      if (!exists) {
        setRootPath(null);
        localStorage.removeItem(STORAGE_KEY);
        setCourses([]);
        return;
      }

      // Get all subfolders
      const courseFolders = await folderService.getCourseFolders(path);
      const loadedCourses: Course[] = [];

      for (const folderName of courseFolders) {
        // Assuming getCourseFolders returns just names, but let's assume implementation details.
        // Actually folderService.getCourseFolders returns "folders" which are names if using fs.readdir
        // We need full paths.
        // Let's rely on constructing the path.
        // Wait, folderService.getCourseFolders in main/events returns names.
        // Let's double check folderService implementation details.
        // The current implementation of `folder:getCourses` in main returns names.
        const fullPath = `${path}/${folderName}`; // basic join
        const course = await folderService.createCourseFromFolder(fullPath);
        if (course) {
          loadedCourses.push(course);
        }
      }
      setCourses(loadedCourses);
    } catch (error) {
      console.error('Error scanning courses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRootFolder = async () => {
    try {
      const result = await folderService.selectCourseFolder();
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        setRootPath(selectedPath);
        localStorage.setItem(STORAGE_KEY, selectedPath);
        await scanCourses(selectedPath);
      }
    } catch (error) {
      console.error('Error selecting root folder:', error);
    }
  };

  const openCourse = (courseId: string) => {
    navigate(`/course/${courseId}`);
  };

  const clearRootFolder = () => {
    if (confirm('Are you sure you want to clear the courses folder selection?')) {
      setRootPath(null);
      localStorage.removeItem(STORAGE_KEY);
      setCourses([]);
    }
  };

  return (
    <div className="p-6 h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Dashboard</h1>
          <p className="text-muted-foreground">
            {rootPath
              ? `Managing courses in: ${rootPath}`
              : 'Select a folder to manage your courses'}
          </p>
        </div>
        <div className="flex gap-3">
          {rootPath && (
            <>
              <button
                onClick={() => scanCourses(rootPath)}
                disabled={isLoading}
                className="px-4 py-2 border rounded-lg flex items-center gap-2 hover:bg-accent disabled:opacity-50"
              >
                <RefreshCw className={isLoading ? 'animate-spin' : ''} size={18} />
                Refresh
              </button>
              <button
                onClick={clearRootFolder}
                className="px-4 py-2 border border-destructive text-destructive rounded-lg flex items-center gap-2 hover:bg-destructive/10"
              >
                <Trash2 size={18} />
                Unlink Folder
              </button>
            </>
          )}
          <button
            onClick={handleSelectRootFolder}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg flex items-center gap-2 hover:bg-primary/90 disabled:opacity-50"
          >
            <FolderOpen size={18} />
            {rootPath ? 'Change Courses Folder' : 'Select Courses Folder'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border rounded-xl bg-card shadow-sm">
        {courses.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            {rootPath ? (
              <>
                <FolderOpen className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-semibold">No courses found</h3>
                <p>No valid course folders found in the selected directory.</p>
              </>
            ) : (
              <>
                <FolderOpen className="h-16 w-16 mb-4 opacity-20" />
                <h3 className="text-xl font-semibold">No folder selected</h3>
                <p className="mb-6">
                  Please select a folder containing your courses to get started.
                </p>
                <button
                  onClick={handleSelectRootFolder}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
                >
                  Select Folder
                </button>
              </>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="p-4 font-semibold border-b">Course Name</th>
                <th className="p-4 font-semibold border-b">Lessons</th>
                <th className="p-4 font-semibold border-b">Path</th>
                <th className="p-4 font-semibold border-b text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => (
                <tr
                  key={course.id}
                  className="border-b hover:bg-muted/30 transition-colors group cursor-pointer"
                  onClick={() => openCourse(course.id)}
                >
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg text-primary">
                        <FolderOpen size={20} />
                      </div>
                      <div>
                        <div className="font-semibold">{course.name}</div>
                        <div className="text-xs text-muted-foreground">{course.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {course.lessonCount} lessons
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground font-mono truncate max-w-[300px]">
                    {course.folderPath}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCourse(course.id);
                      }}
                      className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
