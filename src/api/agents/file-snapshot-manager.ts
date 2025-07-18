import * as fs from 'fs/promises';
import * as path from 'path';
import { agentDB, type FileSnapshot } from './database';

export class FileSnapshotManager {
  private static instance: FileSnapshotManager;

  private constructor() {}

  static getInstance(): FileSnapshotManager {
    if (!FileSnapshotManager.instance) {
      FileSnapshotManager.instance = new FileSnapshotManager();
    }
    return FileSnapshotManager.instance;
  }

  // Capture file state before operation
  async captureFileSnapshot(
    sessionId: string,
    filePath: string,
    operation: FileSnapshot['operation'],
    stepIndex: number
  ): Promise<FileSnapshot> {
    let beforeContent: string | undefined;
    let afterContent: string | undefined;

    try {
      // For update and delete operations, capture the current content as "before"
      if (operation === 'update' || operation === 'delete') {
        beforeContent = await fs.readFile(filePath, 'utf8');
      }
    } catch (error) {
      // File doesn't exist - that's fine for create operations
      if (operation !== 'create') {
        console.warn(`Could not read file ${filePath} for snapshot:`, error);
      }
    }

    const snapshot = agentDB.addFileSnapshot({
      sessionId,
      filePath,
      operation,
      beforeContent,
      afterContent, // Will be set after the operation
      status: 'pending',
      stepIndex,
    });

    return snapshot;
  }

  // Update snapshot with after content (call this after the file operation)
  async updateSnapshotAfterContent(snapshotId: string, afterContent?: string): Promise<void> {
    agentDB.updateFileSnapshotAfterContent(snapshotId, afterContent);
  }

  // Accept all pending snapshots for a session
  async acceptAllSnapshots(sessionId: string): Promise<void> {
    const pendingSnapshots = agentDB.getFileSnapshots(sessionId, 'pending');
    console.log(`🔍 Accepting ${pendingSnapshots.length} pending snapshots for session ${sessionId}`);
    
    // Apply all snapshots to ensure files are in the correct state
    for (const snapshot of pendingSnapshots) {
      console.log(`📄 Applying snapshot: ${snapshot.operation} ${snapshot.filePath} (status: ${snapshot.status})`);
      await this.applySnapshot(snapshot);
    }
    
    agentDB.acceptAllPendingSnapshots(sessionId);
    console.log(`✅ All snapshots applied and marked as accepted for session ${sessionId}`);
  }

  // Revert all pending snapshots for a session
  async revertAllSnapshots(sessionId: string): Promise<void> {
    const pendingSnapshots = agentDB.getFileSnapshots(sessionId, 'pending');
    console.log(`🔍 Reverting ${pendingSnapshots.length} pending snapshots for session ${sessionId}`);
    
    // Process snapshots in reverse order (undo most recent changes first)
    const sortedSnapshots = pendingSnapshots.sort((a, b) => b.stepIndex - a.stepIndex);

    for (const snapshot of sortedSnapshots) {
      console.log(`🔄 Reverting: ${snapshot.operation} ${snapshot.filePath}`);
      await this.revertSnapshot(snapshot);
    }

    // Mark all as reverted in the database
    agentDB.revertAllPendingSnapshots(sessionId);
    console.log(`✅ All snapshots reverted for session ${sessionId}`);
  }

  // Apply a snapshot to the filesystem (for accept operations)
  private async applySnapshot(snapshot: FileSnapshot): Promise<void> {
    try {
      switch (snapshot.operation) {
        case 'create':
        case 'update':
          // Write the after content to the file
          if (snapshot.afterContent !== undefined) {
            // Ensure directory exists
            await fs.mkdir(path.dirname(snapshot.filePath), { recursive: true });
            await fs.writeFile(snapshot.filePath, snapshot.afterContent, 'utf8');
            console.log(`✅ Applied ${snapshot.operation}: ${snapshot.filePath}`);
          } else {
            console.warn(`No after content available for ${snapshot.filePath}`);
          }
          break;

        case 'delete':
          // Delete the file
          try {
            await fs.unlink(snapshot.filePath);
            console.log(`✅ Applied delete: ${snapshot.filePath}`);
          } catch (error) {
            // File might already be deleted, that's okay
            console.warn(`Could not delete file ${snapshot.filePath}:`, error);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to apply snapshot for ${snapshot.filePath}:`, error);
      throw error;
    }
  }

  // Revert a specific snapshot
  private async revertSnapshot(snapshot: FileSnapshot): Promise<void> {
    try {
      switch (snapshot.operation) {
        case 'create':
          // Delete the created file
          try {
            await fs.unlink(snapshot.filePath);
          } catch (error) {
            console.warn(`Could not delete created file ${snapshot.filePath}:`, error);
          }
          break;

        case 'update':
          // Restore the previous content
          if (snapshot.beforeContent !== undefined) {
            await fs.writeFile(snapshot.filePath, snapshot.beforeContent, 'utf8');
          } else {
            console.warn(`No before content available for ${snapshot.filePath}`);
          }
          break;

        case 'delete':
          // Restore the deleted file
          if (snapshot.beforeContent !== undefined) {
            // Ensure directory exists
            await fs.mkdir(path.dirname(snapshot.filePath), { recursive: true });
            await fs.writeFile(snapshot.filePath, snapshot.beforeContent, 'utf8');
          } else {
            console.warn(`No before content available to restore ${snapshot.filePath}`);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to revert snapshot for ${snapshot.filePath}:`, error);
      throw error;
    }
  }

  // Get snapshots for a session
  getSnapshots(sessionId: string, status?: FileSnapshot['status']): FileSnapshot[] {
    return agentDB.getFileSnapshots(sessionId, status);
  }

  // Debug method to get all snapshots for a session
  getSessionSnapshots(sessionId: string): FileSnapshot[] {
    return agentDB.getFileSnapshots(sessionId);
  }
}

export const fileSnapshotManager = FileSnapshotManager.getInstance();
