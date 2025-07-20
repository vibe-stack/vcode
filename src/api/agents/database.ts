import Database from 'better-sqlite3';
import { nanoid } from 'nanoid';
import path from 'path';
import os from 'os';
import fs from 'fs';

export type AgentStatus = 'ideas' | 'todo' | 'need_clarification' | 'doing' | 'review' | 'accepted' | 'rejected';

export interface AgentSession {
  id: string;
  name: string;
  description: string;
  status: AgentStatus;
  projectPath: string;
  projectName?: string; // Display name for the project
  workspaceRoot?: string; // Root workspace if project is part of a larger workspace
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata?: string; // JSON string for additional data
}

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  toolCalls?: string; // JSON string
  toolResults?: string; // JSON string
  timestamp: string;
  stepIndex: number;
}

export interface FileLock {
  id: string;
  sessionId: string;
  filePath: string;
  lockType: 'read' | 'write';
  acquiredAt: string;
  expiresAt: string;
}

export interface AgentProgress {
  id: string;
  sessionId: string;
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  details?: string;
  timestamp: string;
}

export interface FileSnapshot {
  id: string;
  sessionId: string;
  filePath: string;
  operation: 'create' | 'update' | 'delete';
  beforeContent?: string; // Content before the operation (for update/delete)
  afterContent?: string;  // Content after the operation (for create/update)
  status: 'pending' | 'accepted' | 'reverted';
  stepIndex: number;
  timestamp: string;
}

class AgentDatabase {
  private db: Database.Database;
  private isInitialized = false;
  constructor(dbPath?: string) {
    const defaultPath = path.join(os.homedir(), '.vcode', 'agents.db');
    const finalPath = dbPath || defaultPath;
    
    // Ensure the directory exists
    const dbDir = path.dirname(finalPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.db = new Database(finalPath);
    this.init();
  }

  private init() {
    if (this.isInitialized) return;

    // Enable foreign keys and WAL mode for better concurrency
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    // Create tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agent_sessions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('ideas', 'todo', 'need_clarification', 'doing', 'review', 'accepted', 'rejected')),
        project_path TEXT NOT NULL,
        project_name TEXT,
        workspace_root TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        metadata TEXT
      );

      CREATE TABLE IF NOT EXISTS agent_messages (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
        content TEXT NOT NULL,
        tool_calls TEXT,
        tool_results TEXT,
        timestamp TEXT NOT NULL,
        step_index INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES agent_sessions (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS file_locks (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        lock_type TEXT NOT NULL CHECK (lock_type IN ('read', 'write')),
        acquired_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES agent_sessions (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS agent_progress (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        step TEXT NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
        details TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES agent_sessions (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS file_snapshots (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
        before_content TEXT,
        after_content TEXT,
        status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'reverted')) DEFAULT 'pending',
        step_index INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (session_id) REFERENCES agent_sessions (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions (status);
      CREATE INDEX IF NOT EXISTS idx_agent_sessions_project ON agent_sessions (project_path);
      CREATE INDEX IF NOT EXISTS idx_agent_messages_session ON agent_messages (session_id, step_index);
      CREATE INDEX IF NOT EXISTS idx_file_locks_session ON file_locks (session_id);
      CREATE INDEX IF NOT EXISTS idx_file_locks_file ON file_locks (file_path);
      CREATE INDEX IF NOT EXISTS idx_agent_progress_session ON agent_progress (session_id, timestamp);
      CREATE INDEX IF NOT EXISTS idx_file_snapshots_session ON file_snapshots (session_id, step_index);
      CREATE INDEX IF NOT EXISTS idx_file_snapshots_file ON file_snapshots (file_path);
    `);

    this.isInitialized = true;
  }

  // Agent Sessions
  createSession(data: Omit<AgentSession, 'id' | 'createdAt' | 'updatedAt'>): AgentSession {
    const id = nanoid();
    const now = new Date().toISOString();
    
    const session: AgentSession = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO agent_sessions (id, name, description, status, project_path, project_name, workspace_root, created_at, updated_at, started_at, completed_at, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      session.id,
      session.name,
      session.description,
      session.status,
      session.projectPath,
      session.projectName || null,
      session.workspaceRoot || null,
      session.createdAt,
      session.updatedAt,
      session.startedAt || null,
      session.completedAt || null,
      session.metadata || null
    );

    return session;
  }

  getSession(id: string): AgentSession | null {
    const stmt = this.db.prepare('SELECT * FROM agent_sessions WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status as AgentStatus,
      projectPath: row.project_path,
      projectName: row.project_name || undefined,
      workspaceRoot: row.workspace_root || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      startedAt: row.started_at || undefined,
      completedAt: row.completed_at || undefined,
      metadata: row.metadata || undefined,
    };
  }

  updateSessionStatus(id: string, status: AgentStatus, additionalData?: Partial<AgentSession>): void {
    
    const now = new Date().toISOString();
    
    let setFields = ['status = ?', 'updated_at = ?'];
    let values = [status, now];

    if (additionalData?.startedAt !== undefined) {
      setFields.push('started_at = ?');
      values.push(additionalData.startedAt);
    }

    if (additionalData?.completedAt !== undefined) {
      setFields.push('completed_at = ?');
      values.push(additionalData.completedAt);
    }

    if (additionalData?.metadata !== undefined) {
      setFields.push('metadata = ?');
      values.push(additionalData.metadata);
    }

    values.push(id);

    const stmt = this.db.prepare(`UPDATE agent_sessions SET ${setFields.join(', ')} WHERE id = ?`);
    stmt.run(...values);
  }

  listSessions(projectPath?: string, status?: AgentStatus): AgentSession[] {
    let query = 'SELECT * FROM agent_sessions';
    const conditions: string[] = [];
    const params: any[] = [];

    if (projectPath) {
      conditions.push('project_path = ?');
      params.push(projectPath);
    }

    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status as AgentStatus,
      projectPath: row.project_path,
      projectName: row.project_name || undefined,
      workspaceRoot: row.workspace_root || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      startedAt: row.started_at || undefined,
      completedAt: row.completed_at || undefined,
      metadata: row.metadata || undefined,
    }));
  }

  // Project-specific queries
  listProjectSessions(projectPath: string, status?: AgentStatus): AgentSession[] {
    return this.listSessions(projectPath, status);
  }

  getAllProjects(): Array<{ projectPath: string; projectName?: string; agentCount: number; lastActivity: string }> {
    const stmt = this.db.prepare(`
      SELECT 
        project_path,
        project_name,
        COUNT(*) as agent_count,
        MAX(updated_at) as last_activity
      FROM agent_sessions 
      GROUP BY project_path, project_name
      ORDER BY last_activity DESC
    `);
    
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      projectPath: row.project_path,
      projectName: row.project_name || undefined,
      agentCount: row.agent_count,
      lastActivity: row.last_activity,
    }));
  }

  getProjectSummary(projectPath: string): {
    totalAgents: number;
    byStatus: Record<AgentStatus, number>;
    recentActivity: AgentSession[];
  } {
    const agents = this.listProjectSessions(projectPath);
    
    const byStatus: Record<AgentStatus, number> = {
      ideas: 0,
      todo: 0,
      need_clarification: 0,
      doing: 0,
      review: 0,
      accepted: 0,
      rejected: 0,
    };

    agents.forEach(agent => {
      byStatus[agent.status]++;
    });

    const recentActivity = agents
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    return {
      totalAgents: agents.length,
      byStatus,
      recentActivity,
    };
  }

  // Messages
  addMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>): AgentMessage {
    const id = nanoid();
    const timestamp = new Date().toISOString();

    const fullMessage: AgentMessage = {
      id,
      timestamp,
      ...message,
    };

    const stmt = this.db.prepare(`
      INSERT INTO agent_messages (id, session_id, role, content, tool_calls, tool_results, timestamp, step_index)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      fullMessage.id,
      fullMessage.sessionId,
      fullMessage.role,
      fullMessage.content,
      fullMessage.toolCalls || null,
      fullMessage.toolResults || null,
      fullMessage.timestamp,
      fullMessage.stepIndex
    );

    return fullMessage;
  }

  getMessages(sessionId: string, limit?: number): AgentMessage[] {
    let query = 'SELECT * FROM agent_messages WHERE session_id = ? ORDER BY step_index ASC, timestamp ASC';
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      role: row.role as 'user' | 'assistant' | 'system' | 'tool',
      content: row.content,
      toolCalls: row.tool_calls || undefined,
      toolResults: row.tool_results || undefined,
      timestamp: row.timestamp,
      stepIndex: row.step_index,
    }));
  }

  updateMessage(messageId: string, updates: Partial<Pick<AgentMessage, 'content' | 'toolResults'>>): boolean {
    const stmt = this.db.prepare(`
      UPDATE agent_messages 
      SET content = COALESCE(?, content), 
          tool_results = COALESCE(?, tool_results)
      WHERE id = ?
    `);

    const result = stmt.run(updates.content || null, updates.toolResults || null, messageId);
    return result.changes > 0;
  }

  findMessageByToolCallId(sessionId: string, toolCallId: string, stepIndex: number): AgentMessage | null {
    const stmt = this.db.prepare(`
      SELECT * FROM agent_messages 
      WHERE session_id = ? AND step_index = ? AND role = 'tool' AND tool_calls IS NOT NULL
    `);
    
    const rows = stmt.all(sessionId, stepIndex) as any[];
    
    for (const row of rows) {
      try {
        const toolCalls = JSON.parse(row.tool_calls || '[]');
        if (toolCalls.some((tc: any) => tc.toolCallId === toolCallId)) {
          return {
            id: row.id,
            sessionId: row.session_id,
            role: row.role as 'user' | 'assistant' | 'system' | 'tool',
            content: row.content,
            toolCalls: row.tool_calls || undefined,
            toolResults: row.tool_results || undefined,
            timestamp: row.timestamp,
            stepIndex: row.step_index,
          };
        }
      } catch (e) {
        // Skip invalid JSON
      }
    }
    
    return null;
  }

  // File Locks
  acquireLock(sessionId: string, filePath: string, lockType: 'read' | 'write', durationMs: number = 30000): string | null {
    try {
      const id = nanoid();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMs);

      // Check for conflicting locks (write conflicts with everything, read only conflicts with write)
      const conflictQuery = lockType === 'write' 
        ? 'SELECT id FROM file_locks WHERE file_path = ? AND expires_at > ? AND session_id != ?'
        : 'SELECT id FROM file_locks WHERE file_path = ? AND lock_type = ? AND expires_at > ? AND session_id != ?';

      const conflictStmt = this.db.prepare(conflictQuery);
      const queryParams = lockType === 'write' 
        ? [filePath, now.toISOString(), sessionId]
        : [filePath, 'write', now.toISOString(), sessionId];
      
      const conflicts = conflictStmt.all(...queryParams);

      if (conflicts.length > 0) {
        return null; // Lock conflict
      }

      // Clean up expired locks
      const cleanupStmt = this.db.prepare('DELETE FROM file_locks WHERE expires_at <= ?');
      cleanupStmt.run(now.toISOString());

      // Acquire lock
      const insertStmt = this.db.prepare(`
        INSERT INTO file_locks (id, session_id, file_path, lock_type, acquired_at, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertStmt.run(id, sessionId, filePath, lockType, now.toISOString(), expiresAt.toISOString());
      return id;
    } catch (error) {
      console.error('Database error in acquireLock:', error);
      console.error('Query parameters:', { sessionId, filePath, lockType, durationMs });
      throw error;
    }
  }

  releaseLock(lockId: string): void {
    const stmt = this.db.prepare('DELETE FROM file_locks WHERE id = ?');
    stmt.run(lockId);
  }

  releaseSessionLocks(sessionId: string): void {
    const stmt = this.db.prepare('DELETE FROM file_locks WHERE session_id = ?');
    stmt.run(sessionId);
  }

  getActiveLocks(filePath?: string): FileLock[] {
    const now = new Date().toISOString();
    let query = 'SELECT * FROM file_locks WHERE expires_at > ?';
    const params: any[] = [now];

    if (filePath) {
      query += ' AND file_path = ?';
      params.push(filePath);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      filePath: row.file_path,
      lockType: row.lock_type as 'read' | 'write',
      acquiredAt: row.acquired_at,
      expiresAt: row.expires_at,
    }));
  }

  // Progress Tracking
  addProgress(progress: Omit<AgentProgress, 'id' | 'timestamp'>): AgentProgress {
    const id = nanoid();
    const timestamp = new Date().toISOString();

    const fullProgress: AgentProgress = {
      id,
      timestamp,
      ...progress,
    };

    const stmt = this.db.prepare(`
      INSERT INTO agent_progress (id, session_id, step, status, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      fullProgress.id,
      fullProgress.sessionId,
      fullProgress.step,
      fullProgress.status,
      fullProgress.details || null,
      fullProgress.timestamp
    );

    return fullProgress;
  }

  getProgress(sessionId: string): AgentProgress[] {
    const stmt = this.db.prepare('SELECT * FROM agent_progress WHERE session_id = ? ORDER BY timestamp ASC');
    const rows = stmt.all(sessionId) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      step: row.step,
      status: row.status as 'pending' | 'running' | 'completed' | 'failed',
      details: row.details || undefined,
      timestamp: row.timestamp,
    }));
  }

  // File Snapshots
  addFileSnapshot(snapshot: Omit<FileSnapshot, 'id' | 'timestamp'>): FileSnapshot {
    const id = nanoid();
    const timestamp = new Date().toISOString();
    
    const fullSnapshot: FileSnapshot = {
      id,
      timestamp,
      ...snapshot,
    };

    const stmt = this.db.prepare(`
      INSERT INTO file_snapshots (id, session_id, file_path, operation, before_content, after_content, status, step_index, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      fullSnapshot.id,
      fullSnapshot.sessionId,
      fullSnapshot.filePath,
      fullSnapshot.operation,
      fullSnapshot.beforeContent || null,
      fullSnapshot.afterContent || null,
      fullSnapshot.status,
      fullSnapshot.stepIndex,
      fullSnapshot.timestamp
    );

    return fullSnapshot;
  }

  getFileSnapshots(sessionId: string, status?: FileSnapshot['status']): FileSnapshot[] {
    let query = 'SELECT * FROM file_snapshots WHERE session_id = ?';
    const params: any[] = [sessionId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY step_index ASC, timestamp ASC';
    
    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];

    return rows.map(row => ({
      id: row.id,
      sessionId: row.session_id,
      filePath: row.file_path,
      operation: row.operation as FileSnapshot['operation'],
      beforeContent: row.before_content || undefined,
      afterContent: row.after_content || undefined,
      status: row.status as FileSnapshot['status'],
      stepIndex: row.step_index,
      timestamp: row.timestamp,
    }));
  }

  updateFileSnapshotStatus(id: string, status: FileSnapshot['status']): void {
    const stmt = this.db.prepare('UPDATE file_snapshots SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  updateFileSnapshotAfterContent(id: string, afterContent?: string): void {
    const stmt = this.db.prepare('UPDATE file_snapshots SET after_content = ? WHERE id = ?');
    stmt.run(afterContent || null, id);
  }

  acceptAllPendingSnapshots(sessionId: string): void {
    const stmt = this.db.prepare('UPDATE file_snapshots SET status = ? WHERE session_id = ? AND status = ?');
    stmt.run('accepted', sessionId, 'pending');
  }

  revertAllPendingSnapshots(sessionId: string): void {
    const stmt = this.db.prepare('UPDATE file_snapshots SET status = ? WHERE session_id = ? AND status = ?');
    stmt.run('reverted', sessionId, 'pending');
  }

  // Session deletion
  deleteSession(id: string): void {
    const stmt = this.db.prepare('DELETE FROM agent_sessions WHERE id = ?');
    stmt.run(id);
  }

  // Cleanup inactive projects (no agents for X days)
  cleanupInactiveProjects(daysInactive: number = 30): string[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);
    
    const stmt = this.db.prepare(`
      SELECT DISTINCT project_path 
      FROM agent_sessions 
      WHERE project_path NOT IN (
        SELECT DISTINCT project_path 
        FROM agent_sessions 
        WHERE updated_at > ?
      )
    `);
    
    const inactiveProjects = stmt.all(cutoffDate.toISOString()) as any[];
    
    // Delete agents from inactive projects
    if (inactiveProjects.length > 0) {
      const deleteStmt = this.db.prepare(`
        DELETE FROM agent_sessions 
        WHERE project_path IN (${inactiveProjects.map(() => '?').join(',')})
      `);
      deleteStmt.run(...inactiveProjects.map(p => p.project_path));
    }
    
    return inactiveProjects.map(p => p.project_path);
  }

  close(): void {
    this.db.close();
  }

  // Debug method to check all sessions and their project paths
  getAllSessionsDebug(): Array<{id: string, name: string, projectPath: string, status: AgentStatus}> {
    const stmt = this.db.prepare('SELECT id, name, project_path, status FROM agent_sessions ORDER BY created_at DESC');
    const rows = stmt.all() as any[];
    
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      projectPath: row.project_path,
      status: row.status as AgentStatus,
    }));
  }
}

// Singleton instance
export const agentDB = new AgentDatabase();
