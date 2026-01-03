import { ElectronAPI } from '@electron-toolkit/preload';

declare global {
 interface Window {
 electron: ElectronAPI;
 api?: {
 app?: {
 openDirectoryDialog: () => Promise<{
 canceled: boolean;
 filePaths: string[];
 }>;
 scanFolder: (path: string) => Promise<any>;
 folderExists: (path: string) => Promise<boolean>;
 parseCourseMetadata: (path: string) => Promise<any>;
 getCourseFolders: (basePath: string) => Promise<string[]>;
 };
 };
 electronAPI?: {
 app?: {
 parseCourseMetadata: (path: string) => Promise<any>;
 getCourseFolders: (basePath: string) => Promise<string[]>;
 };
 };
 }
}