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
    href: "/v2",
    name: "The city",
    line: "night shift, grown up and shipped as v2 — San Francisco keeps real time over a live fleet board.",
    mode: "aligned",
  },
  {
    no: "06",
    href: "/landing6",
    name: "Terminus",
    line: "a split-flap departures board; everything currently leaving the station.",
    mode: "break",
  },
  {
    no: "07",
    href: "/landing7",
    name: "The booth",
    line: "the archive as tonight's set — channel strips, cue buttons, one crossfader.",
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
    name: "The floorplan",
    line: "the household drawn to scale — every agent has a room, the method is the corridor.",
    mode: "break",
  },
  {
    no: "10",
    href: "/landing10",
    name: "The machine",
    line: "a 2am vending machine; it takes attention, not money.",
    mode: "break",
  },
  {
    no: "11",
    href: "/landing11",
    name: "The wall",
    line: "index cards, pins, red string — every string is a real refs: line.",
    mode: "break",
  },
];
