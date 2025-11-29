import type { R2Bucket } from "@cloudflare/workers-types";
import type { User } from "./db";

export type Bindings = {
  R2: R2Bucket;
  DATABASE_URL: string;
  ADMIN_KEY: string;
  ADMIN_EMAIL: string;
  BASE_URL: string;
};

export type Variables = {
  user: User;
};
