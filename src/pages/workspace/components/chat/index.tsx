import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus, Bot, Code2 } from 'lucide-react';
import { ChatInput } from './chat-input';
import { useChat } from '@ai-sdk/react';
import { chatFetch } from './chat-fetch';
import { MessageComponent } from './chat-message';
import { ChatAttachment } from './types';
import { toolExecutionService } from './tools/tool-execution-service';
import { chatPersistenceService } from './chat-persistence';
import { ChatHistory } from './chat-history';
import DotMatrix from '@/components/ui/animated-dot-matrix';
import { cn } from '@/utils/tailwind';

interface ChatPanelProps {
    isAgentMode?: boolean;
    onToggleAgentMode?: () => void;
}

export function ChatPanel({ isAgentMode = false, onToggleAgentMode }: ChatPanelProps) {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);
    const { messages, append, setMessages, isLoading, addToolResult, stop } = useChat({
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
                            id: msg.id,
                            role: msg.role as 'user' | 'assistant',
                            parts: msg.parts || [],
                            timestamp: msg.createdAt || new Date(),
                            createdAt: msg.createdAt,
                            ...msg
                        }));

                    console.log('Saving enhanced messages:', enhancedMessages);

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
        setMessages([]);
        setCurrentSessionId(null);
        setHasUserInteracted(false);
    }, [setMessages]);

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
            setMessages([]);
            setCurrentSessionId(null);
            setHasUserInteracted(false);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }, [setMessages]);

    const handleToolApprove = useCallback(async (toolCallId: string) => {
        try {
            const result = await toolExecutionService.executeApprovedTool(toolCallId, messages);
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
    }, [messages, addToolResult]);

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

    return (
        <div className={cn(
            "h-full flex flex-col bg-sidebar w-full max-w-full min-w-0",
            !isAgentMode && "border-l"
        )}>
            {/* Header */}
            <div className="border-b px-4 py-3 flex-shrink-0 bg-gradient-to-b from-background to-background/80">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold tracking-tight">AI Assistant</h2>
                    <div className="flex items-center gap-1">
                        {onToggleAgentMode && (
                            <div className="flex items-center gap-0.5 mr-2 bg-muted rounded-md p-0.5">
                                <Button 
                                    variant={isAgentMode ? "default" : "ghost"} 
                                    size="sm" 
                                    className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
                                    onClick={onToggleAgentMode}
                                    title="Agent Mode - Full screen chat"
                                >
                                    <Bot className="h-3.5 w-3.5" />
                                    Agent
                                </Button>
                                <Button 
                                    variant={!isAgentMode ? "default" : "ghost"} 
                                    size="sm" 
                                    className="h-7 px-2.5 text-xs gap-1.5 rounded-sm"
                                    onClick={onToggleAgentMode}
                                    title="Code Mode - Show code editor and files"
                                >
                                    <Code2 className="h-3.5 w-3.5" />
                                    Code
                                </Button>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg"
                            onClick={handleNewChat}
                            title="New Chat"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                        <ChatHistory
                            onLoadSession={handleLoadSession}
                            onClearHistory={handleClearHistory}
                            currentSessionId={currentSessionId || undefined}
                        />
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden w-full">
                <div className="h-full w-full overflow-y-auto" >
                    <div className={cn(
                        "space-y-4 w-full",
                        isAgentMode ? "max-w-4xl mx-auto p-8" : "p-4"
                    )}>
                        {messages.map((message) => (
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
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t flex-shrink-0 bg-gradient-to-t from-background to-background/80">
                <div className={cn(
                    isAgentMode ? "max-w-4xl mx-auto p-6" : "p-4"
                )}>
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
