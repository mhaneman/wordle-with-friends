import { type RefObject, useLayoutEffect, useState } from "react";

const MIN_GAME_SCALE = 0.5;

/** Use visual viewport only when it is clearly shrunk (e.g. mobile keyboard open). */
function availableHeight(el: HTMLElement): number {
  const h = el.clientHeight;
  const vv = window.visualViewport;
  if (!vv || h <= 0) return h;
  const keyboardLikelyOpen = vv.height < window.innerHeight * 0.92;
  if (!keyboardLikelyOpen) return h;
  const viewportBottom = vv.offsetTop + vv.height;
  const rect = el.getBoundingClientRect();
  return Math.min(h, Math.max(0, viewportBottom - rect.top));
}

/**
 * Scales the game block to fit in the area above the keyboard.
 */
export function usePlayAreaFit(
  gameAreaRef: RefObject<HTMLDivElement | null>,
  gameRef: RefObject<HTMLDivElement | null>,
  deps: unknown[] = [],
) {
  const [gameScale, setGameScale] = useState(1);

  useLayoutEffect(() => {
    const area = gameAreaRef.current;
    const game = gameRef.current;
    if (!area || !game) return;

    const update = () => {
      const available = availableHeight(area);
      const needed = game.offsetHeight;
      if (needed <= 0 || available <= 0) {
        setGameScale(1);
        return;
      }
      setGameScale(
        needed > available + 1
          ? Math.min(1, Math.max(MIN_GAME_SCALE, available / needed))
          : 1,
      );
    };

    update();
    const raf = requestAnimationFrame(update);

    const ro = new ResizeObserver(update);
    ro.observe(area);
    ro.observe(game);

    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller controls remeasure
  }, deps);

  return gameScale;
}
