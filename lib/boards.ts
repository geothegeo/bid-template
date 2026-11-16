import { db } from "./db";
import { DEFAULT_RULES, parsePlans, shuffle, type BoardRules } from "./ranking";

export const HOME = "home";

export type Board = { scopeKey: string; categoryId: string | null; name: string; slug: string | null };

export async function getRules(scopeKey: string): Promise<BoardRules> {
  const row = await db.boardConfig.findUnique({ where: { scopeKey } });
  if (!row) return DEFAULT_RULES;
  return { minBidCents: row.minBidCents, minIncrementCents: row.minIncrementCents, unrankedPlans: parsePlans(row.unrankedPlans) };
}

export async function resolveBoard(slug?: string | null): Promise<Board | null> {
  if (!slug || slug === HOME) return { scopeKey: HOME, categoryId: null, name: "Homepage", slug: null };
  const category = await db.category.findFirst({ where: { slug, approved: true } });
  return category ? { scopeKey: category.id, categoryId: category.id, name: category.name, slug: category.slug } : null;
}

const activeNow = () => ({ status: "active" as const, expiresAt: { gt: new Date() } });

/** Active ranked listings for a board in rank order (R-RNK-02, R-RNK-03). */
export function rankedListings(categoryId: string | null, excludeId?: string) {
  return db.listing.findMany({
    where: { type: "ranked", categoryId, ...activeNow(), ...(excludeId ? { id: { not: excludeId } } : {}) },
    orderBy: [{ totalPaidCents: "desc" }, { rankedPaidAt: "asc" }, { id: "asc" }],
  });
}

export async function rankedTotals(categoryId: string | null, excludeId?: string) {
  return (await rankedListings(categoryId, excludeId)).map((l) => Number(l.totalPaidCents));
}

export async function unrankedListings(categoryId: string | null, limit = 100) {
  return shuffle(await db.listing.findMany({ where: { type: "unranked", categoryId, ...activeNow() }, take: 500 })).slice(0, limit);
}

/** Position (1-based) of a listing within its board, or null if not ranked/active. */
export async function positionOf(listing: { id: string; categoryId: string | null }) {
  const index = (await rankedListings(listing.categoryId)).findIndex((l) => l.id === listing.id);
  return index === -1 ? null : index + 1;
}

export async function categoryTree() {
  const all = await db.category.findMany({ where: { approved: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return all.filter((c) => !c.parentId).map((c) => ({ ...c, children: all.filter((k) => k.parentId === c.id) }));
}

export function isLive(l: { status: string; expiresAt: Date | null }) {
  return l.status === "active" && !!l.expiresAt && l.expiresAt > new Date();
}

export const dollars = (cents: number | bigint) => `$${(Number(cents) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
export const fmtDate = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—");
