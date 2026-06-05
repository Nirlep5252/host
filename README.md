# formality.life

A self-hosted image hosting platform built for ShareX. Fast uploads, private image sharing, and a clean dashboard to manage everything.

**Live at [https://formality.life](https://formality.life)**

## Features

### Image Hosting

- Upload images via API or drag-and-drop in the dashboard
- Supports PNG, JPG, GIF, WebP, and SVG (up to 10MB)
- Short URLs for easy sharing (`/i/abc123`)
- Private images with token-based access links
- Custom domain support ;)

## Tech Stack

**API** (Cloudflare Workers)

- [Hono](https://hono.dev) - Web framework
- [Cloudflare R2](https://developers.cloudflare.com/r2) - Object storage
- [Neon](https://neon.tech) - Serverless Postgres
- [Drizzle ORM](https://orm.drizzle.team) - Database ORM
- [better-auth](https://better-auth.com) - Authentication
- [Resend](https://resend.com) - Email delivery

**Web**

- [Next.js](https://nextjs.org) - React framework
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Tailwind CSS](https://tailwindcss.com) - Styling
- [Motion](https://motion.dev) - Animations

## Setup

### Prerequisites

- Node.js 18+
- [Bun](https://bun.sh)
- Cloudflare account (for R2 and Workers)
- Neon account (or any Postgres)
- Resend account (for magic link emails)

### Environment Variables

**API** (`api/.env`)

```env
DATABASE_URL=postgresql://...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=...
BASE_URL=https://formality.life
TOKEN_SECRET=your-token-secret
RESEND_API_KEY=re_...
BETTER_AUTH_SECRET=your-auth-secret
```

**Web** (`web/.env.local`)

```env
NEXT_PUBLIC_API_URL=https://formality.life
```

### Development

```bash
# Clone the repo
git clone https://github.com/nirlep5252/host.git
cd host

# API
cd api
bun install
bun run dev

# Web (in another terminal)
cd web
bun install
bun run dev
```

### Database

```bash
cd api
bun run db:generate  # Generate migrations
bun run db:push      # Push to database
```

### Deploy

#### Backend CI/CD

Backend deployment is handled by GitHub Actions in `.github/workflows/api-deploy.yml`.

- Pull requests that touch `api/**` run API validation.
- Pushes to `main` that touch `api/**` validate and deploy the Worker.
- Manual runs deploy only when started from the `main` branch.
- Production deploys are serialized with an `api-production` concurrency group.
- The deploy job targets the GitHub `production` environment. Configure required reviewers there if production should require manual approval.

Add these GitHub Actions secrets before enabling the workflow:

```env
CLOUDFLARE_ACCOUNT_ID=...
CLOUDFLARE_API_TOKEN_DEPLOY=...
```

`CLOUDFLARE_API_TOKEN_DEPLOY` is only for CI deployment. Keep the runtime Worker `CLOUDFLARE_API_TOKEN` binding separate because the app uses it for custom-domain Cloudflare API calls.

The deploy token should be scoped to the Cloudflare account that owns the Worker. Start with Cloudflare's Workers edit permissions, plus R2 permissions if Wrangler requires them for the `R2` binding. Do not use a global API key.

The runtime Worker variables/secrets still need to exist in Cloudflare:

```env
DATABASE_URL=...
TOKEN_SECRET=...
RESEND_API_KEY=...
BETTER_AUTH_SECRET=...
CLOUDFLARE_ZONE_ID=...
CLOUDFLARE_API_TOKEN=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
FRONTEND_URL=...
DNS_TARGET=... # optional
```

Admin access is account-based. The `0007_add-user-roles` migration adds `users.role` and promotes `hello@nirlep.dev` to `admin`.

The deploy script uses `wrangler deploy --keep-vars` because several runtime bindings are currently managed outside `wrangler.toml`. After all non-secret runtime variables are moved into `wrangler.toml`, `--keep-vars` can be removed and the config file can become the full source of truth.

**API** (Cloudflare Workers)

```bash
cd api
bun run deploy
```

**Web** (Vercel)

```bash
cd web
vercel
```

## ShareX Configuration

1. Log in to the dashboard
2. Download ShareX config from sidebar
