import type { Metadata } from "next";
import { archive } from "../data";
import Booth from "./booth";
import "./l7.css";

export const metadata: Metadata = {
  title: "Landing Nº7 — The booth",
  description:
    "Exploration: the archive as tonight's set. Channel strips, cue buttons, one crossfader between systems and texts.",
  robots: { index: false },
};

/**
 * Nº7 — THE BOOTH.
 * Step into the booth: each system is a channel on the mixer, the
 * faders sit at the real recency of each file's last write, CUE
 * pulls a dossier up on the booth monitor, and the crossfader blends
 * the SYSTEMS deck into the TEXTS deck. Violet, because the doctrine
 * already says violet is the booth.
 */
export default function Landing7() {
  const { projects, writing } = archive();
  return <Booth projects={projects} writing={writing} />;
}
