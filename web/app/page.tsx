"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui";
import { motion } from "motion/react";
import {
  fadeIn,
  fadeInUp,
  EASE_OUT,
  DURATION,
  transition,
  staggeredTransition,
} from "@/lib/motion";
import Link from "next/link";

/* ─── Helpers ─── */

function GrainOverlay({ id }: { id: string }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035]"
      aria-hidden
    >
      <filter id={id}>
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.75"
          numOctaves="4"
          stitchTiles="stitch"
        />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${id})`} />
    </svg>
  );
}

function DotGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-[0.4]"
      aria-hidden
      style={{
        backgroundImage:
          "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "32px 32px",
      }}
    />
  );
}

function GradientDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-accent/25 to-transparent" />
  );
}

/* Link styled as a Button — avoids nesting <a><button> (a11y) */
const linkBase =
  "inline-flex items-center justify-center font-medium transition-all duration-150 rounded-[--radius-sm] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary active:scale-[0.98] h-12 px-6 text-base gap-2";
const linkPrimary = `${linkBase} bg-accent text-black hover:bg-accent-hover`;
const linkGhost = `${linkBase} text-text-secondary hover:text-text-primary hover:bg-bg-hover`;

/* ─── Page ─── */

export default function Home() {
  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Gradient mesh */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-[40%] h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-[160px]" />
          <div className="absolute right-[15%] top-[30%] h-[400px] w-[400px] rounded-full bg-purple-600/8 blur-[120px]" />
          <div className="absolute left-[20%] top-[55%] h-[350px] w-[350px] rounded-full bg-fuchsia-500/6 blur-[100px]" />
        </div>

        <DotGrid />
        <GrainOverlay id="grain-hero" />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          <motion.div
            className="relative inline-block"
            initial={fadeIn.initial}
            animate={fadeIn.animate}
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
          >
            <div className="absolute -inset-8 rounded-full bg-accent/20 blur-[60px]" />
            <h1 className="relative font-[family-name:var(--font-display)] text-6xl font-bold tracking-tight sm:text-8xl lg:text-9xl">
              <span className="text-text-primary">formality</span>
              <span
                className="text-accent"
                style={{
                  textShadow:
                    "0 0 40px rgba(217,70,239,0.5), 0 0 80px rgba(217,70,239,0.2)",
                }}
              >
                .life
              </span>
            </h1>
          </motion.div>

          <motion.p
            className="mt-6 max-w-lg text-center text-lg text-text-secondary sm:text-xl"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ duration: DURATION.slow, delay: 0.1, ease: EASE_OUT }}
          >
            Fast, private image hosting for developers.
          </motion.p>

          <motion.div
            className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ duration: DURATION.slow, delay: 0.2, ease: EASE_OUT }}
          >
            <Link href="/waitlist" className={linkPrimary}>
              Join the Waitlist
            </Link>
            <Link href="/login" className={linkGhost}>
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════ FEATURES — BENTO GRID ═══════════ */}
      <section className="relative px-6 py-24 sm:py-32">
        <DotGrid />

        <div className="relative z-10 mx-auto max-w-6xl">
          <motion.div
            className="mb-16 text-center"
            initial={fadeIn.initial}
            whileInView={fadeIn.animate}
            viewport={{ once: true, amount: 0.5 }}
            transition={transition.slow}
          >
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
              Built for developers
            </h2>
            <p className="mt-3 text-text-secondary">
              Simple primitives. No&nbsp;complexity.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* ── Card 1: Drag & Drop Upload (wide) ── */}
            <motion.div
              className="sm:col-span-2"
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={{ once: true, amount: 0.3 }}
              transition={staggeredTransition(0, 0.05)}
            >
              <Card hoverable className="group relative h-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/[0.06] to-transparent" />
                <CardHeader className="relative">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[--radius-sm] bg-accent/10 text-accent ring-1 ring-accent/20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <CardTitle>Drag &amp; Drop Upload</CardTitle>
                  <CardDescription>
                    Drop your images, get instant links.
                  </CardDescription>
                </CardHeader>
                <div className="relative pt-3">
                  <div className="flex items-center justify-center rounded-[--radius-md] border border-dashed border-border-default/60 bg-bg-primary/40 px-6 py-5 text-text-muted transition-colors group-hover:border-accent/20">
                    <div className="flex flex-col items-center gap-1.5">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted/60">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <span className="text-xs">
                        Drop files or click to upload
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Card 2: Custom Domains ── */}
            <motion.div
              className="flex"
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={{ once: true, amount: 0.3 }}
              transition={staggeredTransition(1, 0.05)}
            >
              <Card hoverable className="group relative w-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-purple-500/[0.05] to-transparent" />
                <div className="relative">
                  <CardHeader>
                    <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[--radius-sm] bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20" />
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <CardTitle>Custom Domains</CardTitle>
                    <CardDescription>
                      Serve images from your own domain.
                    </CardDescription>
                  </CardHeader>
                  <div className="pt-6">
                    <div className="rounded-[--radius-sm] bg-bg-primary/50 px-4 py-3 font-[family-name:var(--font-geist-mono)] text-sm">
                      <span className="text-text-muted">img.</span>
                      <span className="text-purple-400">yourdomain</span>
                      <span className="text-text-muted">.com/</span>
                      <span className="text-text-secondary">photo.webp</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Card 3: API & ShareX ── */}
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={{ once: true, amount: 0.3 }}
              transition={staggeredTransition(2, 0.05)}
            >
              <Card hoverable className="group relative h-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-500/[0.04] to-transparent" />
                <CardHeader className="relative">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[--radius-sm] bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16 18 22 12 16 6" />
                      <polyline points="8 6 2 12 8 18" />
                    </svg>
                  </div>
                  <CardTitle>API &amp; ShareX</CardTitle>
                  <CardDescription>
                    Integrate with your tools via API&nbsp;key.
                  </CardDescription>
                </CardHeader>
                <div className="relative pt-2">
                  <div className="rounded-[--radius-sm] bg-bg-primary/50 px-3 py-2 font-[family-name:var(--font-geist-mono)] text-xs text-text-muted">
                    X-API-Key:{" "}
                    <span className="text-emerald-400/70">sk_live_••••••</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Card 4: Private by Default ── */}
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={{ once: true, amount: 0.3 }}
              transition={staggeredTransition(3, 0.05)}
            >
              <Card hoverable className="group relative h-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-transparent" />
                <CardHeader className="relative">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[--radius-sm] bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <CardTitle>Private by Default</CardTitle>
                  <CardDescription>
                    Your images, your rules. Toggle visibility anytime.
                  </CardDescription>
                </CardHeader>
                <div className="relative flex items-center gap-2.5 pt-2">
                  <div className="flex items-center gap-2 rounded-full bg-bg-primary/50 px-3 py-1.5 text-xs ring-1 ring-amber-500/15">
                    <div className="h-2 w-2 rounded-full bg-amber-400" />
                    <span className="text-text-secondary">Private</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-bg-primary/30 px-3 py-1.5 text-xs">
                    <div className="h-2 w-2 rounded-full bg-text-muted/30" />
                    <span className="text-text-muted">Public</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Card 5: Fast CDN ── */}
            <motion.div
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={{ once: true, amount: 0.3 }}
              transition={staggeredTransition(4, 0.05)}
            >
              <Card hoverable className="group relative h-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-500/[0.04] to-transparent" />
                <CardHeader className="relative">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[--radius-sm] bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                    </svg>
                  </div>
                  <CardTitle>Fast CDN</CardTitle>
                  <CardDescription>
                    Lightning-fast delivery worldwide.
                  </CardDescription>
                </CardHeader>
                <div className="relative flex items-center gap-4 pt-2 font-[family-name:var(--font-geist-mono)] text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span className="text-sky-400">12ms</span>
                    <span className="text-text-muted">NYC</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-400/60" />
                    <span className="text-sky-400/80">38ms</span>
                    <span className="text-text-muted">LON</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-sky-400/40" />
                    <span className="text-sky-400/60">52ms</span>
                    <span className="text-text-muted">TYO</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* ── Card 6: Storage Dashboard (full width) ── */}
            <motion.div
              className="sm:col-span-2 lg:col-span-3"
              initial={fadeInUp.initial}
              whileInView={fadeInUp.animate}
              viewport={{ once: true, amount: 0.3 }}
              transition={staggeredTransition(5, 0.05)}
            >
              <Card hoverable className="group relative h-full overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-500/[0.04] to-transparent" />
                <CardHeader className="relative">
                  <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[--radius-sm] bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 20V10" />
                      <path d="M12 20V4" />
                      <path d="M6 20v-6" />
                    </svg>
                  </div>
                  <CardTitle>Storage Dashboard</CardTitle>
                  <CardDescription>
                    Track usage with real-time stats.
                  </CardDescription>
                </CardHeader>
                <div className="relative pt-3">
                  <div className="flex items-end gap-1.5">
                    {[30, 50, 40, 70, 55, 80, 65, 90, 75, 95, 85, 60].map(
                      (h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-rose-500/30 to-rose-400/10 transition-all duration-300 group-hover:from-rose-500/40 group-hover:to-rose-400/20"
                          style={{ height: `${h * 0.5}px` }}
                        />
                      )
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <GradientDivider />

      {/* ═══════════ CLOSING CTA ═══════════ */}
      <section className="relative overflow-hidden bg-bg-secondary px-6 py-28 sm:py-36">
        {/* Gradient mesh */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-[140px]" />
          <div className="absolute left-[30%] top-[40%] h-[300px] w-[300px] rounded-full bg-purple-600/6 blur-[100px]" />
        </div>
        <DotGrid />
        <GrainOverlay id="grain-cta" />

        <motion.div
          className="relative z-10 mx-auto flex max-w-2xl flex-col items-center text-center"
          initial={fadeIn.initial}
          whileInView={fadeIn.animate}
          viewport={{ once: true, amount: 0.5 }}
          transition={transition.slow}
        >
          <h2 className="font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight text-text-primary sm:text-5xl lg:text-6xl">
            Ready to{" "}
            <span
              className="text-accent"
              style={{
                textShadow:
                  "0 0 30px rgba(217,70,239,0.4), 0 0 60px rgba(217,70,239,0.15)",
              }}
            >
              host
            </span>
            ?
          </h2>
          <p className="mt-5 text-lg text-text-secondary">
            Join the waitlist and get early access.
          </p>
          <div className="mt-10">
            <Link href="/waitlist" className={linkPrimary}>
              Get Early Access
            </Link>
          </div>
        </motion.div>
      </section>

      <GradientDivider />

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-bg-tertiary px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-[family-name:var(--font-display)] text-sm font-medium text-text-muted">
            formality<span className="text-accent">.life</span>
          </span>
          <span className="text-xs text-text-muted">
            &copy; {new Date().getFullYear()} formality.life
          </span>
        </div>
      </footer>
    </div>
  );
}
