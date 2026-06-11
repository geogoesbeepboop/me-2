"use client";

import { useEffect, useState } from "react";

/** Local time where the work happens — the archive has a pulse and a
 *  place. Minutes, not seconds: presence, not a dashboard. Renders a
 *  placeholder until mounted so server and client agree. */
export default function LocalClock({ timeZone }: { timeZone: string }) {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [timeZone]);

  return <span className="tabular-nums">{now ?? "--:--"}</span>;
}
