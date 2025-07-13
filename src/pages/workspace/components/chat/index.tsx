import React, { useCallback, useRef, useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Send, Bot, Trash2, MoreHorizontal, Plus } from 'lucide-react';
import { ChatInput } from './chat-input';
import { useChat } from '@ai-sdk/react';
import { chatFetch } from './chat-fetch';
import { MessageComponent } from './chat-message';
import { ChatAttachment } from './types';
import { chatSerializationService } from './chat-serialization';
import { toolExecutionService } from './tools/tool-execution-service';
import { chatPersistenceService } from './chat-persistence';
import { ChatHistory } from './chat-history';
import DotMatrix from '@/components/ui/animated-dot-matrix';

export function ChatPanel() {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const { messages, append, setMessages, isLoading, addToolResult, stop } = useChat({
        api: '/api/chat', // This will be handled by our custom fetcher
        fetch: chatFetch,
        maxSteps: 5, // Enable multi-step functionality
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
                            content: msg.content,
                            role: msg.role as 'user' | 'assistant',
                            timestamp: msg.createdAt || new Date(),
                            attachments: msg.experimental_attachments?.map(att => ({
                                id: att.name || `attachment-${Date.now()}`,
                                type: att.url?.startsWith('file://') ? 'file' as const : 'url' as const,
                                name: att.name || 'Unknown',
                                url: att.url,
                                path: att.url?.startsWith('file://') ? att.url.replace('file://', '') : undefined,
                            })),
                        }));

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
                    const aiSdkMessages = latestSession.messages.map(msg => ({
                        id: msg.id,
                        role: msg.role,
                        content: msg.content,
                        createdAt: msg.timestamp,
                        experimental_attachments: msg.attachments?.map(att => ({
                            name: att.name,
                            contentType: att.type === 'file' ? 'text/plain' : 'text/html',
                            url: att.url || '',
                        })).filter(att => att.url),
                    }));
                    setMessages(aiSdkMessages);
                    setCurrentSessionId(latestSession.id);
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

        // Convert ChatAttachment[] to the format expected by AI SDK
        const experimental_attachments = attachments.map(attachment => {
            const exp_attachment: any = {
                name: attachment.name,
                contentType: getContentType(attachment),
            };
            // Add content for file attachments
            if (attachment.content) {
                exp_attachment.content = attachment.content;
            }
            // Add URL for URL attachments
            if (attachment.url) {
                exp_attachment.url = attachment.url;
            } else if (attachment.path) {
                exp_attachment.url = `file://${attachment.path}`;
            }
            return exp_attachment;
        });

        // Use append with experimental_attachments in the options
        append(
            {
                role: 'user',
                content,
            },
            {
                experimental_attachments: experimental_attachments.length > 0 ? experimental_attachments : undefined,
            }
        );
    }, [append]);

    const getContentType = (attachment: ChatAttachment): string => {
        if (attachment.type === 'url') {
            return 'text/html';
        }

        if (attachment.path) {
            const extension = attachment.path.split('.').pop()?.toLowerCase();
            const contentTypes: Record<string, string> = {
                'js': 'application/javascript',
                'jsx': 'application/javascript',
                'ts': 'application/typescript',
                'tsx': 'application/typescript',
                'css': 'text/css',
                'html': 'text/html',
                'json': 'application/json',
                'md': 'text/markdown',
                'txt': 'text/plain',
                'py': 'text/x-python',
                'java': 'text/x-java',
                'cpp': 'text/x-c++',
                'c': 'text/x-c',
                'php': 'text/x-php',
                'rb': 'text/x-ruby',
                'go': 'text/x-go',
                'rs': 'text/x-rust',
                'swift': 'text/x-swift',
                'kt': 'text/x-kotlin',
            };

            return contentTypes[extension || ''] || 'text/plain';
        }

        return 'text/plain';
    };

    const handleStop = useCallback(() => {
        if (stop) stop();
    }, [stop]);

    const handleCopyMessage = useCallback((content: string) => {
        navigator.clipboard.writeText(content);
    }, []);

    const handleDeleteMessage = useCallback((id: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
    }, [setMessages]);

    const handleNewChat = useCallback(() => {
        setMessages([]);
        setCurrentSessionId(null);
    }, [setMessages]);

    const handleLoadSession = useCallback(async (sessionId: string) => {
        try {
            const sessionMessages = await chatPersistenceService.loadSession(sessionId);
            // Convert enhanced messages back to AI SDK format
            const aiSdkMessages = sessionMessages.map(msg => ({
                id: msg.id,
                role: msg.role,
                content: msg.content,
                createdAt: msg.timestamp,
                experimental_attachments: msg.attachments?.map(att => ({
                    name: att.name,
                    contentType: att.type === 'file' ? 'text/plain' : 'text/html',
                    url: att.url || '',
                })).filter(att => att.url),
            }));
            setMessages(aiSdkMessages);
            setCurrentSessionId(sessionId);
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    }, [setMessages]);

    const handleClearHistory = useCallback(async () => {
        try {
            await chatPersistenceService.clearCurrentProjectSessions();
            setMessages([]);
            setCurrentSessionId(null);
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
        <div className="h-full flex flex-col border-l bg-background w-full min-w-0">
            {/* Header */}
            <div className="border-b p-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium">AI Assistant</h2>
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
            <div className="flex-1 overflow-hidden min-w-0">
                <ScrollArea className="h-full w-full">
                    <div className="p-3 space-y-4 min-w-0">
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

                            <div className="flex-1 min-w-0">
                                <DotMatrix
                                    baseColor='#444'
                                    fillColor="#4caf50"
                                    dotSize={3}
                                    rows={3}
                                    fillSpeed={1200}
                                    autoFill={true}
                                />
                            </div>

                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>
            </div>

            {/* Input Area */}
            <div className="border-t p-3 flex-shrink-0">
                <ChatInput
                    onSend={handleEnhancedSend}
                    onStop={handleStop}
                    isLoading={isLoading}
                    placeholder="Ask me anything about your project..."
                />
            </div>
        </div>
    );
}
