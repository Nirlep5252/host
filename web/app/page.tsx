import { Button } from "@/components/ui";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary">
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
      <div className="mt-8">
        <Link href="/dashboard">
          <Button variant="primary" size="lg">
            Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
