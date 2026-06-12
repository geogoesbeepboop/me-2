import type { Metadata } from "next";
import { archive } from "../data";
import Gallery from "./gallery";
import "./l9.css";

export const metadata: Metadata = {
  title: "Landing Nº9 — Permanent collection",
  description:
    "Exploration: the systems hung as works, with wall labels that tell the truth.",
  robots: { index: false },
};

/**
 * Nº9 — PERMANENT COLLECTION.
 * A gallery wing in warm charcoal. Each system hangs as a framed
 * study — drawn from its real shape, labeled as a study — with a
 * museum placard carrying the real medium, year and status. Writing
 * is the reading room; the method is a conservation note. Walk slowly.
 */
export default function Landing9() {
  const { projects, writing, method } = archive();
  return (
    <Gallery
      projects={[...projects].sort((a, b) => Number(a.no) - Number(b.no))}
      writing={writing}
      method={{ title: method.title, thesis: method.thesis, status: method.status }}
    />
  );
}
