import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  // Auth requests go through Next.js rewrites to keep cookies same-origin
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
  plugins: [magicLinkClient()],
});

export const {
  signIn,
  signOut,
  useSession,
  getSession,
} = authClient;
