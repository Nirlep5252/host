"use client";

import { useState } from "react";
import * as motion from "motion/react-client";
import {
  Button,
  Input,
  Textarea,
  Badge,
  Toggle,
  StatsCard,
  ImageCard,
} from "@/components/ui";

function Section({
  children,
  title,
  delay = 0,
}: {
  children: React.ReactNode;
  title: string;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.4, 0, 0.2, 1] }}
      className="space-y-6"
    >
      <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-widest text-text-muted">
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

function ColorSwatch({
  name,
  value,
  textColor = "text-text-primary",
}: {
  name: string;
  value: string;
  textColor?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copyToClipboard}
      className="group flex flex-col gap-2 text-left transition-transform duration-150 hover:scale-105"
    >
      <div
        className={`h-16 w-full rounded-[--radius-md] border border-border-subtle ${textColor} flex items-end p-2 font-mono text-xs`}
        style={{ background: value }}
      >
        <span className="opacity-0 transition-opacity group-hover:opacity-100">
          {copied ? "Copied!" : value}
        </span>
      </div>
      <span className="text-sm text-text-secondary">{name}</span>
    </button>
  );
}

export default function DesignSystemPage() {
  const [toggleChecked, setToggleChecked] = useState(false);
  const [toggleChecked2, setToggleChecked2] = useState(true);

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-8 lg:px-12">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="mb-24 text-center"
        >
          <div className="relative inline-block">
            <div className="absolute -inset-4 rounded-full bg-accent/20 blur-2xl" />
            <h1 className="font-[family-name:var(--font-display)] relative text-6xl font-bold tracking-tight sm:text-7xl">
              <span className="text-text-primary">Host</span>
              <span className="text-accent">.</span>
            </h1>
          </div>
          <p className="mt-6 text-lg text-text-secondary">
            Your images. Your control.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button variant="primary" size="lg">
              Get Started
            </Button>
            <Button variant="secondary" size="lg">
              Documentation
            </Button>
          </div>
        </motion.header>

        <div className="space-y-20">
          {/* Colors */}
          <Section title="Colors" delay={0.1}>
            <div className="space-y-8">
              <div>
                <h3 className="mb-4 text-sm font-medium text-text-secondary">
                  Backgrounds
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <ColorSwatch name="Primary" value="#000000" />
                  <ColorSwatch name="Secondary" value="#0a0a0a" />
                  <ColorSwatch name="Tertiary" value="#141414" />
                  <ColorSwatch name="Hover" value="#1a1a1a" />
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-medium text-text-secondary">
                  Text
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <ColorSwatch
                    name="Primary"
                    value="#fafafa"
                    textColor="text-black"
                  />
                  <ColorSwatch
                    name="Secondary"
                    value="#a1a1a1"
                    textColor="text-black"
                  />
                  <ColorSwatch
                    name="Muted"
                    value="#525252"
                    textColor="text-white"
                  />
                </div>
              </div>
              <div>
                <h3 className="mb-4 text-sm font-medium text-text-secondary">
                  Accent & Semantic
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <ColorSwatch
                    name="Accent"
                    value="#d946ef"
                    textColor="text-black"
                  />
                  <ColorSwatch
                    name="Success"
                    value="#22c55e"
                    textColor="text-black"
                  />
                  <ColorSwatch
                    name="Warning"
                    value="#f59e0b"
                    textColor="text-black"
                  />
                  <ColorSwatch
                    name="Error"
                    value="#ef4444"
                    textColor="text-black"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Typography */}
          <Section title="Typography" delay={0.15}>
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="font-[family-name:var(--font-display)] text-5xl font-bold text-text-primary">
                  Display Heading
                </h1>
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold text-text-primary">
                  Section Heading
                </h2>
                <h3 className="text-xl font-medium text-text-primary">
                  Subsection Heading
                </h3>
                <p className="max-w-prose text-text-secondary">
                  Body text with secondary color. Used for descriptions,
                  explanations, and longer form content that supports the
                  primary information on the page.
                </p>
                <p className="text-sm text-text-muted">
                  Small muted text for metadata and supplementary information.
                </p>
                <code className="inline-block rounded-[--radius-sm] bg-bg-tertiary px-2 py-1 font-mono text-sm text-accent">
                  sk_****
                </code>
              </div>
            </div>
          </Section>

          {/* Buttons */}
          <Section title="Buttons" delay={0.2}>
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="primary" disabled>
                  Disabled
                </Button>
                <Button variant="secondary" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          </Section>

          {/* Inputs */}
          <Section title="Inputs" delay={0.25}>
            <div className="grid max-w-md gap-6">
              <Input
                label="Email"
                placeholder="you@example.com"
                type="email"
              />
              <Input label="API Key" placeholder="sk_..." />
              <Textarea
                label="Description"
                placeholder="Enter a description..."
                rows={3}
              />
            </div>
          </Section>

          {/* Badges */}
          <Section title="Badges" delay={0.3}>
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="success">Public</Badge>
              <Badge variant="warning">Processing</Badge>
              <Badge variant="error">Private</Badge>
            </div>
          </Section>

          {/* Toggle */}
          <Section title="Toggle" delay={0.35}>
            <div className="flex items-center gap-4">
              <Toggle checked={toggleChecked} onChange={setToggleChecked} />
              <Toggle checked={toggleChecked2} onChange={setToggleChecked2} />
              <span className="text-sm text-text-secondary">
                Private visibility
              </span>
            </div>
          </Section>

          {/* Cards */}
          <Section title="Cards" delay={0.4}>
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatsCard
                  label="Total Images"
                  value="1,234"
                  subtext="+12% from last month"
                />
                <StatsCard
                  label="Storage Used"
                  value="4.2 GB"
                  subtext="of 10 GB"
                />
                <StatsCard
                  label="Total Views"
                  value="89.2K"
                  subtext="All time"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ImageCard
                  id="1"
                  filename="abc123.png"
                  size="2.4 MB"
                  onCopy={(id) => console.log("Copy:", id)}
                  onDelete={(id) => console.log("Delete:", id)}
                />
                <ImageCard
                  id="2"
                  filename="def456.jpg"
                  size="1.8 MB"
                  isPrivate
                  onCopy={(id) => console.log("Copy:", id)}
                  onDelete={(id) => console.log("Delete:", id)}
                />
                <ImageCard
                  id="3"
                  filename="ghi789.webp"
                  size="856 KB"
                  onCopy={(id) => console.log("Copy:", id)}
                  onDelete={(id) => console.log("Delete:", id)}
                />
              </div>
            </div>
          </Section>

          {/* Focus States Demo */}
          <Section title="Focus States" delay={0.45}>
            <p className="mb-4 text-sm text-text-secondary">
              Tab through the elements below to see the magenta focus rings.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Button variant="primary">Focusable Button</Button>
              <Input placeholder="Focusable input" />
              <Toggle checked={false} onChange={() => {}} />
            </div>
          </Section>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-24 border-t border-border-subtle pt-8 text-center"
        >
          <p className="text-sm text-text-muted">
            Design System for Host - Image Hosting Platform
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
