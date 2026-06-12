import type { Metadata } from "next";
import { archive } from "../data";
import Machine from "./machine";
import "./l10.css";

export const metadata: Metadata = {
  title: "Landing Nº10 — The machine",
  description:
    "Exploration: a 2am vending machine. It takes attention, not money — the keypad actually vends.",
  robots: { index: false },
};

/**
 * Nº10 — THE MACHINE.
 * A vending machine glowing on a dark street. The systems sit on the
 * coils as packaged goods (net weight: their real metrics), the
 * essays are zines on the bottom row, and the method is the nutrition
 * label taped to the glass. Punch a code and the machine actually
 * vends. The card reader is disabled by policy — the model never
 * holds the card.
 */
export default function Landing10() {
  const { projects, writing, method } = archive();

  const slots = [
    ...projects.map((p, i) => ({
      code: `A${i + 1}`,
      title: p.title,
      tagline: p.domain ?? "",
      net: p.metrics[0] ? `${p.metrics[0].v} ${p.metrics[0].k}` : (p.status || ""),
      href: p.href,
      accent: p.accent,
      line: p.line,
      no: p.no,
      status: p.status,
      kind: "SYSTEM",
    })),
    ...writing.map((w, i) => ({
      code: `B${i + 1}`,
      title: w.title,
      tagline: "ZINE — ESSAY",
      net: `${w.readingTime} MIN READ`,
      href: w.href,
      accent: w.accent,
      line: w.line,
      no: w.no,
      status: "IN PRINT",
      kind: "TEXT",
    })),
  ];

  return (
    <Machine
      slots={slots}
      methodFacts={{
        title: method.title,
        thesis: method.thesis,
        metrics: method.metrics,
      }}
    />
  );
}
