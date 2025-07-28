import { useChat } from '@ai-sdk/react';
import { useCallback, useEffect, useState } from 'react';
import { AgentChatConfig, EnhancedChatMessage, ToolExecutor, ChatPersistence } from './types';
import { createAgentChatFetch } from './agent-chat-fetch';

interface UseAgentChatOptions {
  toolExecutor?: ToolExecutor;
  persistence?: ChatPersistence;
  onStateCapture?: () => any;
  onStateRestore?: (state: any) => void;
}

export function useAgentChat(config: AgentChatConfig, options: UseAgentChatOptions = {}) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [userMessageInitialState, setUserMessageInitialState] = useState<any>(null);

  const chatFetch = config.customFetch || createAgentChatFetch(config.name);

  const { messages, append, setMessages, isLoading, addToolResult, stop, status } = useChat({
    api: config.apiEndpoint,
    fetch: chatFetch,
    maxSteps: config.maxSteps || 50,
    onResponse: () => { },
    onFinish: () => { },
    onError: (error) => {
      console.error('Chat API error:', error);
    },
  });

  // Add tool calls to pending execution when they appear in messages
  useEffect(() => {
    if (!options.toolExecutor) return;

    messages.forEach(message => {
      if (message.role === 'assistant' && message.parts) {
        message.parts.forEach(part => {
          if (part.type === 'tool-invocation' && part.toolInvocation.state === 'call') {
            // Add to pending calls if not already added
            const existingCall = options.toolExecutor!.getPendingCall(part.toolInvocation.toolCallId);
            if (!existingCall) {
              options.toolExecutor!.addPendingCall(
                part.toolInvocation.toolCallId,
                part.toolInvocation.toolName,
                part.toolInvocation.args
              );
            }
          }
        });
      }
    });
  }, [messages, options.toolExecutor]);

  // Handle state snapshots if enabled
  useEffect(() => {
    if (!config.snapshots || !options.onStateCapture) return;

    // When a new assistant message appears, store the initial state we captured
    if (messages.length >= 2 && userMessageInitialState) {
      const lastTwoMessages = messages.slice(-2);
      const [userMsg, assistantMsg] = lastTwoMessages;
      
      if (userMsg.role === 'user' && assistantMsg.role === 'assistant') {
        // Store the state captured when the user sent their message
        console.log(`💾 Storing initial state for assistant message ${assistantMsg.id}`);
        // Here you would integrate with your snapshot system
        setUserMessageInitialState(null);
      }
    }
  }, [messages, userMessageInitialState, config.snapshots, options.onStateCapture]);

  // Auto-save messages when they change
  useEffect(() => {
    if (!options.persistence || messages.length === 0) return;

    const saveMessages = async () => {
      try {
        const enhancedMessages = messages
          .filter(msg => msg.role === 'user' || msg.role === 'assistant')
          .map(msg => ({
            timestamp: msg.createdAt || new Date(),
            createdAt: msg.createdAt,
            ...msg
          }) as EnhancedChatMessage);

        if (enhancedMessages.length === 0) return;

        if (currentSessionId) {
          await options.persistence!.updateSession(currentSessionId, enhancedMessages);
        } else {
          const sessionId = await options.persistence!.saveCurrentSession(enhancedMessages);
          setCurrentSessionId(sessionId);
        }
      } catch (error) {
        console.error('Failed to save chat session:', error);
      }
    };

    // Debounce saving to avoid too many calls
    const timeoutId = setTimeout(saveMessages, 1000);
    return () => clearTimeout(timeoutId);
  }, [messages, currentSessionId, options.persistence]);

  // Load initial session from storage if available
  useEffect(() => {
    if (!options.persistence) return;

    const loadInitialSession = async () => {
      if (messages.length > 0) return; // Don't load if we already have messages

      try {
        const recentSessions = await options.persistence!.getRecentSessions(1);
        if (recentSessions.length > 0) {
          const latestSession = recentSessions[0];
          // Convert enhanced messages back to AI SDK format
          const aiSdkMessages = latestSession.messages.map((msg: EnhancedChatMessage) => {
            // Extract content from parts for backward compatibility
            const textPart = msg.parts?.find((part: any) => part.type === 'text');
            const content = textPart?.text || '';

            return {
              id: msg.id,
              role: msg.role,
              content,
              parts: msg.parts || [],
              createdAt: msg.timestamp,
            };
          });
          setMessages(aiSdkMessages);
          setCurrentSessionId(latestSession.id);
          setHasUserInteracted(true);
        }
      } catch (error) {
        console.error('Failed to load initial session:', error);
      }
    };

    loadInitialSession();
  }, [setMessages, options.persistence]);

  // Cleanup IPC listeners when component unmounts
  useEffect(() => {
    if (options.persistence) {
      options.persistence.cleanupOldSessions();
    }

    return () => {
      // Clean up AI listeners
      const handlerName = config.name === 'mapBuilder' ? 'mapBuilderAI' : `${config.name}AI`;
      const handler = (window as any)[handlerName];
      if (handler) {
        handler.removeAllListeners();
      }
    };
  }, [config.name, options.persistence]);

  const handleSend = useCallback((content: string) => {
    if (!content.trim()) return;

    setHasUserInteracted(true);

    // Capture the current state before user sends message if snapshots enabled
    if (config.snapshots && options.onStateCapture) {
      const currentState = options.onStateCapture();
      console.log(`📸 User sending message, capturing current state`);
      setUserMessageInitialState(currentState);
    }

    // Create message parts with text content only
    const messageParts: any[] = [{ type: 'text', text: content }];

    console.log("sending message with content:", content, "and parts:", messageParts);
    append({
      role: 'user',
      parts: messageParts
    } as any);
  }, [append, config.snapshots, options.onStateCapture]);

  const handleToolApprove = useCallback(async (toolCallId: string) => {
    if (!options.toolExecutor) return;

    try {
      const result = await options.toolExecutor.executeApprovedTool(toolCallId, messages, currentSessionId || '');
      addToolResult({
        toolCallId,
        result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addToolResult({
        toolCallId,
        result: errorMessage,
      });
    }
  }, [messages, addToolResult, currentSessionId, options.toolExecutor]);

  const handleToolCancel = useCallback(async (toolCallId: string) => {
    if (!options.toolExecutor) return;

    try {
      const result = await options.toolExecutor.cancelTool(toolCallId);
      addToolResult({
        toolCallId,
        result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool execution cancelled by user';
      addToolResult({
        toolCallId,
        result: errorMessage,
      });
    }
  }, [addToolResult, options.toolExecutor]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setHasUserInteracted(false);
  }, [setMessages]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    if (!options.persistence) return;

    try {
      const sessionMessages = await options.persistence.loadSession(sessionId);
      // Convert enhanced messages back to AI SDK format
      const aiSdkMessages = sessionMessages.map((msg: EnhancedChatMessage) => {
        // Extract content from parts for backward compatibility
        const textPart = msg.parts?.find((part: any) => part.type === 'text');
        const content = textPart?.text || '';

        return {
          id: msg.id,
          role: msg.role,
          content,
          parts: msg.parts || [],
          createdAt: msg.timestamp,
        };
      });
      setMessages(aiSdkMessages);
      setCurrentSessionId(sessionId);
      setHasUserInteracted(true);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, [setMessages, options.persistence]);

  const handleClearHistory = useCallback(async () => {
    if (!options.persistence) return;

    try {
      await options.persistence.clearCurrentProjectSessions();
      setMessages([]);
      setCurrentSessionId(null);
      setHasUserInteracted(false);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, [setMessages, options.persistence]);

  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, [setMessages]);

  return {
    // AI SDK hooks
    messages,
    append,
    setMessages,
    isLoading,
    addToolResult,
    stop,
    status,

    // Custom handlers
    handleSend,
    handleToolApprove,
    handleToolCancel,
    handleNewChat,
    handleLoadSession,
    handleClearHistory,
    handleDeleteMessage,

    // State
    currentSessionId,
    hasUserInteracted,
    toolExecutor: options.toolExecutor,
  };
}