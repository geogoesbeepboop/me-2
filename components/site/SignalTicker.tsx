/**
 * THE WIRE — the archive index riding a slow ticker at the hero's edge,
 * like agency copy crossing a newsroom. Every entry is real: numbers,
 * stage tags, statuses, the live pulse only where a system is actually
 * operating. Wire copy is monochrome on purpose — project accents stay
 * in the index below, where their legend is visible; the green pulse is
 * the one color, and it means what it means everywhere. Computed at
 * build, grows with the archive. Decorative duplicate of the index, so
 * hidden from assistive tech; reduced motion drops the band entirely
 * rather than freezing it (globals.css).
 */
export interface TickerItem {
  no: string;
  tag: string;
  title: string;
  status: string;
  live: boolean;
}

export default function SignalTicker({ items }: { items: TickerItem[] }) {
  return (
    <div aria-hidden className="signal-ticker overflow-hidden border-t border-line">
      <div
        className="ticker-track flex w-max"
        style={{ animationDuration: `${items.length * 9}s` }}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex">
            {items.map((item) => (
              <span
                key={item.no}
                className="flex items-center gap-3 whitespace-nowrap py-3 pr-14 font-mono text-label tracking-[0.18em] uppercase first:pl-5 md:first:pl-10"
              >
                <span className="text-dim">{item.no}</span>
                <span className="text-bone">{item.tag}</span>
                <span className="text-ash">{item.title}</span>
                <span className="flex items-center gap-2 text-dim">
                  {item.live && <span className="live-dot" />}
                  {item.status}
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
