import React, {
  useCallback,
  useRef,
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Send } from "lucide-react";
import { MessageComponent } from "../chat/chat-message";
import { useKanbanStore } from "@/stores/kanban";
import { useProjectStore } from "@/stores/project";
import { Input } from "@/components/ui/input";
import DotMatrix from "@/components/ui/animated-dot-matrix";
import { useAgentExecution } from "./use-agent-execution";

interface AgentChatProps {
  taskId: string;
  className?: string;
}

export interface AgentChatRef {
  executeAgent: () => Promise<void>;
  stopAgent: () => void;
}

export const AgentChat = forwardRef<AgentChatRef, AgentChatProps>(
  ({ taskId, className = "" }, ref) => {
    const { currentProject } = useProjectStore();
    const { addMessage } = useKanbanStore();
    const [inputValue, setInputValue] = useState("");

    // Use the new agent execution hook
    const { messages, executeAgent, stopAgent, isExecuting, error, append } =
      useAgentExecution({ taskId });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        executeAgent,
        stopAgent,
      }),
      [executeAgent, stopAgent],
    );

    const scrollToBottom = useCallback(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
      scrollToBottom();
    }, [messages, scrollToBottom]);

    // Add message to chat (no auto-execution)
    const handleSend = useCallback(async () => {
      if (!inputValue.trim()) return;

      const userMessage = inputValue.trim();
      setInputValue("");

      // Save user message to kanban store
      if (currentProject) {
        addMessage(currentProject, taskId, {
          role: "user",
          content: userMessage,
        });
      }

      // Add to chat via useChat
      await append({
        role: "user",
        content: userMessage,
      });
    }, [inputValue, currentProject, taskId, addMessage, append]);

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSend();
        }
      },
      [handleSend],
    );

    const handleCopyMessage = useCallback((content: string) => {
      navigator.clipboard.writeText(content);
    }, []);

    const handleDeleteMessage = useCallback((id: string) => {
      // Note: Deleting from useChat messages would require custom implementation
      // For now, we'll just copy to clipboard
      console.log("Delete message:", id);
    }, []);

    return (
      <div className={`flex h-full flex-col ${className}`}>
        {/* Header */}
        <div className="flex-shrink-0 border-b p-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Agent Chat</h3>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="space-y-4 p-3">
              {messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  onCopy={handleCopyMessage}
                  onDelete={handleDeleteMessage}
                  // Note: Tool handling for agents would be different from regular chat
                  onToolApprove={() => {}}
                  onToolCancel={() => {}}
                />
              ))}

              {isExecuting && (
                <div className="flex justify-start">
                  <DotMatrix
                    baseColor="#444"
                    fillColor="#4caf50"
                    dotSize={3}
                    rows={3}
                    fillSpeed={3000}
                    autoFill={true}
                  />
                </div>
              )}

              {error && (
                <div className="rounded bg-red-50 p-2 text-sm text-red-500">
                  Error: {error.message}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 border-t p-3">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add message for the agent..."
              disabled={isExecuting}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim() || isExecuting}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  },
);

AgentChat.displayName = "AgentChat";
