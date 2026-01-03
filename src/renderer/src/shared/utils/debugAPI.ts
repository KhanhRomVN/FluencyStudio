/**
 * Debug utility for checking available window APIs
 * This helps diagnose issues with Electron IPC and preload scripts
 */

export interface WindowAPI {
  electron?: {
    ipcRenderer?: {
      invoke: (channel: string, ...args: any[]) => Promise<any>;
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, func: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  };
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

/**
 * Logs available APIs on the window object for debugging
 */
export const debugWindowAPI = (): void => {
  // Check for electron APIs
  const electronAPI = (window as any).electron;

  // Check for preload API
  const preloadAPI = (window as any).api;

  // Check for alternative electronAPI
  const electronAPIAlt = (window as any).electronAPI;

  // Check for specific methods used in folderService
  const checkMethods = [
    'dialog:openDirectory',
    'folder:scan',
    'folder:exists',
    'folder:getCourses',
    'course:parseMetadata',
  ];

  checkMethods.forEach(() => {
    electronAPI?.ipcRenderer?.invoke !== undefined;
  });

  // Return summary for programmatic use
  return {
    electron: !!electronAPI,
    api: !!preloadAPI,
    electronAPI: !!electronAPIAlt,
    ipcRenderer: !!electronAPI?.ipcRenderer,
    appAPI: !!preloadAPI?.app,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Test specific IPC call
 */
export const testIPCCall = async (channel: string, ...args: any[]): Promise<any> => {
  try {
    const electronAPI = (window as any).electron;
    if (electronAPI?.ipcRenderer?.invoke) {
      const result = await electronAPI.ipcRenderer.invoke(channel, ...args);
      return result;
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};

/**
 * Comprehensive API availability check
 */
export const checkAPIAvailability = (): {
  available: string[];
  missing: string[];
  warnings: string[];
} => {
  const available: string[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];

  const win = window as any;

  // Check electron
  if (win.electron) {
    available.push('window.electron');
    if (win.electron.ipcRenderer) {
      available.push('window.electron.ipcRenderer');
      if (typeof win.electron.ipcRenderer.invoke === 'function') {
        available.push('window.electron.ipcRenderer.invoke');
      } else {
        missing.push('window.electron.ipcRenderer.invoke');
      }
    } else {
      missing.push('window.electron.ipcRenderer');
    }
  } else {
    missing.push('window.electron');
  }

  // Check api
  if (win.api) {
    available.push('window.api');
    if (win.api.app) {
      available.push('window.api.app');
      const appMethods = [
        'openDirectoryDialog',
        'scanFolder',
        'folderExists',
        'parseCourseMetadata',
        'getCourseFolders',
      ];

      appMethods.forEach((method) => {
        if (typeof win.api.app[method] === 'function') {
          available.push(`window.api.app.${method}`);
        } else {
          missing.push(`window.api.app.${method}`);
        }
      });
    } else {
      missing.push('window.api.app');
    }
  } else {
    missing.push('window.api');
  }

  // Check electronAPI
  if (win.electronAPI) {
    available.push('window.electronAPI');
    if (win.electronAPI.app) {
      available.push('window.electronAPI.app');
    } else {
      warnings.push('window.electronAPI exists but window.electronAPI.app is missing');
    }
  }

  // If both electron and api are missing, this is likely a browser environment
  if (!win.electron && !win.api && !win.electronAPI) {
    warnings.push('No Electron APIs detected. Running in browser mode?');
  }

  return { available, missing, warnings };
};

export default {
  debugWindowAPI,
  testIPCCall,
  checkAPIAvailability,
};
