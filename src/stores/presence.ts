import { create } from 'zustand';
import { toast } from 'sonner';
import { presenceChannel } from '@/lib/realtime';

interface PresenceUser {
  userId: string;
  user: {
    id: string;
    name: string;
    username?: string;
    displayUsername?: string;
  };
  projectName?: string;
  lastActivity: number;
  status: string;
}

interface PresenceMessage {
  id: number;
  userId: string;
  message: string;
  createdAt: number;
  user: {
    id: string;
    name: string;
    username?: string;
    displayUsername?: string;
  };
}

interface PresenceStats {
  activeUsers: number;
  lockedInUsers: number;
  sessionsToday: number;
  sessionsThisWeek: number;
}

export type PresenceMode = 'global' | 'mutuals';

interface PresenceState {
  lockedInCount: number;
  lockedInUsers: PresenceUser[];
  recentMessages: PresenceMessage[];
  stats: PresenceStats | null;
  isLockedIn: boolean;
  lastMessageCheck: number;
  mode: PresenceMode;
  setMode: (mode: PresenceMode) => void;
  fetchLockedInCount: () => Promise<void>;
  fetchPresenceStatus: () => Promise<void>;
  fetchRecentMessages: () => Promise<void>;
  updateMyPresence: (isLockedIn: boolean, projectName?: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  initializeRealtime: () => void;
  cleanup: () => void;
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://localhost:3000/api/v1';

export const usePresenceStore = create<PresenceState>((set, get) => ({
  lockedInCount: 0,
  lockedInUsers: [],
  recentMessages: [],
  stats: null,
  isLockedIn: false,
  lastMessageCheck: Date.now(),
  mode: 'global',
  
  setMode: (mode: PresenceMode) => {
    set({ mode });
    // Refetch data when mode changes
    get().fetchPresenceStatus();
    get().fetchRecentMessages();
  },

  fetchLockedInCount: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/presence/locked-in-count`);
      if (response.ok) {
        const data = await response.json();
        set({ lockedInCount: data.count });
      }
    } catch (error) {
      console.error('Failed to fetch locked-in count:', error);
      set({ lockedInCount: 0 });
    }
  },

  fetchPresenceStatus: async () => {
    try {
      const { mode } = get();
      const response = await fetch(`${API_BASE_URL}/presence/status?mode=${mode}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        set({ 
          lockedInUsers: data.lockedInUsers,
          stats: data.stats,
          lockedInCount: data.lockedInUsers.length
        });
      }
    } catch (error) {
      console.error('Failed to fetch presence status:', error);
      set({ 
        lockedInUsers: [],
        lockedInCount: 0
      });
    }
  },

  fetchRecentMessages: async () => {
    try {
      const { mode } = get();
      const response = await fetch(`${API_BASE_URL}/presence/message?limit=10&mode=${mode}`);
      if (response.ok) {
        const data = await response.json();
        set({ recentMessages: data.messages });
      }
    } catch (error) {
      console.error('Failed to fetch recent messages:', error);
    }
  },

  updateMyPresence: async (isLockedIn: boolean, projectName?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/presence/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          isLockedIn,
          projectName,
          status: 'active'
        })
      });

      if (response.ok) {
        set({ isLockedIn });
      }
    } catch (error) {
      console.error('Failed to update presence:', error);
      set({ isLockedIn });
    }
  },

  sendMessage: async (message: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/presence/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Message sent!');
        // Message will be received via Pusher, no need to refetch
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  },

  initializeRealtime: () => {
    // Initial data fetch
    get().fetchLockedInCount();
    get().fetchPresenceStatus();
    get().fetchRecentMessages();

    // Set up Pusher event listeners
    presenceChannel.bind('presence-updated', (data: any) => {
      console.log('Presence updated:', data);
      // Refetch based on current mode instead of using broadcast data
      get().fetchPresenceStatus();
    });

    presenceChannel.bind('user-locked-in', (data: any) => {
      console.log('User locked in:', data);
      // Refetch to ensure we get filtered data based on current mode
      get().fetchPresenceStatus();
    });

    presenceChannel.bind('user-locked-out', (data: any) => {
      console.log('User locked out:', data);
      // Refetch to ensure we get filtered data based on current mode
      get().fetchPresenceStatus();
    });

    presenceChannel.bind('new-message', (data: PresenceMessage) => {
      console.log('New message:', data);
      
      // Refetch messages to ensure proper filtering based on mode
      get().fetchRecentMessages();
      
      // Show toast notification (we can show this regardless of mode)
      toast(`${data.user.name} said "${data.message}"`, {
        duration: 4000,
      });
    });

    presenceChannel.bind('locked-in-count', (data: { count: number }) => {
      console.log('Locked-in count updated:', data);
      // This is global count, so we can update it directly
      set({ lockedInCount: data.count });
    });
  },

  cleanup: () => {
    // Clean up Pusher event listeners
    presenceChannel.unbind('presence-updated');
    presenceChannel.unbind('user-locked-in');
    presenceChannel.unbind('user-locked-out');
    presenceChannel.unbind('new-message');
    presenceChannel.unbind('locked-in-count');
  }
}));

// Auto-initialize realtime when store is created
usePresenceStore.getState().initializeRealtime();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    usePresenceStore.getState().cleanup();
  });
}
