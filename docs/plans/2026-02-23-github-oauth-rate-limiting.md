# GitHub OAuth + Magic Link Rate Limiting — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add GitHub OAuth as an alternative sign-in method and rate-limit magic link email sends.

**Architecture:** Use better-auth's built-in `socialProviders.github` with `disableImplicitSignUp: true` to restrict to existing users. Add in-memory rate limiting in the `sendMagicLink` callback (3 sends per email per 5 minutes).

**Tech Stack:** better-auth, Hono, Cloudflare Workers, Next.js, Resend

---

### Task 1: Add rate limiting to magic link sends

**Files:**
- Modify: `api/src/lib/auth.ts`

**Step 1: Add rate limit map and check to `sendMagicLink`**

Add above `createAuth`:

```typescript
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 3;
```

Add at the top of `sendMagicLink`, before the existing user check:

```typescript
const now = Date.now();
const timestamps = rateLimitMap.get(email) ?? [];
const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);

if (recent.length >= RATE_LIMIT_MAX) {
  return; // silently reject
}

recent.push(now);
rateLimitMap.set(email, recent);
```

**Step 2: Verify**

Run: `cd /home/nirlep/repos/nirlep5252/host/api && npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add api/src/lib/auth.ts
git commit -m "feat: add in-memory rate limiting to magic link sends"
```

---

### Task 2: Add GitHub OAuth env vars

**Files:**
- Modify: `api/src/types.ts`

**Step 1: Add env var types to `Bindings`**

Add to the `Bindings` type:

```typescript
GITHUB_CLIENT_ID: string;
GITHUB_CLIENT_SECRET: string;
```

**Step 2: Verify**

Run: `cd /home/nirlep/repos/nirlep5252/host/api && npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add api/src/types.ts
git commit -m "feat: add GitHub OAuth env var types"
```

---

### Task 3: Add GitHub social provider to better-auth config

**Files:**
- Modify: `api/src/lib/auth.ts`

**Step 1: Add `socialProviders` and `account` config**

In the `betterAuth({...})` call, add after `basePath`:

```typescript
socialProviders: {
  github: {
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
    disableImplicitSignUp: true,
  },
},
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["github"],
  },
},
```

**Step 2: Verify**

Run: `cd /home/nirlep/repos/nirlep5252/host/api && npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add api/src/lib/auth.ts
git commit -m "feat: add GitHub OAuth social provider with account linking"
```

---

### Task 4: Add GitHub sign-in button to login page

**Files:**
- Modify: `web/app/login/page.tsx`

**Step 1: Add GitHub button to the login form**

In the `step === "email"` branch, after the `</form>` closing tag and before the `</>` fragment close, add:

```tsx
<div className="relative my-6">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-border-subtle" />
  </div>
  <div className="relative flex justify-center text-xs">
    <span className="bg-bg-primary px-2 text-text-muted">or</span>
  </div>
</div>

<Button
  type="button"
  variant="secondary"
  size="lg"
  className="w-full"
  onClick={() => {
    authClient.signIn.social({
      provider: "github",
      callbackURL: `${FRONTEND_URL}/dashboard`,
    });
  }}
>
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
  Continue with GitHub
</Button>
```

**Step 2: Verify**

Run: `cd /home/nirlep/repos/nirlep5252/host/web && npx next build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add web/app/login/page.tsx
git commit -m "feat: add GitHub sign-in button to login page"
```
