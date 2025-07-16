import React, { useCallback, useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Send, Square } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { agentFetch } from './agent-fetch';
import { MessageComponent } from '../chat/chat-message';
import { useKanbanStore } from '@/stores/kanban';
import { useProjectStore } from '@/stores/project';
import { Input } from '@/components/ui/input';
import DotMatrix from '@/components/ui/animated-dot-matrix';

interface AgentChatProps {
  taskId: string;
  className?: string;
}

export function AgentChat({ taskId, className = '' }: AgentChatProps) {
  const { currentProject } = useProjectStore();
  const { getMessages, addMessage } = useKanbanStore();
  const [inputValue, setInputValue] = useState('');

  // Get messages from the kanban store
  const storedMessages = currentProject ? getMessages(currentProject, taskId) : [];

  const { messages, append, setMessages, isLoading, stop } = useChat({
    api: '/api/agents', // This will be handled by our custom fetcher
    fetch: agentFetch,
    maxSteps: 100, // Enable multi-step functionality for agents
    onResponse: () => { },
    onFinish: (message) => {
      // Save assistant message to kanban store
      if (currentProject && message.content) {
        addMessage(currentProject, taskId, {
          role: 'assistant',
          content: message.content
        });
      }
    },
    onError: (error) => {
      console.error('Agent chat error:', error);
    },
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Initialize messages from kanban store
  useEffect(() => {
    if (storedMessages && storedMessages.length > 0 && messages.length === 0) {
      const aiSdkMessages = storedMessages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        createdAt: msg.timestamp,
      }));
      setMessages(aiSdkMessages);
    }
  }, [storedMessages, messages.length, setMessages]);

  const handleSend = useCallback(() => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Save user message to kanban store
    if (currentProject) {
      addMessage(currentProject, taskId, {
        role: 'user',
        content: userMessage
      });
    }

    // Send to AI
    append({
      role: 'user',
      content: userMessage,
    });
  }, [inputValue, isLoading, currentProject, taskId, addMessage, append]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleStop = () => {
    stop();
  };

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const handleDeleteMessage = useCallback((id: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== id));
  }, [setMessages]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="border-b p-3 flex-shrink-0">
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
          <div className="p-3 space-y-4">
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
      <div className="border-t p-3 flex-shrink-0">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Message the agent..."
            disabled={isLoading}
            className="flex-1"
          />
          {isLoading ? (
            <Button
              onClick={handleStop}
              variant="outline"
              size="sm"
              className="px-3"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              size="sm"
              className="px-3"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
