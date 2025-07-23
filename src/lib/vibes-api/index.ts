import { fetchApi, VIBES_API_URL } from "./api/fetchApi";
import { authClient } from "./auth/client";
import { socialApi } from "./api/social";

export const vibesApi = {
  fetchApi,
  VIBES_API_URL,
  authClient,
  social: socialApi,
};

export { authClient } from "./auth/client";