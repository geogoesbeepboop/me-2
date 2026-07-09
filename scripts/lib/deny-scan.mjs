/**
 * THE DENY-SCAN — shared by sync-library (before a doc enters the pipeline)
 * and check-library (defense in depth over what got mirrored). Patterns are
 * lifted from the harness's guard-secrets hook: hard hits are high-confidence
 * secrets and the doc must not mirror, ever; soft hits (emails, phone numbers)
 * skip the doc unless its source is listed in the manifest's scanAllow.
 * A scan skip is a doc-level skip, never a run failure.
 */

export const HARD_PATTERNS = [
  ["private key", /-----BEGIN[A-Z ]*PRIVATE KEY-----/],
  ["Anthropic API key", /sk-ant-(api|admin)[0-9]{2}-[A-Za-z0-9_-]{24,}/],
  ["OpenAI project key", /sk-proj-[A-Za-z0-9_-]{20,}/],
  ["OpenAI API key", /(^|[^A-Za-z0-9])sk-[A-Za-z0-9]{32,}/],
  ["AWS access key id", /AKIA[0-9A-Z]{16}/],
  ["Google API key", /AIza[0-9A-Za-z_-]{35}/],
  ["GitHub token", /gh[pousr]_[A-Za-z0-9]{36,}/],
  ["Slack token", /xox[baprs]-[A-Za-z0-9-]{10,}/],
  ["Telegram bot token", /[0-9]{8,10}:[A-Za-z0-9_-]{35}/],
];

const JWT = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/;

/** the owner's own addresses and obviously-fictional domains aren't PII leaks */
const EMAIL_ALLOW = [
  /georgeandrade93@gmail\.com/i,
  /@georgeandrade\.dev/i,
  /@(example|acme|evil|test)\.(com|org|net)/i,
  /\.(example|invalid|test|localhost)$/i,
  /no-?reply@/i,
];
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE = /(?<!\d)\(?\d{3}\)?[-. ]\d{3}[-. ]\d{4}(?!\d)/;

/**
 * Scan one document's full text.
 * @returns {{ hard: string[], soft: string[] }} labels of what tripped
 */
export function scanDoc(text) {
  const hard = [];
  for (const [label, re] of HARD_PATTERNS) if (re.test(text)) hard.push(label);
  if (JWT.test(text) && text.includes("service_role")) hard.push("Supabase service_role JWT");

  const soft = [];
  const emails = [...new Set(text.match(EMAIL) ?? [])].filter(
    (e) => !EMAIL_ALLOW.some((re) => re.test(e))
  );
  if (emails.length > 0) {
    soft.push(`email address (${emails[0]}${emails.length > 1 ? ` +${emails.length - 1} more` : ""})`);
  }
  if (PHONE.test(text)) soft.push("US phone number");
  return { hard, soft };
}

/**
 * Manifest glob → RegExp. Supports `**` (any depth — a leading "double-star
 * slash" also matches zero directories) and `*` (within one path segment);
 * everything else is literal. Anchored. Patterns and paths are ~-relative.
 */
export function globToRegExp(pattern) {
  let src = "";
  let i = 0;
  while (i < pattern.length) {
    if (pattern.startsWith("**/", i)) {
      src += "(?:.*/)?";
      i += 3;
    } else if (pattern.startsWith("**", i)) {
      src += ".*";
      i += 2;
    } else if (pattern[i] === "*") {
      src += "[^/]*";
      i += 1;
    } else {
      src += pattern[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      i += 1;
    }
  }
  return new RegExp(`^${src}$`);
}
