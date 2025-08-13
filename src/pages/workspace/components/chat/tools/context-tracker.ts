import { contextRulesService } from './context-rules-service';

interface SessionContext {
  sessionId: string;
  knownFiles: Set<string>;
  deliveredContext: Map<string, string>; // filePath -> context hash
  lastUpdated: number;
}

interface ContextRulesResult {
  rules: string;
  sources: string[];
}

/**
 * Context Tracker for token-efficient context rule delivery
 * Rebuilt for reliability - prioritizes delivery over deduplication
 */
class ContextTracker {
  private sessions = new Map<string, SessionContext>();
  private readonly SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get new context for files that haven't been seen in this session
   * Enhanced for reliability - always includes context when found
   */
  async getNewContextForFiles(
    sessionId: string,
    filePaths: string[],
    projectRoot: string
  ): Promise<ContextRulesResult | null> {
    console.log('[ContextTracker] getNewContextForFiles called');
    console.log('[ContextTracker] Session ID:', sessionId);
    console.log('[ContextTracker] File paths:', filePaths);
    console.log('[ContextTracker] Project root:', projectRoot);

    this.cleanupExpiredSessions();
    
    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      console.log('[ContextTracker] Creating new session for:', sessionId);
      session = {
        sessionId,
        knownFiles: new Set(),
        deliveredContext: new Map(),
        lastUpdated: Date.now(),
      };
      this.sessions.set(sessionId, session);
    }

    session.lastUpdated = Date.now();

    // Check each file for context rules
    const contextResults: ContextRulesResult[] = [];
    
    for (const filePath of filePaths) {
      console.log('[ContextTracker] Checking context for file:', filePath);
      
      try {
        const contextResult = await contextRulesService.getContextForFile(filePath, projectRoot);
        console.log('[ContextTracker] Context result from service:', contextResult);
        
        if (contextResult && contextResult.rules.trim()) {
          console.log('[ContextTracker] Found context rules for file:', filePath);
          
          // For reliability, always include context when found
          // The token cost is acceptable for ensuring rules are delivered
          if (this.shouldIncludeContext(session, filePath, contextResult)) {
            console.log('[ContextTracker] Including context for file:', filePath);
            contextResults.push(contextResult);
            
            // Mark as delivered for potential future optimization
            const contextHash = this.hashContext(contextResult.rules);
            session.deliveredContext.set(filePath, contextHash);
            session.knownFiles.add(filePath);
          } else {
            console.log('[ContextTracker] Skipping context for file (already delivered):', filePath);
          }
        } else {
          console.log('[ContextTracker] No context rules found for file:', filePath);
        }
      } catch (error) {
        console.warn('[ContextTracker] Error getting context for file:', filePath, error);
      }
    }

    console.log('[ContextTracker] Total context results found:', contextResults.length);

    if (contextResults.length === 0) {
      console.log('[ContextTracker] Returning null - no context found');
      return null;
    }

    // Combine all context rules
    const combinedRules = contextResults.map(result => result.rules).join('\n\n');
    const allSources = Array.from(new Set(contextResults.flatMap(result => result.sources)));

    const finalResult = {
      rules: combinedRules,
      sources: allSources,
    };

    console.log('[ContextTracker] Returning combined context:', finalResult);
    return finalResult;
  }

  /**
   * Determine if context should be included
   * Enhanced for reliability - always returns true to ensure delivery
   */
  private shouldIncludeContext(
    session: SessionContext,
    filePath: string,
    contextResult: ContextRulesResult
  ): boolean {
    // For maximum reliability, always include context when found
    // This ensures context rules are never missed due to session tracking
    console.log('[ContextTracker] shouldIncludeContext - always returning true for reliability');
    return true;
  }

  /**
   * Create a hash of context content for change detection
   */
  private hashContext(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastUpdated > this.SESSION_TIMEOUT) {
        console.log('[ContextTracker] Cleaning up expired session:', sessionId);
        this.sessions.delete(sessionId);
      }
    }
  }

  /**
   * Clear all session data (for testing/debugging)
   */
  clearAllSessions(): void {
    console.log('[ContextTracker] Clearing all sessions');
    this.sessions.clear();
  }

  /**
   * Get session info (for debugging)
   */
  getSessionInfo(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;
    
    return {
      sessionId: session.sessionId,
      knownFilesCount: session.knownFiles.size,
      deliveredContextCount: session.deliveredContext.size,
      knownFiles: Array.from(session.knownFiles),
      lastUpdated: new Date(session.lastUpdated).toISOString(),
    };
  }
}

export const contextTracker = new ContextTracker();
