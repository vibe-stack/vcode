import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useKanbanStore } from '@/stores/kanban';
import { useProjectStore } from '@/stores/project';
import { Edit2, Trash2, Plus, Bot, User, Clock, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { markdownComponents } from '../chat/markdown-components';
import '../chat/markdown-content.css';

interface AgentCommentsProps {
  taskId: string;
  canAddMessages: boolean;
  className?: string;
}

interface MessageDisplay {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  type?: 'message' | 'tool_call' | 'tool_result' | 'status_update';
  toolName?: string;
  status?: string;
  editing?: boolean;
}

export function AgentComments({ taskId, canAddMessages, className = '' }: AgentCommentsProps) {
  const { currentProject } = useProjectStore();
  const { getMessages, addMessage, updateTask, getTask } = useKanbanStore();
  const [newMessage, setNewMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get messages from the kanban store
  const messages = currentProject ? getMessages(currentProject, taskId) || [] : [];
  const task = currentProject ? getTask(currentProject, taskId) : null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleAddMessage = useCallback(() => {
    if (!newMessage.trim() || !currentProject) return;

    addMessage(currentProject, taskId, {
      role: 'user',
      content: newMessage.trim()
    });

    setNewMessage('');
  }, [newMessage, currentProject, taskId, addMessage]);

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingMessageId || !editingContent.trim() || !currentProject) return;

    // Update the message in the kanban store
    const updatedMessages = messages.map(msg => 
      msg.id === editingMessageId ? { ...msg, content: editingContent.trim() } : msg
    );

    // Update the task with new messages
    updateTask(currentProject, taskId, { messages: updatedMessages });

    setEditingMessageId(null);
    setEditingContent('');
  }, [editingMessageId, editingContent, currentProject, taskId, messages, updateTask]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    if (!currentProject) return;

    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    updateTask(currentProject, taskId, { messages: updatedMessages });
  }, [currentProject, taskId, messages, updateTask]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault();
      handleAddMessage();
    }
  }, [handleAddMessage]);

  const getMessageIcon = (message: MessageDisplay) => {
    switch (message.role) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'assistant':
        return <Bot className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getMessageColor = (message: MessageDisplay) => {
    switch (message.role) {
      case 'user':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950';
      case 'assistant':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950';
      case 'system':
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900';
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet.</p>
            {canAddMessages && (
              <p className="text-sm mt-2">Add a message to communicate with the agent.</p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <Card key={message.id} className={`${getMessageColor(message)} border`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getMessageIcon(message)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {message.role}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    {editingMessageId === message.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="w-full"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSaveEdit}>
                            Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-sm min-w-0">
                          <MarkdownRenderer content={message.content} />
                        </div>
                        
                        {message.role === 'user' && canAddMessages && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMessage(message.id, message.content)}
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Add Message Area */}
      {canAddMessages && (
        <div className="border-t p-4 dark:bg-accent/20">
          <div className="space-y-3">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write a message for the agent... (Cmd+Enter to add)"
              rows={3}
              className="w-full"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                Messages will be sent to the agent when you press "Run" in the kanban board.
              </p>
              <Button
                onClick={handleAddMessage}
                disabled={!newMessage.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      {task && task.agentExecution && (
        <div className="border-t p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className={
              task.agentExecution.status === 'running' ? 'border-green-500 text-green-700' :
              task.agentExecution.status === 'paused' ? 'border-yellow-500 text-yellow-700' :
              task.agentExecution.status === 'error' ? 'border-red-500 text-red-700' :
              'border-gray-500 text-gray-700'
            }>
              {task.agentExecution.status}
            </Badge>
            {task.agentExecution.currentStep && (
              <span className="text-gray-600">{task.agentExecution.currentStep}</span>
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
      <Markdown 
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </Markdown>
    </div>
  );
};
