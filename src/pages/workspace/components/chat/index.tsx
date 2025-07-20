import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus } from 'lucide-react';
import { ChatInput } from './chat-input';
import { useChat } from '@ai-sdk/react';
import { chatFetch } from './chat-fetch';
import { MessageComponent } from './chat-message';
import { ChatAttachment, EnhancedChatMessage } from './types';
import { toolExecutionService } from './tools/tool-execution-service';
import { chatPersistenceService } from './chat-persistence';
import { ChatHistory } from './chat-history';
import { GlobalFileChanges } from './global-file-changes';
import { useChatSnapshotStore } from '@/stores/chat-snapshots';
import { useSnapshotCleanup } from './hooks/use-snapshot-cleanup';
import { StreamingIndicator } from './streaming-indicator';

export function ChatPanel() {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    // Initialize snapshot cleanup
    useSnapshotCleanup();
    const { messages, append, setMessages, isLoading, addToolResult, stop, status } = useChat({
        api: '/api/chat', // This will be handled by our custom fetcher
        fetch: chatFetch,
        maxSteps: 50, // Enable multi-step functionality
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
            if (messages.length > 0) return; // Don't load if we already have messages

            try {
                const recentSessions = await chatPersistenceService.getRecentSessions(1);
                if (recentSessions.length > 0) {
                    const latestSession = recentSessions[0];
                    // Convert enhanced messages back to AI SDK format
                    const aiSdkMessages = latestSession.messages.map(msg => {
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
                    setHasUserInteracted(true); // Loading existing session means user has interacted
                }
            } catch (error) {
                console.error('Failed to load initial session:', error);
            }
        };

        loadInitialSession();
    }, [setMessages]);

    // Cleanup IPC listeners when component unmounts
    useEffect(() => {
        // Cleanup old sessions periodically
        chatPersistenceService.cleanupOldSessions();

        return () => {
            window.ai.removeAllListeners();
        };
    }, []);

    const handleEnhancedSend = useCallback((content: string, attachments: ChatAttachment[]) => {
        if (!content.trim()) return;

        // Mark that user has interacted with chat
        setHasUserInteracted(true);

        // Build message content with XML-like tags for attachments
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

        // Create message parts with text content and attachment metadata
        const messageParts: any[] = [{ type: 'text', text: messageContent }];

        // Add attachment metadata for display purposes
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
        // Clear snapshots for current session
        if (currentSessionId) {
            const snapshotStore = useChatSnapshotStore.getState();
            snapshotStore.clearSessionSnapshots(currentSessionId);
        }

        setMessages([]);
        setCurrentSessionId(null);
        setHasUserInteracted(false);
    }, [setMessages, currentSessionId]);

    const handleLoadSession = useCallback(async (sessionId: string) => {
        try {
            const sessionMessages = await chatPersistenceService.loadSession(sessionId);
            // Convert enhanced messages back to AI SDK format
            const aiSdkMessages = sessionMessages.map(msg => {
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
            setHasUserInteracted(true); // Loading a session means user has interacted
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    }, [setMessages]);

    const handleClearHistory = useCallback(async () => {
        try {
            await chatPersistenceService.clearCurrentProjectSessions();

            // Also clear snapshots for this session
            if (currentSessionId) {
                const snapshotStore = useChatSnapshotStore.getState();
                snapshotStore.clearSessionSnapshots(currentSessionId);
            }

            setMessages([]);
            setCurrentSessionId(null);
            setHasUserInteracted(false);
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

    return (
        <div className="h-full flex flex-col border-l bg-background w-full max-w-full min-w-0">
            {/* Header */}
            <div className="border-b p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">Grok Assistant</h2>
                    <div className="flex items-center gap-1">
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
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreHorizontal className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden w-full">
                <div className="h-full w-full overflow-y-auto" >
                    <div className="p-3 space-y-4 w-full">
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
                            <StreamingIndicator status={status} isLoading={isLoading} />
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t flex-shrink-0">
                {currentSessionId && (
                    <GlobalFileChanges
                        sessionId={currentSessionId}
                        onAcceptAll={handleAcceptAllFileChanges}
                        onRejectAll={handleRejectAllFileChanges}
                    />
                )}
                <div className="px-3 pb-3">
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
    );
}
