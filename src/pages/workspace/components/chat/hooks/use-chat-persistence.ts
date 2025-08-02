import { useEffect } from 'react';
import type { Message } from '@ai-sdk/react';
import { chatPersistenceService } from '../chat-persistence';
import { EnhancedChatMessage } from '../types';

interface UseChatPersistenceProps {
    messages: Message[];
    currentSessionId: string | null;
    setCurrentSessionId: (id: string | null) => void;
    setMessages: (messages: Message[]) => void;
    setHasUserInteracted: (value: boolean) => void;
}

export function useChatPersistence({
    messages,
    currentSessionId,
    setCurrentSessionId,
    setMessages,
    setHasUserInteracted,
}: UseChatPersistenceProps) {
    // Auto-save messages when they change
    useEffect(() => {
        if (messages.length > 0) {
            const saveMessages = async () => {
                try {
                    const enhancedMessages = messages
                        .filter(msg => msg.role === 'user' || msg.role === 'assistant')
                        .map(msg => ({
                            timestamp: msg.createdAt || new Date(),
                            createdAt: msg.createdAt,
                            ...msg
                        }) as EnhancedChatMessage);

                    if (enhancedMessages.length === 0) return;

                    if (currentSessionId) {
                        await chatPersistenceService.updateSession(currentSessionId, enhancedMessages);
                    } else {
                        const sessionId = await chatPersistenceService.saveCurrentSession(enhancedMessages);
                        setCurrentSessionId(sessionId);
                    }
                } catch (error) {
                    console.error('Failed to save chat session:', error);
                }
            };

            // Debounce saving to avoid too many calls
            const timeoutId = setTimeout(saveMessages, 1000);
            return () => clearTimeout(timeoutId);
        }
    }, [messages, currentSessionId, setCurrentSessionId]);

    // Load initial session from storage if available
    useEffect(() => {
        const loadInitialSession = async () => {
            if (messages.length > 0) return; // Don't load if we already have messages

            try {
                const recentSessions = await chatPersistenceService.getRecentSessions(1);
                if (recentSessions.length > 0) {
                    const latestSession = recentSessions[0];
                    // Convert enhanced messages back to AI SDK format
                    const aiSdkMessages = latestSession.messages.map(msg => {
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
                    setCurrentSessionId(latestSession.id);
                    setHasUserInteracted(true); // Loading existing session means user has interacted
                }
            } catch (error) {
                console.error('Failed to load initial session:', error);
            }
        };

        loadInitialSession();
    }, [setMessages, setCurrentSessionId, setHasUserInteracted]);
}
