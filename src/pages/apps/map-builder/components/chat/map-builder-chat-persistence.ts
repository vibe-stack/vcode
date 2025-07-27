import type { EnhancedChatMessage, ChatSession } from './types';

class MapBuilderChatPersistenceService {
  private readonly STORAGE_KEY = 'map_builder_chat_sessions';
  private readonly MAX_SESSIONS = 50;
  private readonly SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  async saveCurrentSession(messages: EnhancedChatMessage[]): Promise<string> {
    if (messages.length === 0) return '';

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      title: this.generateSessionTitle(messages),
      messages,
      projectPath: 'map-builder', // Static for map builder
      createdAt: new Date(),
      lastModified: new Date()
    };

    const sessions = await this.getAllSessions();
    sessions.unshift(session);

    // Keep only the most recent sessions
    if (sessions.length > this.MAX_SESSIONS) {
      sessions.splice(this.MAX_SESSIONS);
    }

    await this.saveSessions(sessions);
    return sessionId;
  }

  async updateSession(sessionId: string, messages: EnhancedChatMessage[]): Promise<void> {
    const sessions = await this.getAllSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex >= 0) {
      sessions[sessionIndex] = {
        ...sessions[sessionIndex],
        messages,
        lastModified: new Date()
      };

      await this.saveSessions(sessions);
    }
  }

  async loadSession(sessionId: string): Promise<EnhancedChatMessage[]> {
    const sessions = await this.getAllSessions();
    const session = sessions.find(s => s.id === sessionId);
    return session?.messages || [];
  }

  async getRecentSessions(limit: number = 10): Promise<ChatSession[]> {
    const sessions = await this.getAllSessions();
    return sessions
      .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
      .slice(0, limit);
  }

  async clearCurrentProjectSessions(): Promise<void> {
    // For map builder, clear all sessions since they're all for the same "project"
    await this.saveSessions([]);
  }

  async cleanupOldSessions(): Promise<void> {
    const sessions = await this.getAllSessions();
    const now = Date.now();
    
    const validSessions = sessions.filter(session => {
      const sessionAge = now - new Date(session.lastModified).getTime();
      return sessionAge < this.SESSION_TTL;
    });

    if (validSessions.length !== sessions.length) {
      await this.saveSessions(validSessions);
    }
  }

  private async getAllSessions(): Promise<ChatSession[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const sessions = JSON.parse(stored);
      // Convert date strings back to Date objects
      return sessions.map((session: any) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        lastModified: new Date(session.lastModified),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
          createdAt: msg.createdAt ? new Date(msg.createdAt) : undefined
        }))
      }));
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      return [];
    }
  }

  private async saveSessions(sessions: ChatSession[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  }

  private generateSessionTitle(messages: EnhancedChatMessage[]): string {
    if (messages.length === 0) return 'New Chat';

    const firstUserMessage = messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Chat';

    // Extract text from parts
    const textPart = firstUserMessage.parts?.find((part: any) => part.type === 'text');
    const content = textPart?.text || '';

    if (!content) return 'New Chat';

    // Create a title from the first user message
    const title = content.slice(0, 50).replace(/\n/g, ' ').trim();
    return title || 'New Chat';
  }
}

export const mapBuilderChatPersistenceService = new MapBuilderChatPersistenceService();
