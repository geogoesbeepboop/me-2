/**
 * EXPLORATION REGISTRY — every landing proposal on one list.
 * The review rail and the /landings hub both read from here, so adding
 * a variant is one line. Nº01 and Nº02 live in the (site) group and
 * keep the site chrome; Nº03+ own the whole viewport.
 */
export interface LandingDef {
  no: string;
  href: string;
  name: string;
  /** one-line concept, shown on the hub */
  line: string;
  /** which pole of the brief it serves */
  mode: "aligned" | "break";
}

export const LANDINGS: LandingDef[] = [
  {
    no: "01",
    href: "/",
    name: "The archive",
    line: "current production landing — hero, wire, one index.",
    mode: "aligned",
  },
  {
    no: "02",
    href: "/landing2",
    name: "The archive, alive",
    line: "the refs graph as the hero; the index at poster scale.",
    mode: "aligned",
  },
  {
    no: "03",
    href: "/landing3",
    name: "Operations floor",
    line: "the practice as a live ops board — radar, telemetry, statuses straight from frontmatter.",
    mode: "aligned",
  },
  {
    no: "04",
    href: "/landing4",
    name: "Akzidenz void",
    line: "a Swiss poster set in one breath: grid, rules, type. Nothing moves twice.",
    mode: "aligned",
  },
  {
    no: "05",
    href: "/landing5",
    name: "Night shift",
    line: "an instrument field that drifts while you sleep; the cursor is weather.",
    mode: "aligned",
  },
  {
    no: "06",
    href: "/landing6",
    name: "The Systems Bulletin",
    line: "the practice as a morning broadsheet — ink on paper, every figure still traces.",
    mode: "break",
  },
  {
    no: "07",
    href: "/landing7",
    name: "Raw index",
    line: "no design between you and the files: one list, two colors, underlines.",
    mode: "break",
  },
  {
    no: "08",
    href: "/landing8",
    name: "TTY",
    line: "boot the archive and type at it — ls, open, help all work.",
    mode: "break",
  },
  {
    no: "09",
    href: "/landing9",
    name: "Permanent collection",
    line: "four systems hung as works; the wall labels tell the truth.",
    mode: "break",
  },
  {
    no: "10",
    href: "/landing10",
    name: "Title sequence",
    line: "the motto as a film — letterboxed acts, a timecode for a scrollbar.",
    mode: "break",
  },
];
