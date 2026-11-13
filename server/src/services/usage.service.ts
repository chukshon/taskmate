import { createClerkClient } from "@clerk/backend";
import { and, eq, gte, sql } from "drizzle-orm";
import type { LanguageModelUsage } from "ai";

import { env } from "@/config/env.config";
import { db } from "@/db";
import {
  usageEntries,
  type NewUsageEntry,
  type UsageKind,
} from "@/db/schema";

// Not @clerk/express: Trigger.dev tasks meter usage too, outside HTTP requests
const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

// What one billing period of the paid plan includes
export const usageLimits: Record<UsageKind, number> = {
  // $10 of model spend, in millionths of a dollar
  ai: 10_000_000,
  // 50 hours of running sandboxes, in seconds
  sandbox: 50 * 60 * 60,
};

// Dollars per million tokens — list-price order of magnitude for abuse caps
const pricing = { input: 1.25, output: 10 };

// What a call to the chat model cost, in millionths of a dollar
export function chatModelCost(usage: LanguageModelUsage) {
  // Dollars per million tokens is millionths of a dollar per token
  return Math.ceil(
    (usage.inputTokens ?? 0) * pricing.input +
      (usage.outputTokens ?? 0) * pricing.output,
  );
}

// The billing period the user's paid plan is in, or null without a paid plan
async function getBillingPeriod(userId: string) {
  const subscription = await clerk.billing.getUserBillingSubscription(userId);

  // The free plan is a subscription item too, but one that never ends
  const item = subscription.subscriptionItems.find(
    (item) => item.status === "active" && item.periodEnd,
  );
  if (!item?.periodEnd) return null;

  return { start: new Date(item.periodStart), end: new Date(item.periodEnd) };
}

// What the user has used and has left in their current billing period, or null
// without a paid plan. Takes the user ID so tasks can ask without a session.
export async function getUsage(userId: string) {
  const period = await getBillingPeriod(userId);
  if (!period) return null;

  const rows = await db
    .select({
      kind: usageEntries.kind,
      amount: sql`sum(${usageEntries.amount})`.mapWith(Number),
    })
    .from(usageEntries)
    .where(
      and(
        eq(usageEntries.userId, userId),
        gte(usageEntries.createdAt, period.start),
      ),
    )
    .groupBy(usageEntries.kind);

  const used: Record<UsageKind, number> = { ai: 0, sandbox: 0 };
  for (const row of rows) used[row.kind] = row.amount;

  return {
    period,
    used,
    remaining: {
      ai: Math.max(0, usageLimits.ai - used.ai),
      sandbox: Math.max(0, usageLimits.sandbox - used.sandbox),
    },
  };
}

export type Usage = NonNullable<Awaited<ReturnType<typeof getUsage>>>;

// Adds to the ledger. An entry whose key is already there is left out.
export async function recordUsage(entries: NewUsageEntry[]) {
  if (entries.length === 0) return;

  await db
    .insert(usageEntries)
    .values(entries)
    .onConflictDoNothing({ target: usageEntries.idempotencyKey });
}

export async function hasUsageLeft(userId: string, kind: UsageKind) {
  const usage = await getUsage(userId);
  return !!usage && usage.remaining[kind] > 0;
}
