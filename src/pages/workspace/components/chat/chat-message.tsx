import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Bot, User, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { Message } from 'ai';
import { ToolCallHandler } from './tool-call-handler';
import { AttachmentDisplay } from './attachment-display';
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MessageProps {
    message: Message;
    onCopy: (content: string) => void;
    onDelete: (id: string) => void;
    onToolApprove?: (toolCallId: string) => void;
    onToolCancel?: (toolCallId: string) => void;
}


export function MessageComponent({ message, onCopy, onDelete, onToolApprove, onToolCancel }: MessageProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleCopy = useCallback(() => {
        onCopy(message.content);
    }, [message.content, onCopy]);

    const handleDelete = useCallback(() => {
        onDelete(message.id);
    }, [message.id, onDelete]);

    // Function to render message parts
    const renderMessageParts = () => {
        // If no parts, render the content directly (fallback)
        if (!message.parts || message.parts.length === 0) {
            return (
                <div className="text-sm whitespace-pre-wrap break-words">
                    <Markdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                            p: ({ children }) => <p className="break-words">{children}</p>,
                            code: ({ children }) => <code className="break-all">{children}</code>,
                            pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>
                        }}
                    >
                        {message.content}
                    </Markdown>
                </div>
            );
        }

        return (
            <>
                {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                        return (
                            <div key={index} className="text-sm whitespace-pre-wrap break-words">
                                <Markdown 
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({ children }) => <p className="break-words">{children}</p>,
                                        code: ({ children }) => <code className="break-all">{children}</code>,
                                        pre: ({ children }) => <pre className="overflow-x-auto">{children}</pre>
                                    }}
                                >
                                    {part.text}
                                </Markdown>
                            </div>
                        );
                    } else if (part.type === 'tool-invocation') {
                        return (
                            <ToolCallHandler
                                key={`${message.id}-tool-${index}`}
                                toolCallId={part.toolInvocation.toolCallId}
                                toolName={part.toolInvocation.toolName}
                                args={part.toolInvocation.args}
                                state={part.toolInvocation.state}
                                result={part.toolInvocation.state === 'result' ? (part.toolInvocation as any).result : undefined}
                                onApprove={onToolApprove}
                                onCancel={onToolCancel}
                            />
                        );
                    }
                    return null;
                })}
            </>
        );
    };

    return (
        <div
            className={cn(
                "flex gap-3 p-3 rounded-lg",
                message.role === 'user' && "bg-primary/10 ml-8"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex-1 overflow-hidden">
                <div className="space-y-2">
                    {renderMessageParts()}
                </div>

                {/* Display attachments if present */}
                {(message as any).experimental_attachments && (message as any).experimental_attachments.length > 0 && (
                    <AttachmentDisplay
                        attachments={(message as any).experimental_attachments.map((attachment: any) => ({
                            id: `attachment-${attachment.name}`,
                            type: attachment.url?.startsWith('file://') ? 'file' : 'url',
                            name: attachment.name,
                            url: attachment.url,
                            path: attachment.url?.startsWith('file://') ? attachment.url.replace('file://', '') : undefined,
                            content: attachment.content,
                        }))}
                    />
                )}

                <div className="flex items-end justify-between mt-2 gap-2">
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                        {message.createdAt ? new Date(message.createdAt).toLocaleTimeString() : 'Just now'}
                    </span>

                    <div className={cn("flex items-center gap-1 opacity-0 flex-shrink-0", isHovered && "opacity-100")}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleCopy}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}