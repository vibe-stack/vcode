import { create } from 'zustand';
import { toast } from 'sonner';

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

interface PresenceState {
  lockedInCount: number;
  lockedInUsers: PresenceUser[];
  recentMessages: PresenceMessage[];
  stats: PresenceStats | null;
  isLockedIn: boolean;
  lastMessageCheck: number;
  fetchLockedInCount: () => Promise<void>;
  fetchPresenceStatus: () => Promise<void>;
  fetchRecentMessages: () => Promise<void>;
  updateMyPresence: (isLockedIn: boolean, projectName?: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

// Mock data for when API is not available
const mockUsers: PresenceUser[] = [
  {
    userId: '1',
    user: { id: '1', name: 'Alex Chen', username: 'alexdev' },
    projectName: 'react-dashboard',
    lastActivity: Date.now() - 60000,
    status: 'active'
  },
  {
    userId: '2',
    user: { id: '2', name: 'Sarah Kim', username: 'sarahcodes' },
    projectName: 'ml-pipeline',
    lastActivity: Date.now() - 30000,
    status: 'active'
  }
];

const mockMessages: PresenceMessage[] = [
  {
    id: 1,
    userId: '1',
    message: 'GRIND HARDER NABS',
    createdAt: Date.now() - 120000,
    user: { id: '1', name: 'Alex Chen', username: 'alexdev' }
  }
];

// Simulate API calls with mock data
const API_BASE_URL = 'http://localhost:3001/api/v1';
const USE_MOCK_DATA = true; // Set to false when real API is available

let pollingInterval: NodeJS.Timeout | null = null;

export const usePresenceStore = create<PresenceState>((set, get) => ({
  lockedInCount: 0,
  lockedInUsers: [],
  recentMessages: [],
  stats: null,
  isLockedIn: false,
  lastMessageCheck: Date.now(),

  fetchLockedInCount: async () => {
    try {
      if (USE_MOCK_DATA) {
        // Simulate varying count
        const count = Math.floor(Math.random() * 8) + 2;
        set({ lockedInCount: count });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/presence/locked-in-count`);
      if (response.ok) {
        const data = await response.json();
        set({ lockedInCount: data.count });
      }
    } catch (error) {
      console.error('Failed to fetch locked-in count:', error);
      // Fallback to mock data
      set({ lockedInCount: Math.floor(Math.random() * 8) + 2 });
    }
  },

  fetchPresenceStatus: async () => {
    try {
      if (USE_MOCK_DATA) {
        const shuffledUsers = [...mockUsers].sort(() => Math.random() - 0.5);
        const randomCount = Math.floor(Math.random() * shuffledUsers.length) + 1;
        set({ 
          lockedInUsers: shuffledUsers.slice(0, randomCount),
          lockedInCount: randomCount
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/presence/status`, {
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
      // Fallback to mock data
      const shuffledUsers = [...mockUsers].sort(() => Math.random() - 0.5);
      const randomCount = Math.floor(Math.random() * shuffledUsers.length) + 1;
      set({ 
        lockedInUsers: shuffledUsers.slice(0, randomCount),
        lockedInCount: randomCount
      });
    }
  },

  fetchRecentMessages: async () => {
    try {
      if (USE_MOCK_DATA) {
        // Check for new mock messages
        const currentTime = Date.now();
        const { lastMessageCheck } = get();
        
        // Simulate receiving a new message every 30-60 seconds
        if (currentTime - lastMessageCheck > 45000 && Math.random() > 0.7) {
          const newMessage: PresenceMessage = {
            id: Date.now(),
            userId: mockUsers[Math.floor(Math.random() * mockUsers.length)].userId,
            message: [
              'LETS GOOOO!',
              'Deep work mode activated 💪',
              'Coffee break in 20',
              'Just shipped a feature!',
              'Debugging life choices',
              'Code review time',
              'Testing in prod 😬'
            ][Math.floor(Math.random() * 7)],
            createdAt: currentTime,
            user: mockUsers[Math.floor(Math.random() * mockUsers.length)].user
          };
          
          set(state => ({ 
            recentMessages: [newMessage, ...state.recentMessages].slice(0, 10),
            lastMessageCheck: currentTime
          }));
          
          // Show toast notification
          toast(`${newMessage.user.name} said "${newMessage.message}"`, {
            duration: 4000,
          });
        }
        return;
      }

      const response = await fetch(`${API_BASE_URL}/presence/message?limit=10`);
      if (response.ok) {
        const data = await response.json();
        const { lastMessageCheck } = get();
        
        // Check for new messages
        const newMessages = data.messages.filter((msg: PresenceMessage) => msg.createdAt > lastMessageCheck);
        
        if (newMessages.length > 0) {
          // Show toast for the most recent message
          const latestMessage = newMessages[0];
          toast(`${latestMessage.user.name} said "${latestMessage.message}"`, {
            duration: 4000,
          });
          
          set({ 
            recentMessages: data.messages,
            lastMessageCheck: Date.now()
          });
        } else {
          set({ recentMessages: data.messages });
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent messages:', error);
    }
  },

  updateMyPresence: async (isLockedIn: boolean, projectName?: string) => {
    try {
      if (USE_MOCK_DATA) {
        set({ isLockedIn });
        return;
      }

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
      if (USE_MOCK_DATA) {
        toast.error('Messages are disabled in demo mode');
        return;
      }

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
        // Refresh messages
        get().fetchRecentMessages();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  },

  startPolling: () => {
    // Initial fetch
    get().fetchLockedInCount();
    get().fetchPresenceStatus();
    get().fetchRecentMessages();

    // Poll every 10 seconds
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    pollingInterval = setInterval(() => {
      get().fetchLockedInCount();
      get().fetchPresenceStatus();
      get().fetchRecentMessages();
    }, 10000);
  },

  stopPolling: () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  }
}));

// Auto-start polling when store is created
usePresenceStore.getState().startPolling();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    usePresenceStore.getState().stopPolling();
  });
}
