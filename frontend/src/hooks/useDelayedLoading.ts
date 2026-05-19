import { useEffect, useState } from "react";

/** Default delay before showing loading UI (avoids flashes on fast requests). */
export const LOADING_DELAY_MS = 400;

/**
 * Returns true only after `isLoading` has been true for at least `delayMs`.
 * Clears immediately when loading finishes.
 */
export function useDelayedLoading(
  isLoading: boolean,
  delayMs = LOADING_DELAY_MS,
): boolean {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShow(false);
      return;
    }
    const id = window.setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(id);
  }, [isLoading, delayMs]);

  return show;
}
