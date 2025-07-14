import { EnhancedChatMessage } from './types';

interface ChatSession {
  id: string;
  title: string;
  messages: EnhancedChatMessage[];
  projectPath: string;
  createdAt: Date;
  lastModified: Date;
}

interface ChatStorage {
  sessions: ChatSession[];
  version: string;
}

export class ChatPersistenceService {
  private static instance: ChatPersistenceService;
  private storageKey = 'grok-ide-chat-storage';

  static getInstance(): ChatPersistenceService {
    if (!ChatPersistenceService.instance) {
      ChatPersistenceService.instance = new ChatPersistenceService();
    }
    return ChatPersistenceService.instance;
  }

  /**
   * Generate a chat title from the first user message
   */
  private generateChatTitle(messages: EnhancedChatMessage[]): string {
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (!firstUserMessage) return 'New Chat';
    
    // Extract text from parts array
    const textPart = firstUserMessage.parts?.find(part => part.type === 'text');
    const content = textPart?.text || '';
    
    if (content.length === 0) return 'New Chat';
    if (content.length <= 50) return content;
    return content.substring(0, 50) + '...';
  }

  /**
   * Get all chat storage data
   */
  private getStorageData(): ChatStorage {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return { sessions: [], version: '1.0' };
      }
      
      const parsed = JSON.parse(data);
      // Convert date strings back to Date objects
      parsed.sessions = parsed.sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        lastModified: new Date(session.lastModified),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined,
        })),
      }));
      
      return parsed;
    } catch (error) {
      console.error('Failed to load chat storage:', error);
      return { sessions: [], version: '1.0' };
    }
  }

  /**
   * Save chat storage data
   */
  private saveStorageData(data: ChatStorage): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save chat storage:', error);
    }
  }

  /**
   * Get current project path
   */
  private async getCurrentProjectPath(): Promise<string | null> {
    try {
      if (!window.projectApi) {
        console.warn('projectApi not available');
        return null;
      }
      const projectPath = await window.projectApi.getCurrentProject();
      console.log('Current project path:', projectPath);
      return projectPath;
    } catch (error) {
      console.error('Failed to get current project:', error);
      return null;
    }
  }

  /**
   * Save current chat session
   */
  async saveCurrentSession(messages: EnhancedChatMessage[]): Promise<string> {
    if (messages.length === 0) return '';

    const projectPath = await this.getCurrentProjectPath();
    if (!projectPath) {
      console.warn('No project path available, using fallback path for chat storage');
      // Use a fallback path when no project is available
      const fallbackPath = 'default-project';
      const storage = this.getStorageData();
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const session: ChatSession = {
        id: sessionId,
        title: this.generateChatTitle(messages),
        messages,
        projectPath: fallbackPath,
        createdAt: new Date(),
        lastModified: new Date(),
      };

      storage.sessions.push(session);
      this.saveStorageData(storage);
      
      return sessionId;
    }

    const storage = this.getStorageData();
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: ChatSession = {
      id: sessionId,
      title: this.generateChatTitle(messages),
      messages,
      projectPath,
      createdAt: new Date(),
      lastModified: new Date(),
    };

    storage.sessions.push(session);
    this.saveStorageData(storage);
    
    return sessionId;
  }

  /**
   * Update existing chat session
   */
  async updateSession(sessionId: string, messages: EnhancedChatMessage[]): Promise<void> {
    if (!sessionId || messages.length === 0) return;

    const storage = this.getStorageData();
    const sessionIndex = storage.sessions.findIndex(s => s.id === sessionId);
    
    if (sessionIndex === -1) {
      // Session doesn't exist, create new one
      await this.saveCurrentSession(messages);
      return;
    }

    // Update existing session
    storage.sessions[sessionIndex] = {
      ...storage.sessions[sessionIndex],
      title: this.generateChatTitle(messages),
      messages,
      lastModified: new Date(),
    };

    this.saveStorageData(storage);
  }

  /**
   * Get chat sessions for current project
   */
  async getSessionsForCurrentProject(): Promise<ChatSession[]> {
    let projectPath = await this.getCurrentProjectPath();
    if (!projectPath) {
      projectPath = 'default-project'; // Use fallback path
    }

    const storage = this.getStorageData();
    return storage.sessions
      .filter(session => session.projectPath === projectPath)
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  }

  /**
   * Get recent chat sessions for current project (default 10)
   */
  async getRecentSessions(limit: number = 10): Promise<ChatSession[]> {
    const sessions = await this.getSessionsForCurrentProject();
    return sessions.slice(0, limit);
  }

  /**
   * Load a specific chat session
   */
  async loadSession(sessionId: string): Promise<EnhancedChatMessage[]> {
    const storage = this.getStorageData();
    const session = storage.sessions.find(s => s.id === sessionId);
    
    if (!session) {
      console.warn('Session not found:', sessionId);
      return [];
    }

    // Update last modified time
    session.lastModified = new Date();
    this.saveStorageData(storage);

    return session.messages;
  }

  /**
   * Delete a chat session
   */
  async deleteSession(sessionId: string): Promise<void> {
    const storage = this.getStorageData();
    storage.sessions = storage.sessions.filter(s => s.id !== sessionId);
    this.saveStorageData(storage);
  }

  /**
   * Clear all sessions for current project
   */
  async clearCurrentProjectSessions(): Promise<void> {
    let projectPath = await this.getCurrentProjectPath();
    if (!projectPath) {
      projectPath = 'default-project'; // Use fallback path
    }

    const storage = this.getStorageData();
    storage.sessions = storage.sessions.filter(s => s.projectPath !== projectPath);
    this.saveStorageData(storage);
  }

  /**
   * Clean up old sessions (keep only last 100 sessions total)
   */
  async cleanupOldSessions(): Promise<void> {
    const storage = this.getStorageData();
    
    // Sort by last modified, keep most recent 100
    storage.sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    storage.sessions = storage.sessions.slice(0, 100);
    
    this.saveStorageData(storage);
  }
}

export const chatPersistenceService = ChatPersistenceService.getInstance();
