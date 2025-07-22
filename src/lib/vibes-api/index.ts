import { createAuthClient } from "better-auth/react" // make sure to import from better-auth/react
import { reactStartCookies } from "better-auth/react-start";

export const VIBES_API_URL = process.env.API_URL || "http://localhost:3000";

export const fetchApi = async (path: string, options: RequestInit = {}) => {
  const url = `${VIBES_API_URL}/${path}`;
  
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  const finalUrl = `${VIBES_API_URL}/${cleanPath}`;
  
  return fetch(finalUrl, {
    ...options,
    credentials: 'include', // Include cookies for session management
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

 
export const authClient =  createAuthClient({
    //you can pass client configuration here
    baseURL: VIBES_API_URL,
    plugins: [
      reactStartCookies(),
    ]
})

// All authentication logic is now handled by authClient from better-auth/react