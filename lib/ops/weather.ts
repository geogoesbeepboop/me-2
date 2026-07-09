/**
 * SF WEATHER — the city's real conditions, right now.
 *
 * The scene already keeps San Francisco's real time; this gives it San
 * Francisco's real *weather* too. Open-Meteo (no key) reports current
 * cloud cover, visibility, wind and the WMO weather code for the city;
 * we map that to a condition the scene can wear — clear, cloudy, the
 * marine-layer fog SF is famous for, or rain. Cached for 15 minutes;
 * every failure degrades to `null` and the scene falls back to clear.
 * It is real data and labeled as such (the bar shows the live reading).
 */

export type SfCondition = "clear" | "cloudy" | "fog" | "rain";

export interface SfWeather {
  condition: SfCondition;
  cloudCover: number; // %
  visibilityM: number;
  windKmh: number;
  tempF: number;
  code: number; // WMO
  /** a short, real, human label: "fog · 13°", "overcast · 12° · windy" */
  label: string;
}

const URL =
  "https://api.open-meteo.com/v1/forecast?latitude=37.7749&longitude=-122.4194" +
  "&current=temperature_2m,weather_code,cloud_cover,wind_speed_10m,visibility" +
  "&temperature_unit=fahrenheit&wind_speed_unit=kmh&timezone=America/Los_Angeles";

function condition(code: number, cloud: number, visibility: number): SfCondition {
  // precipitation: drizzle 51-57, rain 61-67, showers 80-82, thunder 95-99
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) return "rain";
  // fog: the WMO fog codes, or a low-visibility marine layer
  if (code === 45 || code === 48 || visibility < 4000) return "fog";
  // overcast: WMO overcast, or a sky more than half full of cloud
  if (code === 3 || cloud >= 60) return "cloudy";
  return "clear";
}

const WORD: Record<SfCondition, string> = {
  clear: "clear",
  cloudy: "overcast",
  fog: "fog",
  rain: "rain",
};

export async function getSfWeather(): Promise<SfWeather | null> {
  try {
    const res = await fetch(URL, { next: { revalidate: 900 } });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        cloud_cover?: number;
        wind_speed_10m?: number;
        visibility?: number;
      };
    };
    const c = j.current;
    if (!c || typeof c.weather_code !== "number") return null;
    const cond = condition(c.weather_code, c.cloud_cover ?? 0, c.visibility ?? 99999);
    const tempF = Math.round(c.temperature_2m ?? 0);
    const windKmh = Math.round(c.wind_speed_10m ?? 0);
    const label = `${WORD[cond]} · ${tempF}°${windKmh >= 32 ? " · windy" : ""}`;
    return {
      condition: cond,
      cloudCover: Math.round(c.cloud_cover ?? 0),
      visibilityM: Math.round(c.visibility ?? 99999),
      windKmh,
      tempF,
      code: c.weather_code,
      label,
    };
  } catch {
    return null;
  }
}
