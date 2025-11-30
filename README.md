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
- [Bun](https://bun.sh) (recommended) or npm
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
ADMIN_KEY=your-admin-key
ADMIN_EMAIL=admin@example.com
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

## License

MIT
