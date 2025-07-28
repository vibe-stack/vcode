import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus } from 'lucide-react';
import { SimpleChatInput } from './simple-chat-input';
import { useChat } from '@ai-sdk/react';
import { mapBuilderChatFetch } from './map-builder-chat-fetch';
import { MessageComponent } from './chat-message';
import { EnhancedChatMessage } from './types';
import { mapBuilderToolExecutionService } from './map-tool-execution-service';
import { mapBuilderChatPersistenceService } from './map-builder-chat-persistence';
import { SimpleChatHistory } from './simple-chat-history';
import { GlobalMapChanges } from './global-map-changes';
import { useMapSnapshotStore } from './map-snapshot-store';
import { useMapBuilderStore } from '../../store';
import { StreamingIndicator } from './streaming-indicator';

export function ChatPanel() {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const [userMessageInitialState, setUserMessageInitialState] = useState<any>(null);

    const { messages, append, setMessages, isLoading, addToolResult, stop, status } = useChat({
        api: '/api/general-agent',
        fetch: mapBuilderChatFetch,
        maxSteps: 50,
        onResponse: () => { },
        onFinish: () => { },
        onError: (error) => {
            console.error('Chat API error:', error);
            // Optionally handle error, but no console output
        },
    });

    // Add tool calls to pending execution when they appear in messages
    React.useEffect(() => {
        messages.forEach(message => {
            if (message.role === 'assistant' && message.parts) {
                message.parts.forEach(part => {
                    if (part.type === 'tool-invocation' && part.toolInvocation.state === 'call') {
                        // Add to pending calls if not already added
                        const existingCall = mapBuilderToolExecutionService.getPendingCall(part.toolInvocation.toolCallId);
                        if (!existingCall) {
                            mapBuilderToolExecutionService.addPendingCall(
                                part.toolInvocation.toolCallId,
                                part.toolInvocation.toolName,
                                part.toolInvocation.args
                            );
                        }
                    }
                });
            }
        });
    }, [messages]);

    // Capture initial state when user sends a message (before AI responds)
    React.useEffect(() => {
        // When a new assistant message appears, store the initial state we captured
        if (messages.length >= 2 && userMessageInitialState) {
            const lastTwoMessages = messages.slice(-2);
            const [userMsg, assistantMsg] = lastTwoMessages;
            
            if (userMsg.role === 'user' && assistantMsg.role === 'assistant') {
                const snapshotStore = useMapSnapshotStore.getState();
                const existingInitialState = snapshotStore.getMessageInitialState(assistantMsg.id);
                
                if (!existingInitialState) {
                    // Store the state captured when the user sent their message
                    console.log(`💾 Storing initial state for assistant message ${assistantMsg.id}`);
                    snapshotStore.setMessageInitialState(assistantMsg.id, userMessageInitialState);
                    // Clear the temporary state
                    setUserMessageInitialState(null);
                }
            }
        }
    }, [messages, userMessageInitialState]);

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
                        await mapBuilderChatPersistenceService.updateSession(currentSessionId, enhancedMessages);
                    } else {
                        const sessionId = await mapBuilderChatPersistenceService.saveCurrentSession(enhancedMessages);
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
                const recentSessions = await mapBuilderChatPersistenceService.getRecentSessions(1);
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
        mapBuilderChatPersistenceService.cleanupOldSessions();

        return () => {
            // Clean up map builder AI listeners
            if (window.mapBuilderAI) {
                window.mapBuilderAI.removeAllListeners();
            }
        };
    }, []);

    const handleSimpleSend = useCallback((content: string) => {
        if (!content.trim()) return;
        const currentState = useMapBuilderStore.getState().objects;

        // Mark that user has interacted with chat
        setHasUserInteracted(true);

        // Capture the current state before user sends message
        console.log(`📸 User sending message, capturing current state (${currentState.length} objects)`);
        setUserMessageInitialState(currentState);

        // Create message parts with text content only
        const messageParts: any[] = [{ type: 'text', text: content }];

        console.log("sending message with content:", content, "and parts:", messageParts);
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
            const snapshotStore = useMapSnapshotStore.getState();
            snapshotStore.clearSessionSnapshots(currentSessionId);
        }

        setMessages([]);
        setCurrentSessionId(null);
        setHasUserInteracted(false);
    }, [setMessages, currentSessionId]);

    const handleLoadSession = useCallback(async (sessionId: string) => {
        try {
            const sessionMessages = await mapBuilderChatPersistenceService.loadSession(sessionId);
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
            setHasUserInteracted(true); // Loading a session means user has interacted
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    }, [setMessages]);

    const handleClearHistory = useCallback(async () => {
        try {
            await mapBuilderChatPersistenceService.clearCurrentProjectSessions();

            // Also clear snapshots for this session
            if (currentSessionId) {
                const snapshotStore = useMapSnapshotStore.getState();
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
            const result = await mapBuilderToolExecutionService.executeApprovedTool(toolCallId, messages, currentSessionId || '');
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
            const result = await mapBuilderToolExecutionService.cancelTool(toolCallId);
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

    const handleAcceptMapChanges = useCallback(async (messageId: string) => {
        if (!currentSessionId) return;

        const snapshotStore = useMapSnapshotStore.getState();
        snapshotStore.acceptAllSnapshots(currentSessionId, messageId);
    }, [currentSessionId]);

    const handleRejectMapChanges = useCallback(async (messageId: string) => {
        if (!currentSessionId) return;

        const snapshotStore = useMapSnapshotStore.getState();
        try {
            await snapshotStore.revertAllSnapshots(currentSessionId, messageId);
        } catch (error) {
            console.error('Failed to revert map changes:', error);
        }
    }, [currentSessionId]);

    const handleAcceptAllMapChanges = useCallback(async () => {
        if (!currentSessionId) return;

        const snapshotStore = useMapSnapshotStore.getState();
        snapshotStore.acceptAllPendingSnapshots(currentSessionId);
    }, [currentSessionId]);

    const handleRejectAllMapChanges = useCallback(async () => {
        if (!currentSessionId) return;

        const snapshotStore = useMapSnapshotStore.getState();
        try {
            await snapshotStore.revertAllPendingSnapshots(currentSessionId);
        } catch (error) {
            console.error('Failed to revert all map changes:', error);
        }
    }, [currentSessionId]);

    return (
        <div className="h-full max-h-full flex flex-col w-full max-w-full min-w-0">
            {/* Header */}
            <div className="border-b p-0 flex-shrink-0">
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
                        <SimpleChatHistory
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
                    <div className="p-0 space-y-4 w-full">
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
            <div className="flex-shrink-0">
                {currentSessionId && (
                    <GlobalMapChanges
                        sessionId={currentSessionId}
                        onAcceptAll={handleAcceptAllMapChanges}
                        onRejectAll={handleRejectAllMapChanges}
                    />
                )}
                <div className="px-0 pb-3">
                    <SimpleChatInput
                        onSend={handleSimpleSend}
                        onStop={handleStop}
                        isLoading={isLoading}
                        placeholder="What do you want to build?"
                        isNewChat={messages.length === 0 && !hasUserInteracted}
                    />
                </div>
            </div>
        </div>
    );
}
