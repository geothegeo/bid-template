/** Pure ranking and pricing rules (requirements/02-ranking-and-bidding.md). */

export const POSITIONS = 20;

export type Plan = { months: number; cents: number };
export type BoardRules = { minBidCents: number; minIncrementCents: number; unrankedPlans: Plan[] };

export const DEFAULT_RULES: BoardRules = {
  minBidCents: 500,
  minIncrementCents: 500,
  unrankedPlans: [
    { months: 1, cents: 1000 },
    { months: 6, cents: 6000 },
    { months: 12, cents: 10000 },
  ],
};

type Rankable = { id: string; totalPaidCents: number; rankedPaidAt: Date | null };

/** R-RNK-02: higher total first, then earliest confirmed payment, then id. */
export function sortRanked<T extends Rankable>(listings: T[]): T[] {
  return [...listings].sort((a, b) =>
    b.totalPaidCents - a.totalPaidCents ||
    (a.rankedPaidAt?.getTime() ?? 0) - (b.rankedPaidAt?.getTime() ?? 0) ||
    a.id.localeCompare(b.id));
}

/**
 * R-RNK-04: price to hold `position`. `totalsDesc` are the other ranked totals, highest first
 * (exclude the bidder's own listing). Positions beyond the end cost the minimum bid.
 */
export function priceForPosition(totalsDesc: number[], position: number, rules: BoardRules): number {
  const holder = totalsDesc[position - 1];
  if (holder === undefined) return rules.minBidCents;
  return Math.max(rules.minBidCents, holder + rules.minIncrementCents);
}

/** R-RNK-05: price for each of positions 1..count. */
export function priceMatrix(totalsDesc: number[], rules: BoardRules, count = POSITIONS) {
  return Array.from({ length: count }, (_, i) => ({ position: i + 1, cents: priceForPosition(totalsDesc, i + 1, rules) }));
}

/** 1-based rank a given total would take against the other totals (ties go to existing listings). */
export function positionForTotal(totalsDesc: number[], total: number): number {
  return totalsDesc.filter((t) => t >= total).length + 1;
}

export function addMonths(from: Date, months: number): Date {
  const date = new Date(from);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date;
}

export const RANKED_MONTHS = 12;

export function parsePlans(value: unknown): Plan[] {
  if (!Array.isArray(value)) return DEFAULT_RULES.unrankedPlans;
  const plans = value.flatMap((p) =>
    p && Number.isInteger(p.months) && p.months > 0 && p.months <= 60 && Number.isInteger(p.cents) && p.cents > 0
      ? [{ months: p.months as number, cents: p.cents as number }] : []);
  return plans.length ? plans.sort((a, b) => a.months - b.months) : DEFAULT_RULES.unrankedPlans;
}

export function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
