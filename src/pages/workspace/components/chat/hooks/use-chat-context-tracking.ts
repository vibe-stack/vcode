import { useEffect, useRef } from 'react';
import { Message } from '@ai-sdk/ui-utils';

export function useChatContextTracking(
  sessionId: string | null, 
  messages: Message[],
  setMessages?: (messages: Message[] | ((prev: Message[]) => Message[])) => void
) {
  const lastProcessedMessageCount = useRef(0);
  const initialContextProvided = useRef(new Set<string>());

  // Provide initial project context for new sessions
  useEffect(() => {
    if (!sessionId || !setMessages || initialContextProvided.current.has(sessionId)) {
      return;
    }

    const provideInitialContext = async () => {
      try {
        const currentProject = await window.projectApi?.getCurrentProject();
        if (!currentProject) return;

        // Get project-level context directly from the context rules service
        const { contextRulesService } = await import('../tools/context-rules-service');
        const initialContext = await contextRulesService.getContextForFile(currentProject, currentProject);
        
        if (initialContext && messages.length === 0) {
          // Add initial context as a system message at the start of the conversation
          const systemMessage: Message = {
            id: `context-${sessionId}`,
            role: 'system',
            content: `# Project Context Rules

${initialContext.rules}

**These are project-specific requirements that must be followed in all code modifications and file operations.**`,
            createdAt: new Date()
          };

          setMessages((prev: Message[]) => {
            // Only add if there are no messages yet
            if (prev.length === 0) {
              return [systemMessage];
            }
            return prev;
          });

          // Log for debugging
          console.log('[useChatContextTracking] Initial project context added as system message:', {
            sources: initialContext.sources.length,
            rules: initialContext.rules.substring(0, 200) + '...'
          });
        }

        initialContextProvided.current.add(sessionId);
      } catch (error) {
        console.warn('[useChatContextTracking] Error providing initial context:', error);
      }
    };

    provideInitialContext();
  }, [sessionId, messages.length, setMessages]);

  useEffect(() => {
    if (!sessionId || messages.length <= lastProcessedMessageCount.current) {
      return;
    }

    // Process new messages for context tracking
    const newMessages = messages.slice(lastProcessedMessageCount.current);
    
    const processMessagesForContext = async () => {
      try {
        const currentProject = await window.projectApi?.getCurrentProject();
        if (!currentProject) return;

        // Look for file attachments or references in new messages
        const attachedFilePaths: string[] = [];
        
        for (const message of newMessages) {
          if (message.role === 'user') {
            // Handle different message content formats
            let content = '';
            if (typeof message.content === 'string') {
              content = message.content;
            } else if (message.content && typeof message.content === 'object') {
              // For complex content structures, try to extract text
              content = String(message.content);
            }
            
            // Look for file path patterns in the content
            const fileExtensions = ['ts', 'tsx', 'js', 'jsx', 'json', 'md', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'xml', 'yaml', 'yml', 'vue', 'svelte', 'go', 'rs', 'php', 'rb'];
            const extensionPattern = fileExtensions.join('|');
            
            const filePatterns = [
              // Paths mentioned in context like "file: path/to/file.ts" or "reading src/components/Button.tsx"
              new RegExp(`(?:file:|path:|reading|attached|looking at|in |from |edit |modify |update |create ).*?([\\w\\-_\\.\\/]+\\.(?:${extensionPattern}))`, 'gi'),
              // Standalone file paths
              new RegExp(`^([\\w\\-_\\.\\/]+\\.(?:${extensionPattern}))$`, 'gm'),
              // Relative paths with folders
              new RegExp(`([\\w\\-_]+(?:\\/[\\w\\-_]+)*\\/[\\w\\-_]+\\.(?:${extensionPattern}))`, 'g')
            ];
            
            for (const pattern of filePatterns) {
              const matches = content.matchAll(pattern);
              for (const match of matches) {
                if (match[1]) {
                  let filePath = match[1].trim();
                  // Skip if it looks like a URL or has invalid characters
                  if (filePath.includes('http') || filePath.includes('@') || filePath.length > 200) {
                    continue;
                  }
                  
                  if (!filePath.startsWith('/')) {
                    filePath = `${currentProject}/${filePath}`;
                  }
                  attachedFilePaths.push(filePath);
                }
              }
            }
          }
        }

        // For now, we don't track individual file attachments since the context system
        // automatically handles context when files are read/written via the tools
        // This could be enhanced later for proactive context provision

      } catch (error) {
        console.warn('[useChatContextTracking] Error processing context:', error);
      }
    };

    processMessagesForContext();
    lastProcessedMessageCount.current = messages.length;
  }, [sessionId, messages]);

  // Clear context session when sessionId changes
  useEffect(() => {
    return () => {
      // Cleanup could be added here if needed
      // For now, context sessions are managed by the context tracker itself
    };
  }, [sessionId]);
}
