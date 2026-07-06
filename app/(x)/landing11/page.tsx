import type { Metadata } from "next";
import { archive, refEdges } from "../data";
import Wall from "./wall";
import "./l11.css";

export const metadata: Metadata = {
  title: "Landing Nº11 — The wall",
  description:
    "Exploration: index cards, pins and red string. Every string is a real refs: line in frontmatter.",
  robots: { index: false },
};

/**
 * Nº11 — THE WALL.
 * The operator's corkboard, lit by one desk lamp. Every entry is an
 * index card; every red string is a real `refs:` line from the
 * frontmatter — the site's cross-link graph made physical. Drag the
 * cards around: the strings follow, the facts hold.
 */
export default function Landing11() {
  const { nodes, about } = archive();

  const cards = nodes.map((n) => ({
    slug: n.slug,
    no: n.no,
    title: n.title,
    tag: n.tag,
    line: n.line,
    date: (n.updated ?? n.date).slice(0, 10),
    accent: n.accent,
    href: n.href,
  }));

  return (
    <Wall cards={cards} edges={refEdges(nodes)} interests={about.interests} />
  );
}
