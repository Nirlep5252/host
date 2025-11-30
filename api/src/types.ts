import type { R2Bucket } from "@cloudflare/workers-types";
import type { User, Session } from "./db";

export type Bindings = {
  R2: R2Bucket;
  DATABASE_URL: string;
  ADMIN_KEY: string;
  ADMIN_EMAIL: string;
  BASE_URL: string;
  TOKEN_SECRET: string;
  RESEND_API_KEY: string;
  BETTER_AUTH_SECRET: string;
  DNS_TARGET?: string;
  CLOUDFLARE_ZONE_ID: string;
  CLOUDFLARE_API_TOKEN: string;
};

export type Variables = {
  user: User;
  session: Session | null;
  sessionUser: User | null;
};
