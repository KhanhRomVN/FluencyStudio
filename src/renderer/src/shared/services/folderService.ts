import { Course } from '../../types/course';

// Types for Electron IPC communication
export interface FolderSelectionResult {
  canceled: boolean;
  filePaths: string[];
}

export interface CourseFolderStructure {
  courseJson?: string;
  lessons: string[];
  audioFiles: string[];
  imageFiles: string[];
  videoFiles: string[];
  isValid: boolean;
}

export interface FileSaveResult {
  success: boolean;
  error?: string;
}

class FolderService {
  private listeners: Map<string, Set<(path: string, event: string) => void>> = new Map();

  constructor() {
    this.setupGlobalListener();
  }

  private setupGlobalListener() {
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.on('file:changed', (_, { path, event }) => {
        // Notify listeners for the specific path
        if (this.listeners.has(path)) {
          this.listeners.get(path)?.forEach((callback) => callback(path, event));
        }

        // Also notify listeners for parent directories if needed (optional, for now exact match)
        // Find if any watched path is a parent of the changed file
        for (const [watchedPath, callbacks] of this.listeners.entries()) {
          if (path.startsWith(watchedPath) && path !== watchedPath) {
            callbacks.forEach((cb) => cb(path, event));
          }
        }
      });
    }
  }

  /**
   * Watch a file or directory for changes
   */
  async watchFile(path: string, callback: (path: string, event: string) => void): Promise<void> {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
      // Tell main process to start watching this path
      if (window.electron?.ipcRenderer) {
        await window.electron.ipcRenderer.invoke('watcher:watch', path);
      }
    }
    this.listeners.get(path)?.add(callback);
  }

  /**
   * Stop watching a file or directory
   */
  async unwatchFile(path: string, callback: (path: string, event: string) => void): Promise<void> {
    const callbacks = this.listeners.get(path);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.listeners.delete(path);
        // Tell main process to stop watching
        if (window.electron?.ipcRenderer) {
          await window.electron.ipcRenderer.invoke('watcher:unwatch', path);
        }
      }
    }
  }

  /**
   * Open folder picker dialog
   */
  async selectCourseFolder(): Promise<FolderSelectionResult> {
    try {
      // Use electron ipcRenderer directly (standard way from @electron-toolkit/preload)
      if (window.electron?.ipcRenderer) {
        const result = await window.electron.ipcRenderer.invoke('dialog:openDirectory');
        return result || { canceled: true, filePaths: [] };
      }

      // Fallback to window.api if available
      if (window.api?.app?.openDirectoryDialog) {
        const result = await window.api.app.openDirectoryDialog();
        return result || { canceled: true, filePaths: [] };
      }

      console.error('No IPC API available');
      return { canceled: true, filePaths: [] };
    } catch (error) {
      console.error('Error selecting folder:', error);
      return { canceled: true, filePaths: [] };
    }
  }

  /**
   * Scan folder structure and validate
   */
  async scanCourseFolder(folderPath: string): Promise<CourseFolderStructure> {
    try {
      // Use electron ipcRenderer directly first
      if (window.electron?.ipcRenderer) {
        const structure = await window.electron.ipcRenderer.invoke('folder:scan', folderPath);
        return structure || this.getDefaultFolderStructure();
      }

      // Fallback to window.api
      if (window.api?.app?.scanFolder) {
        const structure = await window.api.app.scanFolder(folderPath);
        return structure || this.getDefaultFolderStructure();
      }

      console.error('No API available for scanFolder');
      return this.getDefaultFolderStructure();
    } catch (error) {
      console.error('Error scanning folder:', error);
      return this.getDefaultFolderStructure();
    }
  }

  /**
   * Check if folder exists
   */
  async checkFolderExists(path: string): Promise<boolean> {
    try {
      // Use electron ipcRenderer directly first
      if (window.electron?.ipcRenderer) {
        const exists = await window.electron.ipcRenderer.invoke('folder:exists', path);
        return exists || false;
      }

      // Fallback to window.api
      if (window.api?.app?.folderExists) {
        const exists = await window.api.app.folderExists(path);
        return exists || false;
      }

      console.error('No API available for folderExists');
      return false;
    } catch (error) {
      console.error('Error checking folder existence:', error);
      return false;
    }
  }

  /**
   * Parse course metadata from JSON file
   */
  async parseCourseMetadata(courseJsonPath: string): Promise<any> {
    try {
      let metadata;
      if (window.api?.app?.parseCourseMetadata) {
        metadata = await window.api.app.parseCourseMetadata(courseJsonPath);
      } else if (window.electronAPI?.app?.parseCourseMetadata) {
        metadata = await window.electronAPI.app.parseCourseMetadata(courseJsonPath);
      } else if (window.electron?.ipcRenderer) {
        metadata = await window.electron.ipcRenderer.invoke('course:parseMetadata', courseJsonPath);
      } else {
        console.error('No API available for parseCourseMetadata');
        return null;
      }

      return metadata || null;
    } catch (error) {
      console.error('Error parsing course metadata:', error);
      return null;
    }
  }

  /**
   * Get all course folders from a base directory
   */
  async getCourseFolders(basePath: string): Promise<string[]> {
    try {
      let folders;
      if (window.api?.app?.getCourseFolders) {
        folders = await window.api.app.getCourseFolders(basePath);
      } else if (window.electronAPI?.app?.getCourseFolders) {
        folders = await window.electronAPI.app.getCourseFolders(basePath);
      } else if (window.electron?.ipcRenderer) {
        folders = await window.electron.ipcRenderer.invoke('folder:getCourses', basePath);
      } else {
        console.error('No API available for getCourseFolders');
        return [];
      }

      return folders || [];
    } catch (error) {
      console.error('Error getting course folders:', error);
      return [];
    }
  }

  /**
   * Save content to file using IPC
   */
  async saveFile(filePath: string, content: string): Promise<FileSaveResult> {
    try {
      if (window.electron?.ipcRenderer) {
        const success = await window.electron.ipcRenderer.invoke('file:write', filePath, content);
        return { success };
      }
      return { success: false, error: 'No IPC available' };
    } catch (error) {
      console.error('Error saving file:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Load audio file as base64 string
   */
  async loadAudioFile(filePath: string): Promise<string | null> {
    try {
      if (window.electron?.ipcRenderer) {
        // Assuming 'file:read' returns base64 string or Buffer
        const content = await window.electron.ipcRenderer.invoke('file:read', filePath, {
          encoding: 'base64',
        });
        if (content) {
          return `data:audio/mpeg;base64,${content}`;
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading audio file:', error);
      return null;
    }
  }

  private getDefaultFolderStructure(): CourseFolderStructure {
    return {
      courseJson: undefined,
      lessons: [],
      audioFiles: [],
      imageFiles: [],
      videoFiles: [],
      isValid: false,
    };
  }

  /**
   * Validate multiple course folders and return valid ones
   */
  async validateCourseFolders(
    folderPaths: string[],
  ): Promise<{ path: string; isValid: boolean }[]> {
    const results = await Promise.all(
      folderPaths.map(async (path) => {
        const isValid = await this.checkFolderExists(path);
        return { path, isValid };
      }),
    );
    return results;
  }

  /**
   * Create a Course object from folder path
   */
  async createCourseFromFolder(folderPath: string): Promise<Course | null> {
    try {
      const structure = await this.scanCourseFolder(folderPath);
      if (!structure.isValid) {
        return null;
      }

      const folderName = folderPath.split('/').pop() || 'Unknown Course';
      const courseName = folderName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        id: folderName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: courseName,
        folderPath,
        description: `Course located at ${folderPath}`,
        lessonCount: structure.lessons.length,
        isValid: true,
        lastAccessed: new Date(),
      };
    } catch (error) {
      console.error('Error creating course from folder:', error);
      return null;
    }
  }
  /**
   * Load full course content including all lessons
   */
  async loadFullCourse(courseId: string): Promise<any | null> {
    try {
      // 1. We need to find the folder path for this courseId.
      // Since we don't have a reliable registry, we might need to scan known paths or rely on the caller to provide path.
      // BUT Dashboard saves paths. CoursePage only has ID.
      // Options:
      // A. Caller (CoursePage) looks up path from localStorage and passes IT to this function.
      // B. This function looks up localStorage.

      // Let's implement 'loadCourseFromPath' instead, and let CoursePage handle finding the path.
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Load full course content from a specific folder path
   */
  async loadCourseFromPath(folderPath: string): Promise<any | null> {
    try {
      const structure = await this.scanCourseFolder(folderPath);
      if (!structure.isValid) return null;

      // Load Course Metadata
      let courseData: any = {};
      if (structure.courseJson) {
        const metadata = await this.parseCourseMetadata(structure.courseJson);
        if (metadata) {
          courseData = { ...metadata };
        }
      }

      // Ensure basic fields exist
      if (!courseData.title) {
        const folderName = folderPath.split('/').pop() || 'Unknown Course';
        courseData.title = folderName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      }
      if (!courseData.id) {
        courseData.id = folderPath
          .split('/')
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
      }

      // Load Lessons
      const lessons: any[] = [];
      for (const lessonFile of structure.lessons) {
        const lessonPath = `${folderPath}/${lessonFile}`;
        // Use parseCourseMetadata as it effectively reads JSON
        const lessonData = await this.parseCourseMetadata(lessonPath);
        if (lessonData) {
          // Ensure ID matches what we might expect or add if missing
          if (!lessonData.id) {
            lessonData.id = lessonFile.replace('.json', '');
          }
          // Attach file path for saving
          lessonData._filePath = lessonPath;
          lessons.push(lessonData);
        }
      }

      // Sort lessons by lessonNumber if available
      lessons.sort((a, b) => (a.lessonNumber || 0) - (b.lessonNumber || 0));

      return {
        ...courseData,
        _filePath: structure.courseJson,
        lessons,
      };
    } catch (error) {
      console.error('Error loading full course:', error);
      return null;
    }
  }
}

export const folderService = new FolderService();
