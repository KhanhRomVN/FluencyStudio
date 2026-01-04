import chokidar from 'chokidar';
import { BrowserWindow } from 'electron';
import fs from 'fs';

class FileWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private watchedPaths: Set<string> = new Set();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.watcher = chokidar.watch([], {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.watcher) return;

    this.watcher
      .on('change', (path) => this.handleFileChange(path, 'change'))
      .on('add', (path) => this.handleFileChange(path, 'add'))
      .on('unlink', (path) => this.handleFileChange(path, 'unlink'));
  }

  private handleFileChange(filePath: string, event: string) {
    // Debounce events for the same file
    if (this.debounceTimers.has(filePath)) {
      clearTimeout(this.debounceTimers.get(filePath)!);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      // Notify all windows
      BrowserWindow.getAllWindows().forEach((window) => {
        if (!window.isDestroyed()) {
          window.webContents.send('file:changed', { path: filePath, event });
        }
      });
      // console.log(`[Main] File ${event}: ${filePath}`);
    }, 300); // 300ms debounce

    this.debounceTimers.set(filePath, timer);
  }

  public watch(path: string) {
    if (this.watchedPaths.has(path)) return;

    if (fs.existsSync(path)) {
      this.watcher?.add(path);
      this.watchedPaths.add(path);
      // console.log(`Started watching: ${path}`);
    }
  }

  public unwatch(path: string) {
    if (!this.watchedPaths.has(path)) return;

    this.watcher?.unwatch(path);
    this.watchedPaths.delete(path);
    // console.log(`Stopped watching: ${path}`);
  }

  public close() {
    this.watcher?.close();
    this.watchedPaths.clear();
  }
}

export const fileWatcherService = new FileWatcherService();
