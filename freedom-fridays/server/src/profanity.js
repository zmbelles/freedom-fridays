import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const raw = JSON.parse(
  readFileSync(join(__dirname, "../profanity_filter/en.json"), "utf8")
);

function escapeRegex(s) {
  // Escape regex special chars, but treat * as a wildcard (becomes .*)
  return s.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
}

// Christian vocabulary that is normal on a prayer board and should never be blocked
const ALLOWED_IDS = new Set(["jesus", "christ", "jesus-christ", "hell"]);

// Compile each filter entry into a single regex covering all its match variants
const rules = raw.filter((entry) => !ALLOWED_IDS.has(entry.id)).map((entry) => {
  const alts = entry.match
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `(?:^|\\W)${escapeRegex(s)}`)
    .join("|");
  return {
    id: entry.id,
    severity: entry.severity,
    re: new RegExp(alts, "i"),
  };
});

// URL/link pattern — catches http(s)://, www., and bare domains with common TLDs
const LINK_RE =
  /(https?:\/\/|www\.)[^\s]+|[^\s]+\.(com|net|org|io|co|edu|gov|me|app|dev)(\/[^\s]*)?/i;

/**
 * Check text for profanity.
 * Returns { severity, id } of the worst match, or null if clean.
 */
export function checkProfanity(text) {
  let worst = null;
  for (const rule of rules) {
    if (rule.re.test(text)) {
      if (!worst || rule.severity > worst.severity) {
        worst = { severity: rule.severity, id: rule.id };
      }
    }
  }
  return worst;
}

/**
 * Returns true if text contains a URL or link.
 */
export function containsLink(text) {
  return LINK_RE.test(text);
}
