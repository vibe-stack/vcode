import { useCallback, useRef } from 'react';

export function useScrollToBottom() {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    return {
        messagesEndRef,
        scrollToBottom,
    };
}
