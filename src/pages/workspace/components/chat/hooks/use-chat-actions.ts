import { useCallback } from 'react';
import type { Message } from '@ai-sdk/react';
import { ChatAttachment } from '../types';
import { chatPersistenceService } from '../chat-persistence';
import { toolExecutionService } from '../tools/tool-execution-service';
import { useChatSnapshotStore } from '@/stores/chat-snapshots';

interface UseChatActionsProps {
    append: (message: any) => void;
    stop: () => void;
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    addToolResult: (result: { toolCallId: string; result: string }) => void;
    messages: Message[];
    currentSessionId: string | null;
    setCurrentSessionId: (id: string | null) => void;
    setHasUserInteracted: (value: boolean) => void;
}

export function useChatActions({
    append,
    stop,
    setMessages,
    addToolResult,
    messages,
    currentSessionId,
    setCurrentSessionId,
    setHasUserInteracted,
}: UseChatActionsProps) {
    const handleEnhancedSend = useCallback((content: string, attachments: ChatAttachment[]) => {
        if (!content.trim()) return;

        // Mark that user has interacted with chat
        setHasUserInteracted(true);

        // Build message content with XML-like tags for attachments
        let messageContent = content;

        if (attachments.length > 0) {
            const attachmentXml = [
                `<attached_files>`,
                `<amount>${attachments.length}</amount>`,
                ...attachments.map(att => {
                    const filePath = att.path || att.url || '';
                    return `<file path="${filePath}" />`;
                }),
                `</attached_files>`
            ].join('\n');

            messageContent = `${content}\n\n${attachmentXml}`;
        }

        // Create message parts with text content and attachment metadata
        const messageParts: any[] = [{ type: 'text', text: messageContent }];

        // Add attachment metadata for display purposes
        if (attachments.length > 0) {
            messageParts.push({
                type: 'attachments',
                attachments: attachments
            });
        }
        append({
            role: 'user',
            parts: messageParts
        } as any);
    }, [append, setHasUserInteracted]);

    const handleStop = useCallback(() => {
        stop();
    }, [stop]);

    const handleCopyMessage = useCallback((content: string) => {
        navigator.clipboard.writeText(content);
    }, []);

    const handleDeleteMessage = useCallback((id: string) => {
        setMessages(prev => prev.filter(msg => msg.id !== id));
    }, [setMessages]);

    const handleNewChat = useCallback(() => {
        // Clear snapshots for current session
        if (currentSessionId) {
            const snapshotStore = useChatSnapshotStore.getState();
            snapshotStore.clearSessionSnapshots(currentSessionId);
        }

        setMessages([]);
        setCurrentSessionId(null);
        setHasUserInteracted(false);
    }, [setMessages, currentSessionId, setCurrentSessionId, setHasUserInteracted]);

    const handleLoadSession = useCallback(async (sessionId: string) => {
        try {
            const sessionMessages = await chatPersistenceService.loadSession(sessionId);
            // Convert enhanced messages back to AI SDK format
            const aiSdkMessages = sessionMessages.map(msg => {
                // Extract content from parts for backward compatibility
                const textPart = msg.parts?.find((part: any) => part.type === 'text');
                const content = textPart?.text || '';

                return {
                    id: msg.id,
                    role: msg.role,
                    content,
                    parts: msg.parts || [],
                    createdAt: msg.timestamp,
                };
            });
            setMessages(aiSdkMessages);
            setCurrentSessionId(sessionId);
            setHasUserInteracted(true); // Loading a session means user has interacted
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    }, [setMessages, setCurrentSessionId, setHasUserInteracted]);

    const handleClearHistory = useCallback(async () => {
        try {
            await chatPersistenceService.clearCurrentProjectSessions();

            // Also clear snapshots for this session
            if (currentSessionId) {
                const snapshotStore = useChatSnapshotStore.getState();
                snapshotStore.clearSessionSnapshots(currentSessionId);
            }

            setMessages([]);
            setCurrentSessionId(null);
            setHasUserInteracted(false);
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    }, [setMessages, currentSessionId, setCurrentSessionId, setHasUserInteracted]);

    const handleToolApprove = useCallback(async (toolCallId: string) => {
        try {
            const result = await toolExecutionService.executeApprovedTool(toolCallId, messages, currentSessionId || '');
            addToolResult({
                toolCallId,
                result,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            addToolResult({
                toolCallId,
                result: errorMessage,
            });
        }
    }, [messages, addToolResult, currentSessionId]);

    const handleToolCancel = useCallback(async (toolCallId: string) => {
        try {
            const result = await toolExecutionService.cancelTool(toolCallId);
            addToolResult({
                toolCallId,
                result,
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Tool execution cancelled by user';
            addToolResult({
                toolCallId,
                result: errorMessage,
            });
        }
    }, [addToolResult]);

    const handleAcceptAllFileChanges = useCallback(async () => {
        if (!currentSessionId) return;

        const snapshotStore = useChatSnapshotStore.getState();
        snapshotStore.acceptAllPendingSnapshots(currentSessionId);
    }, [currentSessionId]);

    const handleRejectAllFileChanges = useCallback(async () => {
        if (!currentSessionId) return;

        const snapshotStore = useChatSnapshotStore.getState();
        try {
            await snapshotStore.revertAllPendingSnapshots(currentSessionId);
        } catch (error) {
            console.error('Failed to revert all file changes:', error);
        }
    }, [currentSessionId]);

    return {
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
    };
}
