import { agentDB, type AgentSession, type AgentStatus } from './database';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface LockResult {
  success: boolean;
  lockId?: string;
  conflictingSession?: string;
  reason?: string;
}

export interface FileOperation {
  type: 'read' | 'write';
  filePath: string;
  sessionId: string;
}

class FileLockManager extends EventEmitter {
  private static instance: FileLockManager;
  private lockTimeoutMs: number = 30000; // 30 seconds default

  private constructor() {
    super();
    // Clean up expired locks every 10 seconds
    setInterval(() => this.cleanupExpiredLocks(), 10000);
  }

  static getInstance(): FileLockManager {
    if (!FileLockManager.instance) {
      FileLockManager.instance = new FileLockManager();
    }
    return FileLockManager.instance;
  }

  async acquireFileLock(sessionId: string, filePath: string, lockType: 'read' | 'write', timeoutMs?: number): Promise<LockResult> {
    const timeout = timeoutMs || this.lockTimeoutMs;
    
    // Normalize file path
    const normalizedPath = path.resolve(filePath);
    
    // Check if file exists for read operations
    if (lockType === 'read' && !fs.existsSync(normalizedPath)) {
      return {
        success: false,
        reason: `File does not exist: ${normalizedPath}`
      };
    }

    // Try to acquire lock
    const lockId = agentDB.acquireLock(sessionId, normalizedPath, lockType, timeout);
    
    if (lockId) {
      this.emit('lockAcquired', { sessionId, filePath: normalizedPath, lockType, lockId });
      return {
        success: true,
        lockId
      };
    }

    // Check what's blocking us
    const conflictingLocks = agentDB.getActiveLocks(normalizedPath);
    const conflictingSession = conflictingLocks.length > 0 ? conflictingLocks[0].sessionId : undefined;
    
    this.emit('lockConflict', { sessionId, filePath: normalizedPath, lockType, conflictingSession });
    
    return {
      success: false,
      conflictingSession,
      reason: lockType === 'write' 
        ? `File is locked by another agent (session: ${conflictingSession})`
        : `File is locked for writing by another agent (session: ${conflictingSession})`
    };
  }

  releaseLock(lockId: string, sessionId: string): void {
    agentDB.releaseLock(lockId);
    this.emit('lockReleased', { lockId, sessionId });
  }

  releaseAllSessionLocks(sessionId: string): void {
    agentDB.releaseSessionLocks(sessionId);
    this.emit('sessionLocksReleased', { sessionId });
  }

  private cleanupExpiredLocks(): void {
    // The database automatically handles expired locks during acquisition
    // This is just a placeholder for any additional cleanup logic
  }

  getFileConflicts(sessionId: string, filePaths: string[]): string[] {
    const conflicts: string[] = [];
    
    for (const filePath of filePaths) {
      const normalizedPath = path.resolve(filePath);
      const activeLocks = agentDB.getActiveLocks(normalizedPath);
      
      // Check if any other session has locks on this file
      const hasConflict = activeLocks.some(lock => lock.sessionId !== sessionId);
      if (hasConflict) {
        conflicts.push(normalizedPath);
      }
    }
    
    return conflicts;
  }

  // Strategy for handling common files like package.json
  async acquireReadLockWithStrategy(sessionId: string, filePath: string): Promise<LockResult> {
    const normalizedPath = path.resolve(filePath);
    
    // For common config files, allow multiple readers but still block writers
    const isCommonFile = this.isCommonConfigFile(normalizedPath);
    
    if (isCommonFile) {
      // Use shorter timeout for common files
      return this.acquireFileLock(sessionId, normalizedPath, 'read', 5000);
    }
    
    return this.acquireFileLock(sessionId, normalizedPath, 'read');
  }

  private isCommonConfigFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    const commonFiles = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'tsconfig.json',
      'jsconfig.json',
      '.gitignore',
      'README.md',
      '.env',
      '.env.example'
    ];
    
    return commonFiles.includes(fileName);
  }
}

export const fileLockManager = FileLockManager.getInstance();
