import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { X, Download, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UpdateNotificationProps {}

interface UpdateInfo {
  version: string;
  releaseNotes?: string;
  releaseDate?: string;
}

interface ProgressInfo {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = () => {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateInfo | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<ProgressInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Listen for update events from main process
    if (typeof window !== 'undefined' && window.electronAPI) {
      // Update available - start downloading
      window.electronAPI.onUpdateAvailable((info: UpdateInfo) => {
        setUpdateAvailable(info);
        setIsVisible(true);
        setIsDownloading(true);
        setDownloadProgress(null);
      });

      // Download progress
      window.electronAPI.onUpdateDownloadProgress((progress: ProgressInfo) => {
        setDownloadProgress(progress);
      });

      // Update downloaded and ready to install
      window.electronAPI.onUpdateDownloaded((info: UpdateInfo) => {
        setUpdateDownloaded(info);
        setIsDownloading(false);
        setDownloadProgress(null);
      });
    }
  }, []);

  const handleInstallUpdate = async () => {
    if (window.electronAPI) {
      await window.electronAPI.installUpdate();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (window.electronAPI) {
      window.electronAPI.dismissUpdateNotification();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-4 left-4 z-50 w-80 bg-background border border-border rounded-lg shadow-lg p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {isDownloading ? (
              <Download className="h-4 w-4 text-blue-500 animate-pulse" />
            ) : (
              <RefreshCw className="h-4 w-4 text-green-500" />
            )}
            <h3 className="font-semibold text-sm">
              {isDownloading ? 'Downloading Update' : 'Update Ready'}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {isDownloading && updateAvailable && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Version {updateAvailable.version} is downloading...
            </p>
            {downloadProgress && (
              <div className="space-y-1">
                <Progress value={downloadProgress.percent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{downloadProgress.percent}%</span>
                  <span>
                    {formatBytes(downloadProgress.transferred)} / {formatBytes(downloadProgress.total)}
                  </span>
                  <span>{formatSpeed(downloadProgress.bytesPerSecond)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {updateDownloaded && !isDownloading && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Version {updateDownloaded.version} is ready to install.
            </p>
            <div className="flex space-x-2">
              <Button
                onClick={handleInstallUpdate}
                size="sm"
                className="flex-1"
              >
                Restart & Update
              </Button>
              <Button
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Later
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
