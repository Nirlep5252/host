# GitHub OAuth + Magic Link Rate Limiting

## 1. GitHub OAuth

### Backend (`api/src/lib/auth.ts`)

Add `socialProviders.github` with `disableImplicitSignUp: true` so only existing users (matched by email) can sign in via GitHub. Enable account linking so GitHub accounts are automatically linked to existing email-based accounts.

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

### Environment

Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` to `Bindings` type and Cloudflare Worker env.

### Frontend (`web/app/login/page.tsx`)

Add a "Continue with GitHub" button below the email form. Calls `authClient.signIn.social({ provider: "github", callbackURL: "/dashboard" })`.

### Frontend client (`web/lib/auth-client.ts`)

No plugin changes needed — social sign-in is built into the base better-auth client.

## 2. Magic Link Rate Limiting

### Approach

In-memory rate limit map inside `sendMagicLink` callback. Tracks `email -> timestamps[]` of recent sends. Rejects (silently returns) if more than 3 sends in 5 minutes for the same email.

```typescript
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 3;
```

Check and prune timestamps at the start of `sendMagicLink`. If limit exceeded, return early without sending. This runs per-isolate on Cloudflare Workers, which is sufficient to prevent rapid-fire abuse.

## Files Changed

| File | Change |
|------|--------|
| `api/src/lib/auth.ts` | Add GitHub social provider, account linking, rate limit logic |
| `api/src/types.ts` | Add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` to `Bindings` |
| `web/app/login/page.tsx` | Add GitHub OAuth button |
