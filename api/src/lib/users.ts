import { eq } from "drizzle-orm";
import { users, type Database, type User } from "../db";
import { createApiKeyForUser } from "./api-keys";

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
};

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}

export async function findUserByEmail(
  db: Database,
  email: string
): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function createUserWithApiKey(
  db: Database,
  input: { email: string; name?: string | null; keyName: string }
): Promise<{ user: PublicUser; apiKey: string }> {
  const [newUser] = await db
    .insert(users)
    .values({
      email: input.email,
      name: input.name ?? undefined,
    })
    .returning();

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  const apiKey = await createApiKeyForUser(db, newUser.id, input.keyName);

  return {
    user: toPublicUser(newUser),
    apiKey,
  };
}
