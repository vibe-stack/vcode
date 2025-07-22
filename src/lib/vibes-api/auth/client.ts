import { createAuthClient } from "better-auth/react";
import { reactStartCookies } from "better-auth/react-start";
import { VIBES_API_URL } from "../api/fetchApi";

export const authClient = createAuthClient({
  baseURL: VIBES_API_URL,
  plugins: [reactStartCookies()],
});
