import { test } from "node:test";
import assert from "node:assert/strict";
import { addMonths, DEFAULT_RULES, parsePlans, positionForTotal, priceForPosition, priceMatrix, sortRanked } from "../lib/ranking.ts";
import { targetKey, validateEmail, validateTarget } from "../lib/validation.ts";

const rules = (inc) => ({ ...DEFAULT_RULES, minBidCents: 500, minIncrementCents: inc * 100 });
const totals = [500, 300, 150, 50].map((d) => d * 100);

test("v2 example: increment $50 -> #1 costs $550; increment $20 -> #2 costs $320", () => {
  assert.equal(priceForPosition(totals, 1, rules(50)), 55000);
  assert.equal(priceForPosition(totals, 2, rules(20)), 32000);
});

test("v3 example: $100 listing upgrading to #5 held at $160 with $15 increment pays $75", () => {
  const others = [180, 180, 180, 180, 160, 150].map((d) => d * 100).sort((a, b) => b - a);
  const price = priceForPosition(others, 5, rules(15));
  assert.equal(price, 17500);
  assert.equal(price - 10000, 7500);
});

test("positions past the end cost the minimum bid and the matrix has 20 rows", () => {
  assert.equal(priceForPosition(totals, 5, rules(50)), 500);
  const matrix = priceMatrix(totals, rules(50));
  assert.equal(matrix.length, 20);
  assert.equal(matrix[19].cents, 500);
});

test("paying the price for a position actually takes that position", () => {
  const r = rules(20);
  for (let p = 1; p <= 5; p++) assert.equal(positionForTotal(totals, priceForPosition(totals, p, r)), p);
});

test("equal totals are ordered by first confirmed payment", () => {
  const a = { id: "a", totalPaidCents: 100, rankedPaidAt: new Date(2) };
  const b = { id: "b", totalPaidCents: 100, rankedPaidAt: new Date(1) };
  const c = { id: "c", totalPaidCents: 200, rankedPaidAt: new Date(9) };
  assert.deepEqual(sortRanked([a, b, c]).map((x) => x.id), ["c", "b", "a"]);
});

test("month arithmetic clamps to month end", () => {
  assert.equal(addMonths(new Date("2026-01-31T00:00:00Z"), 1).toISOString().slice(0, 10), "2026-02-28");
  assert.equal(addMonths(new Date("2026-03-15T00:00:00Z"), 12).toISOString().slice(0, 10), "2027-03-15");
});

test("plans fall back to defaults when invalid", () => {
  assert.deepEqual(parsePlans("x"), DEFAULT_RULES.unrankedPlans);
  assert.deepEqual(parsePlans([{ months: 3, cents: 2500 }, { months: 1, cents: 1000 }]).map((p) => p.months), [1, 3]);
});

test("targets accept URLs and handles; duplicate keys normalise", () => {
  assert.equal(validateTarget("#MyShop_1"), "#MyShop_1");
  assert.throws(() => validateTarget("#bad handle"));
  assert.equal(targetKey("https://www.Example.com/a/"), targetKey("https://example.com/a"));
  assert.equal(validateEmail(" A@B.co "), "a@b.co");
  assert.throws(() => validateEmail("nope"));
});
