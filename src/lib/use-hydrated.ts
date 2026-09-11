import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during SSR and the first client render, true afterwards.
 *
 * Used to defer rendering anything whose value only exists in the browser
 * (resolved theme, matchMedia) until the markup has matched once.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
