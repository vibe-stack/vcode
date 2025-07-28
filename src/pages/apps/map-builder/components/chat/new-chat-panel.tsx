import React, { useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus } from 'lucide-react';
import { SimpleChatInput } from './simple-chat-input';
import { UpdatedMessageComponent } from './updated-chat-message';
import { mapBuilderChatPersistenceService } from './map-builder-chat-persistence';
import { SimpleChatHistory } from './simple-chat-history';
import { GlobalMapChanges } from './global-map-changes';
import { useMapSnapshotStore } from './map-snapshot-store';
import { useMapBuilderStore } from '../../store';
import { StreamingIndicator } from './streaming-indicator';
import { AgentChatProvider, useAgentChatContext, AgentChatConfig } from '@/lib/agent-chat';
import { mapBuilderAgentTools } from './map-builder-agent-tools';
import { createAgentChatFetch } from '@/lib/agent-chat';

const mapBuilderConfig: AgentChatConfig = {
  name: 'mapBuilder',
  title: 'Grok Assistant',
  apiEndpoint: '/api/general-agent',
  systemPrompt: "You are a helpful assistant for building 3D maps and scenes. You can add, remove, and modify 3D objects like cubes, spheres, cylinders, planes, and doors. Always be helpful and respond in a conversational way.",
  tools: mapBuilderAgentTools,
  snapshots: true,
  maxSteps: 50,
  customFetch: createAgentChatFetch('mapBuilder', {
    systemPrompt: "You are a helpful assistant for building 3D maps and scenes. You can add, remove, and modify 3D objects like cubes, spheres, cylinders, planes, and doors. Always be helpful and respond in a conversational way.",
    maxSteps: 50
  }),
};

function ChatPanelContent() {
  const {
    messages,
    isLoading,
    status,
    currentSessionId,
    hasUserInteracted,
    handleSend,
    handleToolApprove,
    handleToolCancel,
    handleNewChat,
    handleLoadSession,
    handleClearHistory,
    handleDeleteMessage,
    stop,
    toolExecutor,
  } = useAgentChatContext();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleStop = () => {
    stop();
  };

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  const handleAcceptMapChanges = useCallback(async (messageId: string) => {
    if (!currentSessionId) return;

    const snapshotStore = useMapSnapshotStore.getState();
    snapshotStore.acceptAllSnapshots(currentSessionId, messageId);
  }, [currentSessionId]);

  const handleRejectMapChanges = useCallback(async (messageId: string) => {
    if (!currentSessionId) return;

    const snapshotStore = useMapSnapshotStore.getState();
    try {
      await snapshotStore.revertAllSnapshots(currentSessionId, messageId);
    } catch (error) {
      console.error('Failed to revert map changes:', error);
    }
  }, [currentSessionId]);

  const handleAcceptAllMapChanges = useCallback(async () => {
    if (!currentSessionId) return;

    const snapshotStore = useMapSnapshotStore.getState();
    snapshotStore.acceptAllPendingSnapshots(currentSessionId);
  }, [currentSessionId]);

  const handleRejectAllMapChanges = useCallback(async () => {
    if (!currentSessionId) return;

    const snapshotStore = useMapSnapshotStore.getState();
    try {
      await snapshotStore.revertAllPendingSnapshots(currentSessionId);
    } catch (error) {
      console.error('Failed to revert all map changes:', error);
    }
  }, [currentSessionId]);

  return (
    <div className="h-full max-h-full flex flex-col w-full max-w-full min-w-0">
      {/* Header */}
      <div className="border-b p-0 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Grok Assistant</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleNewChat}
              title="New Chat"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <SimpleChatHistory
              onLoadSession={handleLoadSession}
              onClearHistory={handleClearHistory}
              currentSessionId={currentSessionId || undefined}
            />
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden w-full">
        <div className="h-full w-full overflow-y-auto">
          <div className="p-0 space-y-4 w-full">
            {messages.map((message, index) => (
              <UpdatedMessageComponent
                key={message.id}
                message={message}
                onCopy={handleCopyMessage}
                onDelete={handleDeleteMessage}
                onToolApprove={handleToolApprove}
                onToolCancel={handleToolCancel}
                useGeneralToolHandler={true}
              />
            ))}

            {isLoading && (
              <StreamingIndicator status={status} isLoading={isLoading} />
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0">
        {currentSessionId && (
          <GlobalMapChanges
            sessionId={currentSessionId}
            onAcceptAll={handleAcceptAllMapChanges}
            onRejectAll={handleRejectAllMapChanges}
          />
        )}
        <div className="px-0 pb-3">
          <SimpleChatInput
            onSend={handleSend}
            onStop={handleStop}
            isLoading={isLoading}
            placeholder="What do you want to build?"
            isNewChat={messages.length === 0 && !hasUserInteracted}
          />
        </div>
      </div>
    </div>
  );
}

export function NewChatPanel() {
  // State capture function for snapshots
  const handleStateCapture = useCallback(() => {
    return useMapBuilderStore.getState().objects;
  }, []);

  // State restore function (if needed)
  const handleStateRestore = useCallback((state: any) => {
    // This could be implemented if needed for restoring state
    console.log('State restore not implemented yet:', state);
  }, []);

  return (
    <AgentChatProvider
      config={mapBuilderConfig}
      persistence={mapBuilderChatPersistenceService}
      onStateCapture={handleStateCapture}
      onStateRestore={handleStateRestore}
    >
      <ChatPanelContent />
    </AgentChatProvider>
  );
}