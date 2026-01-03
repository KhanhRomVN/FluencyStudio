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

class FolderService {
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
 async validateCourseFolders(folderPaths: string[]): Promise<{ path: string; isValid: boolean }[]> {
 const results = await Promise.all(
 folderPaths.map(async (path) => {
 const isValid = await this.checkFolderExists(path);
 return { path, isValid };
 })
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
 const courseName = folderName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

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
}

export const folderService = new FolderService();