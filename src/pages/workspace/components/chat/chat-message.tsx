import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Trash2 } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { Message } from 'ai';
import { ToolCallHandler } from './tool-call-handler';
import { AttachmentDisplay } from './attachment-display';
import { ReasoningDisplay } from './reasoning-display';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from './markdown-components';
import './markdown-content.css';

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
                <div className="min-w-0">
                    <MarkdownRenderer content={message.content} />
                </div>
            );
        }

        return (
            <div className="space-y-3 min-w-0">
                {message.parts.map((part, index) => {
                    if (part.type === 'text') {
                        // Filter out attachment XML tags from text content
                        const cleanedText = part.text.replace(/<attached_files>[\s\S]*?<\/attached_files>/g, '').trim();
                        
                        // Only render if there's actual content after removing attachment tags
                        if (cleanedText) {
                            return (
                                <div key={index} className="min-w-0">
                                    <MarkdownRenderer content={cleanedText} />
                                </div>
                            );
                        }
                        return null;
                    } else if (part.type === 'reasoning') {
                        // Handle reasoning parts (thinking tokens)
                        return (
                            <ReasoningDisplay
                                key={`${message.id}-reasoning-${index}`}
                                reasoning={(part as any).reasoning}
                                details={(part as any).details}
                            />
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
                    } else if ((part as any).type === 'attachments') {
                        return (
                            <AttachmentDisplay
                                key={`${message.id}-attachments-${index}`}
                                attachments={(part as any).attachments.map((att: any, attIndex: number) => ({
                                    id: `attachment-${message.id}-${attIndex}`,
                                    type: att.type,
                                    name: att.name || (att.path ? att.path.split('/').pop() : 'Unknown'),
                                    url: att.url,
                                    path: att.path,
                                }))}
                            />
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    return (
        <div
            className={cn(
                "flex gap-3 p-3 rounded-lg min-w-0",
                message.role === 'user' && "bg-primary/10 ml-8"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex-1 min-w-0">
                <div className="space-y-2 min-w-0">
                    {renderMessageParts()}
                </div>

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

const MarkdownRenderer = ({ content }: { content?: string }) => {
    // Debug: log the content being rendered
    console.log('MarkdownRenderer content:', content);
    
    return (
        <div className="markdown-content max-w-full min-w-0 overflow-hidden">
            <Markdown 
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {content}
            </Markdown>
        </div>
    );
}