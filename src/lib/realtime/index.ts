import Pusher from 'pusher-js';

export const ws = new Pusher('app-key', {
    wsHost: 'localhost',
    wsPort: 6001,
    forceTLS: false,
    enabledTransports: ['ws'],
    cluster: "none",
});

// Presence channel for real-time presence updates
export const presenceChannel = ws.subscribe('presence');

// Export ws instance for use in stores
export { ws as pusher };
