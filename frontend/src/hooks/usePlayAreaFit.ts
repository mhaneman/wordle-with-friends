import { type RefObject, useLayoutEffect, useState } from "react";

const MIN_GAME_SCALE = 0.5;

function availableHeight(container: HTMLElement): number {
  const rect = container.getBoundingClientRect();
  let h = rect.height;
  const vv = window.visualViewport;
  if (vv && h > 0) {
    const viewportBottom = vv.offsetTop + vv.height;
    h = Math.min(h, Math.max(0, viewportBottom - rect.top));
  }
  return h;
}

/**
 * Scales the game block to fit above a fixed-height keyboard in the play area.
 */
export function usePlayAreaFit(
  containerRef: RefObject<HTMLDivElement | null>,
  gameRef: RefObject<HTMLDivElement | null>,
  keyboardRef: RefObject<HTMLDivElement | null>,
  hasKeyboard: boolean,
  deps: unknown[] = [],
) {
  const [gameScale, setGameScale] = useState(1);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const game = gameRef.current;
    if (!container || !game) return;

    const update = () => {
      const total = availableHeight(container);
      const keyboardH = hasKeyboard
        ? (keyboardRef.current?.offsetHeight ?? 0)
        : 0;
      const gameNeeded = game.scrollHeight;
      const gameAvailable = total - keyboardH;

      if (gameNeeded <= 0 || gameAvailable <= 0) {
        setGameScale(1);
        return;
      }

      setGameScale(
        gameNeeded > gameAvailable
          ? Math.min(1, Math.max(MIN_GAME_SCALE, gameAvailable / gameNeeded))
          : 1,
      );
    };

    update();
    const raf = requestAnimationFrame(update);

    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(game);
    if (keyboardRef.current) ro.observe(keyboardRef.current);

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
  }, [hasKeyboard, ...deps]);

  return gameScale;
}
