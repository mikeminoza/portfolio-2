import type { Transition, Variants } from "motion/react";

/** Shared easing. A slight overshoot-free ease-out reads as "expensive". */
export const ease = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = { duration: 0.7, ease };

/** Parent that staggers its children in. */
export const stagger = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

/** Fade + rise. Only transform/opacity, so it stays on the compositor. */
export const riseIn: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition },
};

/** Per-word/char reveal used by <SplitText />. */
export const charIn: Variants = {
  hidden: { opacity: 0, y: "0.6em" },
  visible: {
    opacity: 1,
    y: "0em",
    transition: { duration: 0.8, ease },
  },
};
