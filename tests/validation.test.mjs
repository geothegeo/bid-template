import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanUrl, validateAmount, validateLabel } from "../lib/validation.ts";

test("URLs lose queries and fragments while preserving their path", () => {
  assert.equal(cleanUrl("https://Example.com/product?utm_source=x&ref=ad#top"), "https://example.com/product");
});

test("blocked domains, invite links, and unsafe URLs are rejected", () => {
  for (const url of [
    "https://sub.bit.ly/a", "https://tinyurl.com/a", "https://discord.gg/invite",
    "https://chat.whatsapp.com/invite", "https://t.me/joinchat/abc",
    "https://t.me/%2Babc", "https://telegram.me/%6aoinchat/abc",
    "https://sub.pornhub.com/a", "javascript:alert(1)", "******example.com/",
  ]) {
    assert.throws(() => cleanUrl(url), url);
  }
  assert.equal(cleanUrl("https://t.me/public_channel"), "https://t.me/public_channel");
  assert.equal(cleanUrl("https://notbit.ly/"), "https://notbit.ly/");
});

test("only whole dollar amounts in the supported range are accepted", () => {
  assert.equal(validateAmount(5), 500);
  assert.equal(validateAmount(999999), 99999900);
  for (const amount of [0, 4, 5.5, -5, 1000000, "5", NaN]) {
    assert.throws(() => validateAmount(amount));
  }
});

test("labels are trimmed and bounded", () => {
  assert.equal(validateLabel("  Example  "), "Example");
  assert.throws(() => validateLabel("   "));
  assert.throws(() => validateLabel("x".repeat(81)));
});
