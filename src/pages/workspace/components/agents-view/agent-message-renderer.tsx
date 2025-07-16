import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Trash2, User, Bot, Settings, Wrench } from 'lucide-react';
import { cn } from '@/utils/tailwind';
import { AgentMessage } from './types';
import { AgentToolCallHandler } from './agent-tool-call-handler';
import { AgentMarkdownRenderer } from './agent-markdown-renderer';
import { format } from 'date-fns';

interface AgentMessageRendererProps {
    message: AgentMessage;
    onCopy?: (content: string) => void;
    onDelete?: (id: string) => void;
}

export function AgentMessageRenderer({ message, onCopy, onDelete }: AgentMessageRendererProps) {
    const [isHovered, setIsHovered] = useState(false);

    const handleCopy = useCallback(() => {
        if (onCopy) {
            onCopy(message.content);
        } else {
            navigator.clipboard.writeText(message.content);
        }
    }, [message.content, onCopy]);

    const handleDelete = useCallback(() => {
        if (onDelete) {
            onDelete(message.id);
        }
    }, [message.id, onDelete]);

    const getRoleIcon = () => {
        switch (message.role) {
            case 'user':
                return <User className="h-4 w-4" />;
            case 'assistant':
                return <Bot className="h-4 w-4" />;
            case 'tool':
                return <Wrench className="h-4 w-4" />;
            case 'system':
                return <Settings className="h-4 w-4" />;
            default:
                return <Bot className="h-4 w-4" />;
        }
    };

    const getRoleColor = () => {
        switch (message.role) {
            case 'user':
                return 'text-blue-600 dark:text-blue-400';
            case 'assistant':
                return 'text-green-600 dark:text-green-400';
            case 'tool':
                return 'text-orange-600 dark:text-orange-400';
            case 'system':
                return 'text-purple-600 dark:text-purple-400';
            default:
                return 'text-muted-foreground';
        }
    };

    // Function to render message content
    const renderMessageContent = () => {
        // Try to parse the content to see if it contains tool calls or structured data
        try {
            const parsed = JSON.parse(message.content);
            
            // If it's a tool call result
            if (parsed.type === 'tool_call' || parsed.toolName) {
                return (
                    <AgentToolCallHandler
                        toolCallId={parsed.toolCallId || message.id}
                        toolName={parsed.toolName || parsed.tool}
                        args={parsed.args || parsed.arguments}
                        state={parsed.state || 'result'}
                        result={parsed.result}
                    />
                );
            }
            
            // If it's structured content, render it nicely
            if (parsed.content) {
                return <AgentMarkdownRenderer content={parsed.content} />;
            }
        } catch (e) {
            // If parsing fails, treat as regular text
        }

        // For tool role messages, try to format them better
        if (message.role === 'tool') {
            try {
                const toolData = JSON.parse(message.content);
                return (
                    <div className="space-y-2">
                        <div className="text-xs text-muted-foreground font-mono">
                            Tool Response
                        </div>
                        <pre className="text-xs bg-muted/50 rounded p-2 overflow-x-auto">
                            {JSON.stringify(toolData, null, 2)}
                        </pre>
                    </div>
                );
            } catch (e) {
                // Fall back to regular rendering
            }
        }

        // Regular markdown rendering
        return <AgentMarkdownRenderer content={message.content} />;
    };

    return (
        <div
            className={cn(
                "flex gap-3 p-3 rounded-lg min-w-0 group",
                message.role === 'user' && "bg-blue-50/50 dark:bg-blue-950/20",
                message.role === 'assistant' && "bg-green-50/50 dark:bg-green-950/20",
                message.role === 'tool' && "bg-orange-50/50 dark:bg-orange-950/20",
                message.role === 'system' && "bg-purple-50/50 dark:bg-purple-950/20"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Role Avatar */}
            <div className={cn("flex-shrink-0 mt-1", getRoleColor())}>
                {getRoleIcon()}
            </div>

            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                    <Badge 
                        variant={message.role === 'user' ? 'default' : 'secondary'} 
                        className="text-xs"
                    >
                        {message.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                        {format(new Date(message.timestamp), 'PPp')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        Step {message.stepIndex}
                    </span>
                </div>

                {/* Content */}
                <div className="min-w-0">
                    {renderMessageContent()}
                </div>

                {/* Actions */}
                <div className="flex items-end justify-end mt-2 gap-2">
                    <div className={cn(
                        "flex items-center gap-1 opacity-0 flex-shrink-0 transition-opacity", 
                        isHovered && "opacity-100"
                    )}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={handleCopy}
                        >
                            <Copy className="h-3 w-3" />
                        </Button>
                        {onDelete && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={handleDelete}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
