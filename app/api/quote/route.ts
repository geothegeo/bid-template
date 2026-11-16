import { NextResponse } from "next/server";
import { getRules, rankedTotals, resolveBoard } from "@/lib/boards";
import { priceMatrix } from "@/lib/ranking";

export const dynamic = "force-dynamic";

/** Fee rules and 1–20 price matrix for a board; `exclude` removes the bidder's own listing. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const board = await resolveBoard(params.get("board"));
  if (!board) return NextResponse.json({ error: "Unknown category." }, { status: 404 });
  const rules = await getRules(board.scopeKey);
  const totals = await rankedTotals(board.categoryId, params.get("exclude") ?? undefined);
  return NextResponse.json({ name: board.name, rules, matrix: priceMatrix(totals, rules), ranked: totals.length });
}
