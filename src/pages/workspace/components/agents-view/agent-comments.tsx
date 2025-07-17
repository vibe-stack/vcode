import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useKanbanStore } from "@/stores/kanban";
import { useProjectStore } from "@/stores/project";
import { useSettingsStore } from "@/stores/settings";
import { getActiveAccentClasses } from "@/utils/accent-colors";
import { cn } from "@/utils/tailwind";
import { Edit2, Trash2, Plus, Bot, User, Clock, Settings } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { markdownComponents } from "../chat/markdown-components";
import "../chat/markdown-content.css";

interface AgentCommentsProps {
  taskId: string;
  canAddMessages: boolean;
  className?: string;
}

interface MessageDisplay {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  type?: "message" | "tool_call" | "tool_result" | "status_update";
  toolName?: string;
  status?: string;
  editing?: boolean;
}

export function AgentComments({
  taskId,
  canAddMessages,
  className = "",
}: AgentCommentsProps) {
  const { currentProject } = useProjectStore();
  const { getMessages, addMessage, updateTask, getTask } = useKanbanStore();
  const [newMessage, setNewMessage] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { settings } = useSettingsStore();
  const accentColor = settings.appearance?.accentColor || "blue";
  const useGradient = settings.appearance?.useGradient || false;

  // Get messages from the kanban store
  const messages = currentProject
    ? getMessages(currentProject, taskId) || []
    : [];
  const task = currentProject ? getTask(currentProject, taskId) : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleAddMessage = useCallback(() => {
    if (!newMessage.trim() || !currentProject) return;

    addMessage(currentProject, taskId, {
      role: "user",
      content: newMessage.trim(),
    });

    setNewMessage("");
  }, [newMessage, currentProject, taskId, addMessage]);

  const handleEditMessage = useCallback(
    (messageId: string, content: string) => {
      setEditingMessageId(messageId);
      setEditingContent(content);
    },
    [],
  );

  const handleSaveEdit = useCallback(() => {
    if (!editingMessageId || !editingContent.trim() || !currentProject) return;

    // Update the message in the kanban store
    const updatedMessages = messages.map((msg) =>
      msg.id === editingMessageId
        ? { ...msg, content: editingContent.trim() }
        : msg,
    );

    // Update the task with new messages
    updateTask(currentProject, taskId, { messages: updatedMessages });

    setEditingMessageId(null);
    setEditingContent("");
  }, [
    editingMessageId,
    editingContent,
    currentProject,
    taskId,
    messages,
    updateTask,
  ]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent("");
  }, []);

  const handleDeleteMessage = useCallback(
    (messageId: string) => {
      if (!currentProject) return;

      const updatedMessages = messages.filter((msg) => msg.id !== messageId);
      updateTask(currentProject, taskId, { messages: updatedMessages });
    },
    [currentProject, taskId, messages, updateTask],
  );

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && e.metaKey) {
        e.preventDefault();
        handleAddMessage();
      }
    },
    [handleAddMessage],
  );

  const getMessageIcon = (message: MessageDisplay) => {
    switch (message.role) {
      case "user":
        return <User className="h-4 w-4" />;
      case "assistant":
        return <Bot className="h-4 w-4" />;
      case "system":
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };


  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <Bot className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No messages yet.</p>
            {canAddMessages && (
              <p className="mt-2 text-sm">
                Add a message to communicate with the agent.
              </p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex min-w-0 gap-3 rounded-lg p-3",
                message.role === "user" ? "bg-primary/5" : "",
              )}
            >
              {/* Avatar Icon */}
              <div className="flex-shrink-0">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    message.role === "user" 
                      ? getActiveAccentClasses(accentColor, useGradient) || "bg-primary text-primary-foreground"
                      : "bg-green-500 text-white"
                  )}
                >
                  {getMessageIcon(message)}
                </div>
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="min-w-0 space-y-2">
                  {editingMessageId === message.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        rows={3}
                        className={cn(
                          "w-full",
                          "focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        )}
                      />
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleSaveEdit}
                          className="rounded-md"
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="rounded-md"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="min-w-0 text-sm">
                        <MarkdownRenderer content={message.content} />
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 flex items-end justify-between gap-2">
                  <span className="text-muted-foreground flex-shrink-0 text-xs">
                    {new Date(message.timestamp).toLocaleString()}
                  </span>
                  {message.role === "user" && canAddMessages && (
                    <div className="flex flex-shrink-0 items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleEditMessage(message.id, message.content)
                        }
                        className="h-6 w-6 p-0 rounded-md"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteMessage(message.id)}
                        className="h-6 w-6 p-0 rounded-md"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Add Message Area */}
      {canAddMessages && (
        <div className="dark:bg-accent/20 border-t p-4">
          <div className="space-y-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a message for the agent... (Cmd+Enter to add)"
              rows={3}
              className={cn(
                "w-full",
                "focus:ring-2 focus:ring-primary/20 focus:border-primary"
              )}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Messages will be sent to the agent when you press "Run" in the
                kanban board.
              </p>
              <Button
                onClick={handleAddMessage}
                disabled={!newMessage.trim()}
                size="sm"
                className={cn(
                  "bg-primary hover:bg-primary/90 rounded-md",
                  getActiveAccentClasses(accentColor, useGradient)
                )}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      {task && task.agentExecution && (
        <div className="border-t bg-gray-50 p-4 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm">
            <Badge
              variant="outline"
              className={
                task.agentExecution.status === "running"
                  ? "border-green-500 text-green-700"
                  : task.agentExecution.status === "paused"
                    ? "border-yellow-500 text-yellow-700"
                    : task.agentExecution.status === "error"
                      ? "border-red-500 text-red-700"
                      : "border-gray-500 text-gray-700"
              }
            >
              {task.agentExecution.status}
            </Badge>
            {task.agentExecution.currentStep && (
              <span className="text-gray-600">
                {task.agentExecution.currentStep}
              </span>
            )}
          </div>
        </div>
      )}
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
