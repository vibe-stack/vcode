import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Trash2, Bot, User } from "lucide-react";
import { cn } from "@/utils/tailwind";
import { Message } from "ai";
import { ToolCallHandler } from "./tool-call-handler";
import { AttachmentDisplay } from "./attachment-display";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "./markdown-components";
import "./markdown-content.css";

interface MessageProps {
  message: Message;
  onCopy: (content: string) => void;
  onDelete: (id: string) => void;
  onToolApprove?: (toolCallId: string) => void;
  onToolCancel?: (toolCallId: string) => void;
}

export function MessageComponent({
  message,
  onCopy,
  onDelete,
  onToolApprove,
  onToolCancel,
}: MessageProps) {
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
      <div className="min-w-0 space-y-3">
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            // Filter out attachment XML tags from text content
            const cleanedText = part.text
              .replace(/<attached_files>[\s\S]*?<\/attached_files>/g, "")
              .trim();

            // Only render if there's actual content after removing attachment tags
            if (cleanedText) {
              return (
                <div key={index} className="min-w-0">
                  <MarkdownRenderer content={cleanedText} />
                </div>
              );
            }
            return null;
          } else if (part.type === "tool-invocation") {
            return (
              <ToolCallHandler
                key={`${message.id}-tool-${index}`}
                toolCallId={part.toolInvocation.toolCallId}
                toolName={part.toolInvocation.toolName}
                args={part.toolInvocation.args}
                state={part.toolInvocation.state}
                result={
                  part.toolInvocation.state === "result"
                    ? (part.toolInvocation as any).result
                    : undefined
                }
                onApprove={onToolApprove}
                onCancel={onToolCancel}
              />
            );
          } else if ((part as any).type === "attachments") {
            return (
              <AttachmentDisplay
                key={`${message.id}-attachments-${index}`}
                attachments={(part as any).attachments.map(
                  (att: any, attIndex: number) => ({
                    id: `attachment-${message.id}-${attIndex}`,
                    type: att.type,
                    name:
                      att.name ||
                      (att.path ? att.path.split("/").pop() : "Unknown"),
                    url: att.url,
                    path: att.path,
                  }),
                )}
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
        "flex min-w-0 gap-3 rounded-lg p-4",
        message.role === "user" ? "bg-primary/10" : "",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-role="message"
    >
      {/* Avatar Icon */}
      <div className="flex-shrink-0">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            message.role === "user"
              ? "bg-primary/20 text-primary"
              : "bg-secondary text-secondary-foreground",
          )}
        >
          {message.role === "user" ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="min-w-0 space-y-2">{renderMessageParts()}</div>

        <div className="mt-2 flex items-end justify-between gap-2">
          <span className="text-muted-foreground flex-shrink-0 text-xs">
            {message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString()
              : "Just now"}
          </span>

          <div
            className={cn(
              "flex flex-shrink-0 items-center gap-1 opacity-0",
              isHovered && "opacity-100",
            )}
          >
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
  return (
    <div className="markdown-content max-w-full min-w-0 overflow-hidden">
      <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </Markdown>
    </div>
  );
};
