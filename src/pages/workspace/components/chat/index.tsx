import React, { useCallback, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Bot, Trash2, MoreHorizontal } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { chatFetch } from './chat-fetch';
import { MessageComponent } from './chat-message';

export function ChatPanel() {
    const { messages, input, handleInputChange, handleSubmit, setMessages, isLoading, addToolResult } = useChat({
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

    const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            handleSubmit();
        }
    }, [handleSubmit]);

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
        <div className="h-full flex flex-col border-l bg-background">
            {/* Header */}
            <div className="border-b p-3">
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
            <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                    <div className="p-3 space-y-4">
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
                                <div className="flex-1">
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
            <div className="border-t p-3">
                <div className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about your project..."
                        className="flex-1 resize-none min-h-0 h-20 text-sm"
                        disabled={isLoading}
                    />
                    <Button
                        onClick={() => {
                            handleSubmit();
                        }}
                        disabled={!input.trim() || isLoading}
                        size="sm"
                        className="h-20"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                </div>
            </div>
        </div>
    );
}
