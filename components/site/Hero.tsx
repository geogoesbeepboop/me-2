import MaskReveal from "@/components/motion/MaskReveal";
import HeroFieldLoader from "@/components/three/HeroFieldLoader";
import HeroTrace from "@/components/site/HeroTrace";

/**
 * The hero states the motto at full scale, the doctrine underneath it,
 * and then PROVES both — a method trace built from true facts plays
 * back beside the headline. The name lives in the header, permanently
 * visible; the landing moment is about how the work gets made. Copy
 * here is deliberately durable: no product names, no counts that
 * stale as the archive grows.
 */
export default function Hero() {
  return (
    <section className="relative flex min-h-svh flex-col justify-end overflow-hidden">
      <HeroFieldLoader />

      <div className="relative px-5 pt-28 pb-12 md:px-10 md:pb-14">
        <h1 className="text-hero font-black uppercase stretch-125">
          <MaskReveal lines={["Build fast,", "adapt faster."]} delay={0.45} />
        </h1>

        <div className="mt-10 grid items-end gap-8 border-t border-line pt-7 md:grid-cols-[minmax(0,1fr)_minmax(360px,480px)]">
          <div>
            <p className="max-w-md text-title font-bold leading-[1.15]">
              Probabilistic imagination.
              <br />
              Deterministic execution.
            </p>
            <p className="mt-5 max-w-md font-mono text-mono-sm text-ash">
              Products people crave, built end to end — and documented to the
              studs. Every system below is real and inspectable: the
              architecture, the decisions, the failures, the rules that hold.
            </p>
            <p className="mt-6 font-mono text-label tracking-[0.2em] text-dim uppercase">
              The archive ↓
            </p>
          </div>
          <HeroTrace />
        </div>
      </div>
    </section>
  );
}
