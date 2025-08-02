import { useEffect } from 'react';
import type { Message } from '@ai-sdk/react';

interface UseAutoScrollProps {
    messages: Message[];
    scrollToBottom: () => void;
}

export function useAutoScroll({ messages, scrollToBottom }: UseAutoScrollProps) {
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);
}
