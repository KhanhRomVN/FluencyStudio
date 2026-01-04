import { ipcMain, dialog, app } from 'electron';
import fs from 'fs';
import path from 'path';

export function setupEventHandlers() {
  ipcMain.handle('ping', () => 'pong');

  // Dialog handlers
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return {
      canceled: result.canceled,
      filePaths: result.filePaths,
    };
  });

  // Folder handlers
  ipcMain.handle('folder:exists', async (_, folderPath: string) => {
    try {
      const exists = fs.existsSync(folderPath);
      const isDirectory = exists ? fs.statSync(folderPath).isDirectory() : false;
      return exists && isDirectory;
    } catch (error) {
      console.error('Error checking folder exists:', error);
      return false;
    }
  });

  ipcMain.handle('folder:scan', async (_, folderPath: string) => {
    try {
      if (!fs.existsSync(folderPath)) {
        return {
          courseJson: undefined,
          lessons: [],
          audioFiles: [],
          imageFiles: [],
          videoFiles: [],
          isValid: false,
        };
      }

      const files = fs.readdirSync(folderPath);
      // Look for *Course.json or metadata.json or course.json
      const courseJson = files.find((file) => {
        const lower = file.toLowerCase();
        return lower.endsWith('course.json') || lower === 'metadata.json';
      });

      const lessons: string[] = [];
      const audioFiles: string[] = [];
      const imageFiles: string[] = [];
      const videoFiles: string[] = [];

      files.forEach((file) => {
        const fullPath = path.join(folderPath, file);
        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch (e) {
          return;
        }

        const lowerFile = file.toLowerCase();

        // Check for lesson directories OR lesson files
        if (stat.isDirectory()) {
          if (lowerFile.includes('lesson') || lowerFile.includes('module')) {
            lessons.push(file);
          }
        } else {
          const ext = path.extname(file).toLowerCase();

          // Also check for lesson json files if they aren't directories
          if (ext === '.json' && (lowerFile.includes('lesson') || lowerFile.includes('module'))) {
            lessons.push(file);
          }

          if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
            audioFiles.push(file);
          } else if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            imageFiles.push(file);
          } else if (['.mp4', '.avi', '.mov', '.mkv'].includes(ext)) {
            videoFiles.push(file);
          }
        }
      });

      const hasCourseJson = !!courseJson;
      // It is valid if it has a course json OR has detected lessons
      const isValid = hasCourseJson || lessons.length > 0;

      return {
        courseJson: courseJson ? path.join(folderPath, courseJson) : undefined,
        lessons,
        audioFiles,
        imageFiles,
        videoFiles,
        isValid,
      };
    } catch (error) {
      console.error('Error scanning folder:', error);
      return {
        courseJson: undefined,
        lessons: [],
        audioFiles: [],
        imageFiles: [],
        videoFiles: [],
        isValid: false,
      };
    }
  });

  ipcMain.handle('course:parseMetadata', async (_, jsonPath: string) => {
    try {
      if (!fs.existsSync(jsonPath)) {
        return null;
      }
      const data = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error parsing course metadata:', error);
      return null;
    }
  });

  ipcMain.handle('folder:getCourses', async (_, basePath: string) => {
    try {
      if (!fs.existsSync(basePath)) {
        return [];
      }

      const items = fs.readdirSync(basePath);
      const folders = items.filter((item) => {
        const fullPath = path.join(basePath, item);
        return fs.statSync(fullPath).isDirectory();
      });

      return folders;
    } catch (error) {
      console.error('Error getting course folders:', error);
      return [];
    }
  });

  // File handlers
  ipcMain.handle('file:write', async (_, filePath: string, content: string) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  });

  ipcMain.handle('file:read', async (_, filePath: string, options?: { encoding?: string }) => {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const encoding = options?.encoding === 'base64' ? 'base64' : 'utf-8';
      const content = fs.readFileSync(filePath, encoding as BufferEncoding);
      return content;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  });
}
