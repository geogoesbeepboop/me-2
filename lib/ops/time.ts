/**
 * SAN FRANCISCO TIME — the page keeps the city's hours.
 * Scene boundaries are fixed, not solar: morning 06–11, day 11–17,
 * evening 17–20, night 20–06 (America/Los_Angeles). Client-safe.
 */
import type { SceneName } from "@/components/city/SfScene";

export function sfHour(now: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hour12: false,
      timeZone: "America/Los_Angeles",
    }).format(now)
  );
}

export function sfClock(now: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "America/Los_Angeles",
  }).format(now);
}

export function sceneFor(hour: number): SceneName {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "evening";
  return "night";
}

/** "2026-06-11T15:24:00Z" → "2m ago" / "3h ago" / "jun 08 14:02" (PT) */
export function relTime(iso: string, now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const min = Math.max(0, Math.round((now - t) / 60_000));
  if (min < 1) return "now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    timeZone: "America/Los_Angeles",
  })
    .format(t)
    .toLowerCase();
}

/** "jun 11 · 19:23" in city time, for ledger stamps; the year rides along
 *  once it stops being this one */
export function sfStamp(iso: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "—";
  const fmt = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "America/Los_Angeles" }).format(t);
  const base = fmt({ month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .toLowerCase()
    .replace(",", " ·");
  const year = fmt({ year: "numeric" });
  const thisYear = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(Date.now());
  return year === thisYear ? base : `${base} · ${year}`;
}

/** date-only frontmatter ("2026-06-05") — render the written date, no
 *  invented clock time, no timezone drift */
export function dayStamp(isoDate: string): string {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return isoDate;
  const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  const month = months[Number(m[2]) - 1] ?? m[2];
  const thisYear = new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    timeZone: "America/Los_Angeles",
  }).format(Date.now());
  return m[1] === thisYear ? `${m[3]} ${month}` : `${m[3]} ${month} ${m[1]}`;
}
