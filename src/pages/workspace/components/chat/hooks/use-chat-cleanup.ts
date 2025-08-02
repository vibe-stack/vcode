import { useEffect } from 'react';
import { chatPersistenceService } from '../chat-persistence';

export function useChatCleanup() {
    // Cleanup IPC listeners when component unmounts
    useEffect(() => {
        // Cleanup old sessions periodically
        chatPersistenceService.cleanupOldSessions();

        return () => {
            window.ai.removeAllListeners();
        };
    }, []);
}
