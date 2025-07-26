import Pusher from 'pusher-js';
import { env } from '@/config/environment';

export const ws = new Pusher(env.pusher.key, {
    wsHost: env.pusher.host,
    wsPort: env.pusher.port,
    forceTLS: false,
    enabledTransports: ['ws', 'wss'],
    cluster: "none",
    
});

// Presence channel for real-time presence updates
export const presenceChannel = ws.subscribe('presence');

// Export ws instance for use in stores
export { ws as pusher };
