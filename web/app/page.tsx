import { Button } from "@/components/ui";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary">
      <div className="relative inline-block">
        <div className="absolute -inset-4 rounded-full bg-accent/20 blur-2xl" />
        <h1 className="font-[family-name:var(--font-display)] relative text-5xl font-bold tracking-tight sm:text-6xl">
          <span className="text-text-primary">formality</span>
          <span className="text-accent">.life</span>
        </h1>
      </div>
      <p className="mt-6 text-lg text-text-secondary">
        Yet another image hosting platform.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="primary" size="lg">
            Dashboard
          </Button>
        </Link>
        <Link href="/waitlist">
          <Button variant="secondary" size="lg">
            Join Waitlist
          </Button>
        </Link>
      </div>
    </div>
  );
}
