"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SceneName } from "@/components/city/SfScene";
import type { SfWeather } from "@/lib/ops/weather";

/**
 * THE CITY BAR — one instrument on every page of the site.
 *
 * Rendered in the archive's own void/bone tokens (not indigo) so the two
 * faces read as siblings, not a transplant. Exactly one instrument row:
 * the name, the numbered nav, the live SF clock + the real weather + a
 * scene-tinted dot. Nothing else — the live/recorded chip lives at the
 * fleet board's foot, and the clock alone decides the scene. The bar is
 * presentational — the parent owns the clock + scene so there's only
 * ever one ticker per page.
 */

const NAV = [
  { n: "01", label: "PROJECTS", href: "/projects" },
  { n: "02", label: "ABOUT", href: "/about" },
  { n: "03", label: "LIBRARY", href: "/library", aliases: ["/method"] },
] as const;

export default function CityBar({
  clock,
  scene,
  weather,
}: {
  clock: string;
  scene: SceneName;
  weather: SfWeather | null;
}) {
  const pathname = usePathname();
  return (
    <header className="v2-bar city-bar" data-scene={scene}>
      <Link href="/" className="v2-brand" aria-label="George Andrade-Muñoz — the city">
        GEORGE ANDRADE-MUÑOZ
      </Link>
      <nav className="city-nav" aria-label="Sections">
        {NAV.map((item) => {
          const active =
            pathname.startsWith(item.href) ||
            ("aliases" in item && item.aliases.some((href) => pathname.startsWith(href)));
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} data-active={active}>
              <span className="city-nav-n">{item.n}</span>
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          className="city-nav-search"
          onClick={() => window.dispatchEvent(new Event("me2:search"))}
          aria-label="Search the archive and library (⌘K)"
        >
          <span className="city-nav-n">⌘K</span>
          SEARCH
        </button>
      </nav>
      <span className="v2-clock">
        SAN FRANCISCO <b suppressHydrationWarning>{clock}</b>
        {weather && <span className="v2-weather"> · {weather.label}</span>}
        <i className="city-scene-dot" data-scene={scene} aria-hidden title={`San Francisco — ${scene}`} />
      </span>
    </header>
  );
}
