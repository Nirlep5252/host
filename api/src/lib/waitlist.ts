import { eq, sql } from "drizzle-orm";
import { waitlist, type Database, type WaitlistEntry } from "../db";

export const WAITLIST_STATUSES = ["pending", "approved", "rejected"] as const;
const WAITLIST_STATUS_SET = new Set<string>(WAITLIST_STATUSES);

export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];

export type WaitlistStats = Record<WaitlistStatus, number>;

export type PendingWaitlistEntryResult =
  | { ok: true; entry: WaitlistEntry }
  | { ok: false; error: string; status: 400 | 404 };

export function isWaitlistStatus(status: string): status is WaitlistStatus {
  return WAITLIST_STATUS_SET.has(status);
}

export async function getWaitlistStats(db: Database): Promise<WaitlistStats> {
  const rows = await db
    .select({
      status: waitlist.status,
      count: sql<number>`count(*)::int`,
    })
    .from(waitlist)
    .groupBy(waitlist.status);

  const stats: WaitlistStats = {
    pending: 0,
    approved: 0,
    rejected: 0,
  };

  for (const row of rows) {
    if (isWaitlistStatus(row.status)) {
      stats[row.status] = row.count;
    }
  }

  return stats;
}

export async function getPendingWaitlistEntry(
  db: Database,
  id: string
): Promise<PendingWaitlistEntryResult> {
  const [entry] = await db
    .select()
    .from(waitlist)
    .where(eq(waitlist.id, id));

  if (!entry) {
    return { ok: false, error: "Waitlist entry not found", status: 404 };
  }

  if (entry.status !== "pending") {
    return { ok: false, error: "Entry has already been processed", status: 400 };
  }

  return { ok: true, entry };
}
