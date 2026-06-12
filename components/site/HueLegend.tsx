/**
 * The five domain hues, one meaning each — a single source so every
 * surface that paints with them shows the identical legend. Color is
 * a map, not decoration (see the doctrine block in globals.css).
 */
export default function HueLegend() {
  return (
    <>
      <span className="text-lab">●</span> live ·{" "}
      <span className="text-gold">●</span> money ·{" "}
      <span className="text-cyan">●</span> markets ·{" "}
      <span className="text-violet">●</span> audio ·{" "}
      <span className="text-post">●</span> writing
    </>
  );
}
