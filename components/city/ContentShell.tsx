import { getSfWeather } from "@/lib/ops/weather";
import { sceneFor, sfHour } from "@/lib/ops/time";
import ContentChrome from "./ContentChrome";

/**
 * CONTENT SHELL — server wrapper for editorial pages. Fetches SF's real
 * weather and the current scene once, hands them to the client chrome.
 */
export default async function ContentShell({ children }: { children: React.ReactNode }) {
  const weather = await getSfWeather();
  const initialScene = sceneFor(sfHour(new Date()));
  return (
    <ContentChrome weather={weather} initialScene={initialScene}>
      {children}
    </ContentChrome>
  );
}
