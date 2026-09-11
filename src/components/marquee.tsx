"use client";

import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
} from "motion/react";

/** Wrap `v` into the half-open range [min, max). */
function wrap(min: number, max: number, v: number) {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

const COPIES = 4;

/**
 * Continuously drifting strip of technologies that reacts to scrolling —
 * it speeds up with scroll velocity and flips direction when you scroll back.
 *
 * The list is repeated {@link COPIES} times and the track is wrapped at one
 * copy's width, so the seam is never visible.
 */
export function Marquee({
  items,
  secondsPerCopy = 40,
}: {
  items: string[];
  /**
   * Seconds for one full copy of the list to drift past. Higher is slower —
   * this is the knob to turn, not the raw pixel velocity.
   */
  secondsPerCopy?: number;
}) {
  const reduced = useReducedMotion();

  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  // Scroll only nudges the drift along — capped so a fast flick can't turn
  // the strip into a blur.
  const velocityFactor = useTransform(smoothVelocity, [-1500, 0, 1500], [-1.6, 0, 1.6], {
    clamp: true,
  });

  const copySpan = 100 / COPIES;
  const x = useTransform(baseX, (v) => `${wrap(-copySpan, 0, v)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduced) return;

    let moveBy = direction.current * (copySpan / secondsPerCopy) * (delta / 1000);

    const factor = velocityFactor.get();
    if (factor < 0) direction.current = -1;
    else if (factor > 0) direction.current = 1;

    moveBy += moveBy * Math.abs(factor);
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <section
      aria-hidden
      className="relative overflow-hidden border-y border-border py-5"
    >
      {/* Feathered edges so items dissolve rather than getting chopped. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

      {reduced ? (
        <div className="flex gap-10 px-6 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
          {items.map((item) => (
            <Item key={item} label={item} />
          ))}
        </div>
      ) : (
        <motion.div className="flex w-max" style={{ x }}>
          {Array.from({ length: COPIES }).map((_, copy) => (
            <div key={copy} className="flex gap-10 pr-10">
              {items.map((item) => (
                <Item key={`${copy}-${item}`} label={item} />
              ))}
            </div>
          ))}
        </motion.div>
      )}
    </section>
  );
}

function Item({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-10 font-mono text-sm uppercase tracking-[0.15em] text-muted">
      {label}
      <span className="size-1 rounded-full bg-accent" />
    </span>
  );
}
