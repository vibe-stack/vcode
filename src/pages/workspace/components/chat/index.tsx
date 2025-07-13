import React, { useCallback, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Send, Bot, Trash2, MoreHorizontal } from 'lucide-react';
import { ChatInput } from './chat-input';
import { useChat } from '@ai-sdk/react';
import { chatFetch } from './chat-fetch';
import { MessageComponent } from './chat-message';
import { ChatAttachment } from './types';
import { chatSerializationService } from './chat-serialization';

export function ChatPanel() {
    const { messages, append, setMessages, isLoading, addToolResult, stop } = useChat({
        api: '/api/chat', // This will be handled by our custom fetcher
        fetch: chatFetch,
        maxSteps: 5, // Enable multi-step functionality
        onResponse: (response) => {
            console.log("Received response:", response);
        },
        onFinish: (message) => {
            console.log("Chat finished with message:", message);
        },
        onError: (error) => {
            console.error("Chat error:", error);
        },
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Cleanup IPC listeners when component unmounts
    useEffect(() => {
        return () => {
            window.ai.removeAllListeners();
        };
    }, []);

    const handleEnhancedSend = useCallback((content: string, attachments: ChatAttachment[]) => {
        if (!content.trim()) return;

        // Create the message with attachments
        const message: any = {
            role: 'user',
            content,
        };

        // Add attachments if present
        if (attachments.length > 0) {
            message.experimental_attachments = attachments.map(attachment => ({
                name: attachment.name,
                contentType: getContentType(attachment),
                url: attachment.url || `file://${attachment.path}`,
                ...(attachment.content && { content: attachment.content }),
            }));
        }

        append(message);
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

    const handleClearChat = useCallback(() => {
        setMessages([]);
    }, [setMessages]);

    const handleToolApprove = useCallback(async (toolCallId: string) => {
        // Find the message and tool call
        const message = messages.find(msg => 
            msg.parts?.some(part => 
                part.type === 'tool-invocation' && 
                part.toolInvocation.toolCallId === toolCallId
            )
        );
        
        if (!message) return;

        const toolCall = message.parts?.find(
            part => part.type === 'tool-invocation' &&
                part.toolInvocation.toolCallId === toolCallId
        );

        if (toolCall && toolCall.type === 'tool-invocation') {
            let result: string;

            try {
                // Execute the tool on the frontend
                if (toolCall.toolInvocation.toolName === 'readFile') {
                    const args = toolCall.toolInvocation.args as { filePath: string };
                    const fileResult = await window.projectApi.openFile(args.filePath);
                    result = fileResult.content;
                } else {
                    result = `Unknown tool: ${toolCall.toolInvocation.toolName}`;
                }
            } catch (error) {
                result = `Error executing tool: ${error instanceof Error ? error.message : 'Unknown error'}`;
            }

            addToolResult({
                toolCallId,
                result,
            });
        }
    }, [messages, addToolResult]);

    const handleToolCancel = useCallback((toolCallId: string) => {
        addToolResult({
            toolCallId,
            result: 'Tool execution cancelled by user',
        });
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
                            onClick={handleClearChat}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
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
                            <div className="flex gap-3 p-3 rounded-lg bg-muted/50 mr-8">
                                <Bot className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                            <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        </div>
                                        <span className="text-xs text-muted-foreground">Thinking...</span>
                                    </div>
                                </div>
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
