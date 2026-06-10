"use client";

import { useEffect, useState } from "react";
import type { SectionDef } from "@/lib/content";

/** Sticky file index — tracks the section in view, ember marks the spot. */
export default function Toc({ sections }: { sections: SectionDef[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this file" className="font-mono text-label uppercase">
      <p className="mb-5 tracking-[0.2em] text-dim">On this file</p>
      <ol className="space-y-3">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              className={`flex items-baseline gap-3 tracking-[0.12em] transition-colors duration-300 ${
                active === s.id ? "text-bone" : "text-dim hover:text-ash"
              }`}
            >
              <span className={active === s.id ? "text-(--accent)" : ""}>
                {String(i).padStart(2, "0")}
              </span>
              {s.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
