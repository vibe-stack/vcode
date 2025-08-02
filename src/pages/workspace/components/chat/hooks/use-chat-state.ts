import { useState } from 'react';

export function useChatState() {
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState(false);

    return {
        currentSessionId,
        setCurrentSessionId,
        hasUserInteracted,
        setHasUserInteracted,
    };
}
