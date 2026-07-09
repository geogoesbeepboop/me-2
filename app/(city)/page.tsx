import type { Metadata } from "next";
import { allNodes, accentOf } from "@/lib/content";
import { libraryMirrorDays } from "@/lib/library";
import { loadFleet } from "@/lib/ops/fleet";
import { getSfWeather } from "@/lib/ops/weather";
import { sceneFor, sfHour } from "@/lib/ops/time";
import CityLanding from "@/app/(v2)/v2/city-landing";
import type { WriteRow } from "@/app/(v2)/v2/shared";

export const metadata: Metadata = {
  title: {
    absolute: "George Andrade-Muñoz — the city, the fleet at work",
  },
  description:
    "George Andrade-Muñoz builds software people actually use. The homepage is a drawn San Francisco that keeps the real time over a live fleet of agents — measured states, the shift log, and what got done overnight.",
};

// the front door reads the machine at request time — never prerender it
export const dynamic = "force-dynamic";

/**
 * THE FRONT DOOR — the city is the homepage.
 * A drawn San Francisco that keeps the real city time and real weather,
 * over the live fleet board. The editorial archive (projects, writing,
 * about, method) sits one click behind it, wearing the same chrome.
 */
export default async function Home() {
  const [fleet, weather] = await Promise.all([loadFleet(24), getSfWeather()]);

  const writes: WriteRow[] = allNodes()
    .slice(0, 10)
    .map((n) => ({
      at: n.sortDate,
      dateOnly: true,
      accent: accentOf(n),
      title: n.title,
      tag:
        n.kind === "writing"
          ? "post published"
          : n.updated
            ? "entry rewritten"
            : "entry published",
      href: `/${n.path}`,
    }));

  return (
    <CityLanding
      initialFleet={fleet}
      writes={writes}
      mirrors={libraryMirrorDays()}
      weather={weather}
      initialScene={sceneFor(sfHour(new Date()))}
    />
  );
}
