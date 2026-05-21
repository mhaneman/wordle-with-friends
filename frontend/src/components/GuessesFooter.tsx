import { AnimatedStat } from "./AnimatedStat";
import { pointsIfWonOnGuess } from "../utils/points";

type GuessesFooterProps = {
  used: number;
  max: number;
  berserk: boolean;
  status: "in_progress" | "won" | "lost";
  scoredPoints?: number;
};

export function GuessesFooter({
  used,
  max,
  berserk,
  status,
  scoredPoints,
}: GuessesFooterProps) {
  const preview =
    status === "in_progress" && used < max
      ? pointsIfWonOnGuess(used + 1, berserk)
      : null;

  const pointsValue =
    status === "won" && scoredPoints != null
      ? scoredPoints
      : status === "lost"
        ? 0
        : (preview ?? 0);

  let pointsSuffix = " pts";
  if (status === "won") {
    pointsSuffix = " pts scored";
  } else if (status === "in_progress" && used < max) {
    pointsSuffix = " pts on a win";
  }

  return (
    <p className="mt-3 text-center text-sm text-neutral-400 shrink-0 pb-1">
      <AnimatedStat value={used} direction="up" />
      /{max} guesses used · <AnimatedStat value={pointsValue} direction="down" />
      {pointsSuffix}
    </p>
  );
}
