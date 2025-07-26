import { createAuthClient } from "better-auth/react";
import { VIBES_API_URL } from "../api/fetchApi";

export const authClient = createAuthClient({
  baseURL: VIBES_API_URL,
  // For Electron apps, we need to handle cookies differently
  fetchOptions: {
    credentials: 'include',
    // Add headers to help with CORS
    headers: {
      'Origin': 'app://vcode-ide',
      'Referer': 'app://vcode-ide',
    },
  },
  // Disable cookies for Electron and use localStorage instead
  disableDefaultFetch: false,
  // Enable session storage fallback
  sessionStorage: {
    enabled: true,
    strategy: 'localStorage', // Use localStorage instead of cookies in Electron
  },
});
