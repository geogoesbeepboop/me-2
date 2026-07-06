import type { Metadata } from "next";
import { archive } from "../data";
import Tty from "./tty";
import "./l8.css";

export const metadata: Metadata = {
  title: "Landing Nº8 — TTY",
  description:
    "Exploration: boot the archive and type at it. ls, cat, open and help all work.",
  robots: { index: false },
};

/**
 * Nº8 — TTY.
 * The archive as a machine you log into. A POST sequence enumerates
 * the real systems with their real statuses, then drops to a prompt
 * that actually works: ls, cat, open, whoami, status, method, exit.
 * Any key skips the boot. The block cursor does not blink — doctrine.
 */
export default function Landing8() {
  const { nodes, projects, about, method } = archive();
  return (
    <Tty
      nodes={nodes}
      liveCount={projects.filter((p) => p.live).length}
      who={`${about.headline.toLowerCase()} ${about.work[0]?.role ?? ""}, ${about.work[0]?.org ?? ""}. san francisco.`}
      method={{ title: method.title, thesis: method.thesis, status: method.status }}
    />
  );
}
