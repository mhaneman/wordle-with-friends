import { useCallback, useEffect, useState } from "react";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { GameToday, GuessResponse, GuessRow, LetterState } from "../api/types";
import { BerserkPrompt } from "../components/BerserkPrompt";
import { Grid } from "../components/Grid";
import { GuessesFooter } from "../components/GuessesFooter";
import { Keyboard } from "../components/Keyboard";

function winMessage(guessCount: number, points: number): string {
  const label = guessCount === 1 ? "guess" : "guesses";
  const pointLabel = points === 1 ? "point" : "points";
  return `${guessCount} ${label} used, you won ${points} ${pointLabel}!`;
}

export function GamePage() {
  const [game, setGame] = useState<GameToday | null>(null);
  const [currentWord, setCurrentWord] = useState("");
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [status, setStatus] = useState<"in_progress" | "won" | "lost">("in_progress");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [keyStates, setKeyStates] = useState<Record<string, LetterState>>({});
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading);
  const [submitting, setSubmitting] = useState(false);
  const [berserking, setBerserking] = useState(false);
  const [regularStarted, setRegularStarted] = useState(false);

  const maxGuesses = game?.maxGuesses ?? 6;
  const berserk = game?.berserk ?? false;

  const applyGameState = useCallback((data: GameToday) => {
    setGame(data);
    setGuesses(data.guesses ?? []);
    setStatus(data.status);
    if (data.status === "won" && data.guessCount != null) {
      setMessage(winMessage(data.guessCount, data.points ?? 0));
    } else if (data.status === "in_progress") {
      setMessage("");
    }
  }, []);

  const loadGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<GameToday>("/api/v1/game/today");
      applyGameState(data);
      setRegularStarted((prev) =>
        data.berserk || (data.guesses?.length ?? 0) > 0 ? true : prev,
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setLoading(false);
    }
  }, [applyGameState]);

  useEffect(() => {
    void loadGame();
  }, [loadGame]);

  useEffect(() => {
    const merged: Record<string, LetterState> = {};
    const rank: Record<LetterState, number> = {
      absent: 0,
      present: 1,
      correct: 2,
    };
    for (const g of guesses) {
      g.word.split("").forEach((letter, i) => {
        const s = g.states[i];
        if (!merged[letter] || rank[s] > rank[merged[letter]]) {
          merged[letter] = s;
        }
      });
    }
    setKeyStates(merged);
  }, [guesses]);

  const finished = status !== "in_progress";
  const canBerserk = !finished && !berserk && guesses.length === 0;
  const showBerserkPrompt = canBerserk && !regularStarted;

  async function confirmBerserk() {
    if (!canBerserk || berserking) return;
    setBerserking(true);
    setMessage("");
    try {
      const data = await api<GameToday>("/api/v1/game/berserk", { method: "POST" });
      applyGameState(data);
      setRegularStarted(true);
      setMessage("Berserk mode — 4 guesses.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not go berserk");
    } finally {
      setBerserking(false);
    }
  }

  const handleKey = useCallback(
    async (key: string) => {
      if (finished || submitting) return;
      if (key === "back") {
        setCurrentWord((w) => w.slice(0, -1));
        return;
      }
      if (key === "enter") {
        if (currentWord.length !== 5) {
          setMessage("Not enough letters");
          setShake(true);
          setTimeout(() => setShake(false), 400);
          return;
        }
        setSubmitting(true);
        setMessage("");
        try {
          const res = await api<GuessResponse>("/api/v1/game/guess", {
            method: "POST",
            body: JSON.stringify({ word: currentWord }),
          });
          setRevealingRow(guesses.length);
          setTimeout(() => {
            applyGameState(res);
            setCurrentWord("");
            setRevealingRow(null);
            setSubmitting(false);
            if (res.status === "won") {
              setMessage(
                winMessage(res.guessCount ?? 0, res.points ?? 0),
              );
            } else if (res.status === "lost") {
              setMessage(res.answer ? `The word was ${res.answer}` : "Better luck tomorrow.");
            }
          }, 600);
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Invalid guess");
          setShake(true);
          setTimeout(() => setShake(false), 400);
          setSubmitting(false);
        }
        return;
      }
      if (currentWord.length < 5) {
        setCurrentWord((w) => w + key);
        setMessage("");
      }
    },
    [currentWord, finished, guesses.length, submitting, guesses, applyGameState],
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (showBerserkPrompt || finished || submitting) return;
      if (e.key === "Enter") void handleKey("enter");
      else if (e.key === "Backspace") void handleKey("back");
      else if (/^[a-z]$/i.test(e.key)) void handleKey(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showBerserkPrompt, finished, submitting, handleKey]);

  if (loading && !showLoading) {
    return null;
  }
  if (showLoading) {
    return (
      <p className="text-neutral-400 m-auto">Loading today&apos;s puzzle…</p>
    );
  }

  return (
    <>
    <div className="flex flex-col flex-1 min-h-0 basis-0 w-full h-full max-w-lg mx-auto">
      <div
        className={`flex-1 min-h-0 basis-0 flex flex-col overflow-hidden w-full px-2 md:px-0 ${
          showBerserkPrompt ? "items-center justify-center" : ""
        }`}
      >
        {showBerserkPrompt ? (
          <BerserkPrompt
            confirming={berserking}
            onYes={() => void confirmBerserk()}
            onNo={() => {
              setRegularStarted(true);
              setMessage("");
            }}
          />
        ) : (
          <div className="game-board flex flex-1 flex-col items-center w-full min-h-0 mx-auto">
            {berserk && !finished && (
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-1 shrink-0">
                Berserk · 4 guesses
              </p>
            )}
            <Grid
              guesses={guesses}
              currentWord={finished ? "" : currentWord}
              maxGuesses={maxGuesses}
              shake={shake}
              revealingRow={revealingRow}
            />
            {message && (
              <p className="mt-3 text-sm font-semibold text-center min-h-[1.25rem] shrink-0 px-2">
                {message}
              </p>
            )}
            {finished && (
              <Link
                to="/leaderboard"
                className="mt-2 text-sm text-correct hover:underline shrink-0"
              >
                View today&apos;s leaderboard →
              </Link>
            )}
            {status !== "won" && (
              <GuessesFooter
                used={guesses.length}
                max={maxGuesses}
                berserk={berserk}
                status={status}
                scoredPoints={game?.points}
              />
            )}
          </div>
        )}
      </div>

      {!finished && !showBerserkPrompt && (
        <div className="shrink-0 w-[calc(100%+2rem)] -mx-4 max-w-none md:mx-0 md:w-full border-t border-neutral-800 bg-neutral-950 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <Keyboard
            keyStates={keyStates}
            onKey={(k) => void handleKey(k)}
            inactive={submitting}
          />
        </div>
      )}
    </div>
    </>
  );
}


