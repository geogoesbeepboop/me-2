"use client";

import { useCityTime } from "@/app/(v2)/v2/shared";
import type { SceneName } from "@/components/city/SfScene";
import SfScene from "@/components/city/SfScene";
import type { SfWeather } from "@/lib/ops/weather";
import CityBar from "./CityBar";
import CityFooter from "./CityFooter";

/**
 * CONTENT CHROME — the shared shell every editorial page wears.
 * The same city bar as the landing, a slim horizon strip tying the page
 * to the live scene, the editorial canvas (film-grain, void) below, and
 * the one footer. The clock decides the scene; no override here — reading
 * pages follow the real San Francisco, they don't preview it.
 */
export default function ContentChrome({
  weather,
  initialScene,
  children,
}: {
  weather: SfWeather | null;
  initialScene: SceneName;
  children: React.ReactNode;
}) {
  const { clock, liveScene } = useCityTime(initialScene);
  return (
    <div className="city-page" data-scene={liveScene}>
      <a href="#content" className="skip-link">
        Skip to content
      </a>
      <CityBar clock={clock} scene={liveScene} weather={weather} />
      <div className="city-strip" aria-hidden>
        <SfScene scene={liveScene} condition={weather?.condition} />
      </div>
      <main id="content" className="city-main">
        <div className="film-grain" aria-hidden />
        {children}
      </main>
      <CityFooter />
    </div>
  );
}
