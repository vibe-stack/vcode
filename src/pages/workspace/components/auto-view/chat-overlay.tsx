import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, MoreHorizontal, X } from 'lucide-react';
import { ChatInput } from '../chat/chat-input';
import { useChat } from '@ai-sdk/react';
import { chatFetch } from '../chat/chat-fetch';
import { MessageComponent } from '../chat/chat-message';
import { ChatAttachment, EnhancedChatMessage } from '../chat/types';
import { toolExecutionService } from '../chat/tools/tool-execution-service';
import { chatPersistenceService } from '../chat/chat-persistence';
import { ChatHistory } from '../chat/chat-history';
import { GlobalFileChanges } from '../chat/global-file-changes';
import { useChatSnapshotStore } from '@/stores/chat-snapshots';
import { useSnapshotCleanup } from '../chat/hooks/use-snapshot-cleanup';
import DotMatrix from '@/components/ui/animated-dot-matrix';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/tailwind';

interface ChatOverlayProps {
  isVisible: boolean;
  onClose: () => void;
}

export function ChatOverlay({ isVisible, onClose }: ChatOverlayProps) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Initialize snapshot cleanup
  useSnapshotCleanup();
  
  const { messages, append, setMessages, isLoading, addToolResult, stop } = useChat({
    api: '/api/chat',
    fetch: chatFetch,
    maxSteps: 50,
    onResponse: () => { },
    onFinish: () => { },
    onError: (error) => {
      // Optionally handle error, but no console output
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 0) {
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
            await chatPersistenceService.updateSession(currentSessionId, enhancedMessages);
          } else {
            const sessionId = await chatPersistenceService.saveCurrentSession(enhancedMessages);
            setCurrentSessionId(sessionId);
          }
        } catch (error) {
          console.error('Failed to save chat session:', error);
        }
      };

      // Debounce saving to avoid too many calls
      const timeoutId = setTimeout(saveMessages, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, currentSessionId]);

  // Load initial session from storage if available
  useEffect(() => {
    const loadInitialSession = async () => {
      if (messages.length > 0) return;

      try {
        const recentSessions = await chatPersistenceService.getRecentSessions(1);
        if (recentSessions.length > 0) {
          const latestSession = recentSessions[0];
          const aiSdkMessages = latestSession.messages.map(msg => {
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
  }, [setMessages]);

  // Cleanup IPC listeners when component unmounts
  useEffect(() => {
    chatPersistenceService.cleanupOldSessions();

    return () => {
      window.ai.removeAllListeners();
    };
  }, []);

  const handleEnhancedSend = useCallback((content: string, attachments: ChatAttachment[]) => {
    if (!content.trim()) return;

    setHasUserInteracted(true);

    let messageContent = content;

    if (attachments.length > 0) {
      const attachmentXml = [
        `<attached_files>`,
        `<amount>${attachments.length}</amount>`,
        ...attachments.map(att => {
          const filePath = att.path || att.url || '';
          return `<file path="${filePath}" />`;
        }),
        `</attached_files>`
      ].join('\n');

      messageContent = `${content}\n\n${attachmentXml}`;
    }

    const messageParts: any[] = [{ type: 'text', text: messageContent }];

    if (attachments.length > 0) {
      messageParts.push({
        type: 'attachments',
        attachments: attachments
      });
    }

    console.log("sending message with content:", messageContent, "and parts:", messageParts);
    append({
      role: 'user',
      parts: messageParts
    } as any);
  }, [append]);

  const handleStop = () => {
    stop();
  }

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, [setMessages]);

  const handleNewChat = useCallback(() => {
    if (currentSessionId) {
      const snapshotStore = useChatSnapshotStore.getState();
      snapshotStore.clearSessionSnapshots(currentSessionId);
    }

    setMessages([]);
    setCurrentSessionId(null);
    setHasUserInteracted(false);
    setShowMessages(false);
  }, [setMessages, currentSessionId]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      const sessionMessages = await chatPersistenceService.loadSession(sessionId);
      const aiSdkMessages = sessionMessages.map(msg => {
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
  }, [setMessages]);

  const handleClearHistory = useCallback(async () => {
    try {
      await chatPersistenceService.clearCurrentProjectSessions();

      if (currentSessionId) {
        const snapshotStore = useChatSnapshotStore.getState();
        snapshotStore.clearSessionSnapshots(currentSessionId);
      }

      setMessages([]);
      setCurrentSessionId(null);
      setHasUserInteracted(false);
      setShowMessages(false);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  }, [setMessages, currentSessionId]);

  const handleToolApprove = useCallback(async (toolCallId: string) => {
    try {
      const result = await toolExecutionService.executeApprovedTool(toolCallId, messages, currentSessionId || '');
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
  }, [messages, addToolResult, currentSessionId]);

  const handleToolCancel = useCallback(async (toolCallId: string) => {
    try {
      const result = await toolExecutionService.cancelTool(toolCallId);
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
  }, [addToolResult]);

  const handleAcceptFileChanges = useCallback(async (messageId: string) => {
    if (!currentSessionId) return;

    const snapshotStore = useChatSnapshotStore.getState();
    snapshotStore.acceptAllSnapshots(currentSessionId, messageId);
  }, [currentSessionId]);

  const handleRejectFileChanges = useCallback(async (messageId: string) => {
    if (!currentSessionId) return;

    const snapshotStore = useChatSnapshotStore.getState();
    try {
      await snapshotStore.revertAllSnapshots(currentSessionId, messageId);
    } catch (error) {
      console.error('Failed to revert file changes:', error);
    }
  }, [currentSessionId]);

  const handleAcceptAllFileChanges = useCallback(async () => {
    if (!currentSessionId) return;

    const snapshotStore = useChatSnapshotStore.getState();
    snapshotStore.acceptAllPendingSnapshots(currentSessionId);
  }, [currentSessionId]);

  const handleRejectAllFileChanges = useCallback(async () => {
    if (!currentSessionId) return;

    const snapshotStore = useChatSnapshotStore.getState();
    try {
      await snapshotStore.revertAllPendingSnapshots(currentSessionId);
    } catch (error) {
      console.error('Failed to revert all file changes:', error);
    }
  }, [currentSessionId]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Messages overlay - shown above input when enabled */}
      {showMessages && (
        <div className="absolute bottom-68 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <div className="w-[600px] max-w-[90vw] bg-background/85 border rounded-lg shadow-lg">
            {/* Messages header */}
            <div className="border-b p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Chat History</span>
                {messages.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({messages.length} message{messages.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowMessages(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Messages content */}
            <ScrollArea className="h-[400px]">
              <div className="p-3 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm py-8">
                    No messages yet. Start a conversation below!
                  </div>
                ) : (
                  <>
                    {messages.map((message, index) => (
                      <MessageComponent
                        key={message.id}
                        message={message}
                        onCopy={handleCopyMessage}
                        onDelete={handleDeleteMessage}
                        onToolApprove={handleToolApprove}
                        onToolCancel={handleToolCancel}
                      />
                    ))}

                    {isLoading && (
                      <div className="flex justify-start">
                        <DotMatrix
                          baseColor='#444'
                          fillColor="#4caf50"
                          dotSize={3}
                          rows={3}
                          fillSpeed={3000}
                          autoFill={true}
                        />
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      )}

      {/* Input overlay - fixed at bottom center */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 pointer-events-auto">
        <div className="w-[600px] max-w-[90vw] bg-background/85 backdrop-blur-sm border rounded-lg shadow-lg">
          {/* Global file changes */}
          {currentSessionId && (
            <GlobalFileChanges
              sessionId={currentSessionId}
              onAcceptAll={handleAcceptAllFileChanges}
              onRejectAll={handleRejectAllFileChanges}
            />
          )}

          {/* Header with controls */}
          <div className="border-b p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm font-medium">Grok Assistant</span>
            </div>
            
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  variant={showMessages ? "default" : "ghost"}
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => setShowMessages(!showMessages)}
                  title={showMessages ? "Hide Messages" : "Show Messages"}
                >
                  <MessageSquare className="h-3 w-3" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleNewChat}
                title="New Chat"
              >
                <Plus className="h-3 w-3" />
              </Button>
              
              <ChatHistory
                onLoadSession={handleLoadSession}
                onClearHistory={handleClearHistory}
                currentSessionId={currentSessionId || undefined}
              />
              
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={onClose}
                title="Close Chat"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Input area */}
          <div className="p-3">
            <ChatInput
              onSend={handleEnhancedSend}
              onStop={handleStop}
              isLoading={isLoading}
              placeholder="Ask me anything about your project..."
              isNewChat={messages.length === 0 && !hasUserInteracted}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
