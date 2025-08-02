import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Plus } from 'lucide-react';
import { ChatInput } from './chat-input';
import { useChat } from '@ai-sdk/react';
import { chatFetch } from './chat-fetch';
import { MessageComponent } from './chat-message';
import { ChatHistory } from './chat-history';
import { GlobalFileChanges } from './global-file-changes';
import { StreamingIndicator } from './streaming-indicator';
import {
    useChatState,
    useScrollToBottom,
    useChatPersistence,
    useChatCleanup,
    useChatActions,
    useAutoScroll,
    useSnapshotCleanup,
} from './hooks';

export function ChatPanel() {
    // State management
    const { 
        currentSessionId, 
        setCurrentSessionId, 
        hasUserInteracted, 
        setHasUserInteracted 
    } = useChatState();

    // Initialize snapshot cleanup
    useSnapshotCleanup();
    
    // Chat functionality from AI SDK
    const { messages, append, setMessages, isLoading, addToolResult, stop, status } = useChat({
        api: '/api/chat', // This will be handled by our custom fetcher
        fetch: chatFetch,
        maxSteps: 50, // Enable multi-step functionality
        onResponse: () => { },
        onFinish: () => { },
        onError: (error) => {
            // Optionally handle error, but no console output
        },
    });

    // Scroll management
    const { messagesEndRef, scrollToBottom } = useScrollToBottom();

    // Auto-scroll when messages change
    useAutoScroll({ messages, scrollToBottom });

    // Persistence hooks
    useChatPersistence({
        messages,
        currentSessionId,
        setCurrentSessionId,
        setMessages,
        setHasUserInteracted,
    });

    // Cleanup hook
    useChatCleanup();

    // Action handlers
    const {
        handleEnhancedSend,
        handleStop,
        handleCopyMessage,
        handleDeleteMessage,
        handleNewChat,
        handleLoadSession,
        handleClearHistory,
        handleToolApprove,
        handleToolCancel,
        handleAcceptAllFileChanges,
        handleRejectAllFileChanges,
    } = useChatActions({
        append,
        stop,
        setMessages,
        addToolResult,
        messages,
        currentSessionId,
        setCurrentSessionId,
        setHasUserInteracted,
    });

    return (
        <div className="h-full flex flex-col border-l bg-background/70 w-full max-w-full min-w-0">
            {/* Header */}
            <div className="border-b p-3 flex-shrink-0">
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
                        <ChatHistory
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
                <div className="h-full w-full overflow-y-auto" >
                    <div className="p-3 space-y-4 w-full">
                        {messages.map((message, index) => (
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
                            <StreamingIndicator status={status} isLoading={isLoading} />
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>

            {/* Input Area */}
            <div className="border-t flex-shrink-0">
                {currentSessionId && (
                    <GlobalFileChanges
                        sessionId={currentSessionId}
                        onAcceptAll={handleAcceptAllFileChanges}
                        onRejectAll={handleRejectAllFileChanges}
                    />
                )}
                <div className="">
                    <ChatInput
                        onSend={handleEnhancedSend}
                        onStop={handleStop}
                        isLoading={isLoading}
                        placeholder="What do you want to do?"
                        isNewChat={messages.length === 0 && !hasUserInteracted}
                    />
                </div>
            </div>
        </div>
    );
}
