"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SceneName } from "@/components/city/SfScene";
import type { SfWeather } from "@/lib/ops/weather";
import type { FleetSnapshot } from "@/lib/ops/types";
import { FeedChip, SceneSwitch } from "@/app/(v2)/v2/shared";

/**
 * THE CITY BAR — one instrument on every page of the site.
 *
 * Rendered in the archive's own void/bone tokens (not indigo) so the two
 * faces read as siblings, not a transplant. Always: the name, the numbered
 * nav, the live SF clock + the real weather + a scene-tinted dot. The city
 * and ops floors add the scene switch and the live/recorded chip; editorial
 * pages get the bar without them. The bar is presentational — the parent
 * owns the clock + scene so there's only ever one ticker per page.
 */

const NAV = [
  { n: "01", label: "PROJECTS", href: "/projects" },
  { n: "02", label: "WRITING", href: "/writing" },
  { n: "03", label: "METHOD", href: "/method" },
  { n: "04", label: "ABOUT", href: "/about" },
] as const;

export default function CityBar({
  clock,
  scene,
  weather,
  showScenes = false,
  override = null,
  onOverride,
  feed,
}: {
  clock: string;
  scene: SceneName;
  weather: SfWeather | null;
  showScenes?: boolean;
  override?: SceneName | null;
  onOverride?: (s: SceneName | null) => void;
  feed?: FleetSnapshot;
}) {
  const pathname = usePathname();
  return (
    <header className="v2-bar city-bar" data-scene={scene}>
      <Link href="/" className="v2-brand" aria-label="George Andrade-Muñoz — the city">
        ANDRADE-MUÑOZ
      </Link>
      <nav className="city-nav" aria-label="Sections">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} data-active={active}>
              <span className="city-nav-n">{item.n}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      {showScenes && onOverride && (
        <SceneSwitch scene={scene} override={override} onOverride={onOverride} />
      )}
      {feed && <FeedChip fleet={feed} />}
      <span className="v2-clock">
        SAN FRANCISCO <b suppressHydrationWarning>{clock}</b>
        {weather && <span className="v2-weather"> · {weather.label}</span>}
        <i className="city-scene-dot" data-scene={scene} aria-hidden title={`San Francisco — ${scene}`} />
      </span>
    </header>
  );
}
