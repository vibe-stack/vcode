/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PUSHER_HOST: string;
  readonly VITE_PUSHER_PORT: string;
  readonly VITE_PUSHER_KEY: string;
  // Add other VITE_ environment variables here as needed
  // readonly VITE_APP_NAME: string;
  // readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
