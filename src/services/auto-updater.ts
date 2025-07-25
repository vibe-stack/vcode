import { autoUpdater } from 'electron-updater';
import { BrowserWindow, ipcMain } from 'electron';

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

interface ProgressInfo {
  bytesPerSecond: number;
  percent: number;
  transferred: number;
  total: number;
}

export class AutoUpdaterService {
  private mainWindow: BrowserWindow;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private updateDownloaded = false;
  private isCheckingForUpdates = false;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupAutoUpdater();
    this.setupIPC();
  }

  private setupAutoUpdater() {
    // Configure auto-updater for GitHub releases
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'vibe-stack',
      repo: 'vcode',
      private: false
    });

    // Don't automatically download updates
    autoUpdater.autoDownload = false;
    
    // Check for updates immediately on startup
    this.checkForUpdatesOnStartup();
    
    // Set up periodic update checks (every 24 hours)
    this.scheduleUpdateChecks();

    // Auto-updater event listeners
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      this.isCheckingForUpdates = true;
    });

    autoUpdater.on('update-available', (info: UpdateInfo) => {
      console.log('Update available:', info.version);
      this.isCheckingForUpdates = false;
      this.handleUpdateAvailable(info);
    });

    autoUpdater.on('update-not-available', () => {
      console.log('Update not available.');
      this.isCheckingForUpdates = false;
    });

    autoUpdater.on('error', (err: Error) => {
      console.error('Error in auto-updater:', err);
      this.isCheckingForUpdates = false;
    });

    autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
      const message = `Download speed: ${progressObj.bytesPerSecond} - Downloaded ${progressObj.percent}% (${progressObj.transferred}/${progressObj.total})`;
      console.log(message);
      
      // Send progress to renderer
      this.mainWindow.webContents.send('update-download-progress', {
        percent: Math.round(progressObj.percent),
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond
      });
    });

    autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
      console.log('Update downloaded:', info.version);
      this.updateDownloaded = true;
      
      // Notify renderer that update is ready
      this.mainWindow.webContents.send('update-downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes
      });
    });
  }

  private setupIPC() {
    // Handle install update request from renderer
    ipcMain.handle('install-update', () => {
      if (this.updateDownloaded) {
        autoUpdater.quitAndInstall();
      }
    });

    // Handle download update request from renderer
    ipcMain.handle('download-update', () => {
      autoUpdater.downloadUpdate();
    });

    // Handle check for updates request from renderer
    ipcMain.handle('check-for-updates', () => {
      if (!this.isCheckingForUpdates) {
        autoUpdater.checkForUpdates();
      }
    });

    // Handle dismiss update notification
    ipcMain.handle('dismiss-update-notification', () => {
      // Just acknowledge - the renderer handles the UI
    });
  }

  private async checkForUpdatesOnStartup() {
    // Check if there's a pending update that was already downloaded
    try {
      const updateCheckResult = await autoUpdater.checkForUpdatesAndNotify();
      if (updateCheckResult && updateCheckResult.downloadPromise) {
        // Update was available and downloading started
        console.log('Update download started on startup');
      }
    } catch (error) {
      console.error('Error checking for updates on startup:', error);
    }
  }

  private scheduleUpdateChecks() {
    // Check for updates every 24 hours
    this.updateCheckInterval = setInterval(() => {
      if (!this.isCheckingForUpdates) {
        console.log('Performing scheduled update check...');
        autoUpdater.checkForUpdates();
      }
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
  }

  private handleUpdateAvailable(info: UpdateInfo) {
    // Notify renderer about available update
    this.mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate
    });

    // Auto-download the update
    autoUpdater.downloadUpdate();
  }

  public cleanup() {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
}
