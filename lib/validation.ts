const blockedDomains = [
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "is.gd", "buff.ly",
  "ow.ly", "shorturl.at", "cutt.ly", "rebrand.ly", "lnkd.in",
  "discord.gg", "discord.com", "discordapp.com", "chat.whatsapp.com",
  "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com", "redtube.com",
  "youporn.com", "onlyfans.com",
];

export function cleanUrl(input: unknown): string {
  if (typeof input !== "string" || input.length > 2048) {
    throw new Error("Enter a valid URL.");
  }

  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new Error("Enter a valid URL including https://.");
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Only HTTP or HTTPS links without credentials are allowed.");
  }

  const domain = url.hostname.toLowerCase().replace(/\.+$/, "");
  let path: string;
  try {
    path = decodeURIComponent(url.pathname);
  } catch {
    throw new Error("Enter a valid URL.");
  }
  if (blockedDomains.some((blocked) => domain === blocked || domain.endsWith(`.${blocked}`)) ||
      (["t.me", "telegram.me"].includes(domain) && (/^\/joinchat(?:\/|$)/i.test(path) || path.startsWith("/+")))) {
    throw new Error("That domain or invite link is not allowed.");
  }

  url.hostname = domain;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export function validateLabel(input: unknown): string {
  if (typeof input !== "string" || !input.trim() || input.trim().length > 80) {
    throw new Error("Enter a label between 1 and 80 characters.");
  }
  return input.trim();
}

export function validateAmount(input: unknown): number {
  if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 5 || input > 999999) {
    throw new Error("Enter a whole-dollar bid between $5 and $999,999.");
  }
  return input * 100;
}
