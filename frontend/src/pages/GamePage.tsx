import { useCallback, useEffect, useState } from "react";
import { useDelayedLoading } from "../hooks/useDelayedLoading";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { GameToday, GuessResponse, GuessRow, LetterState } from "../api/types";
import { BerserkDialog } from "../components/BerserkDialog";
import { Grid } from "../components/Grid";
import { GuessesFooter } from "../components/GuessesFooter";
import { Keyboard } from "../components/Keyboard";

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
  const [berserkDialogOpen, setBerserkDialogOpen] = useState(false);

  const maxGuesses = game?.maxGuesses ?? 6;
  const berserk = game?.berserk ?? false;

  const applyGameState = useCallback((data: GameToday) => {
    setGame(data);
    setGuesses(data.guesses ?? []);
    setStatus(data.status);
  }, []);

  const loadGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<GameToday>("/api/v1/game/today");
      applyGameState(data);
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
  const [berserkSlot, setBerserkSlot] = useState(false);

  useEffect(() => {
    if (canBerserk) {
      setBerserkSlot(true);
      return;
    }
    const t = window.setTimeout(() => setBerserkSlot(false), 300);
    return () => clearTimeout(t);
  }, [canBerserk]);

  async function confirmBerserk() {
    if (!canBerserk || berserking) return;
    setBerserking(true);
    setMessage("");
    try {
      const data = await api<GameToday>("/api/v1/game/berserk", { method: "POST" });
      applyGameState(data);
      setBerserkDialogOpen(false);
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
              const n = res.guessCount ?? 0;
              const guessLabel = n === 1 ? "guess" : "guesses";
              setMessage(
                `You won in ${n} ${guessLabel}, you won ${res.points ?? 0} points.`,
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
      if (finished || submitting) return;
      if (e.key === "Enter") void handleKey("enter");
      else if (e.key === "Backspace") void handleKey("back");
      else if (/^[a-z]$/i.test(e.key)) void handleKey(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finished, submitting, handleKey]);

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
    <BerserkDialog
      open={berserkDialogOpen}
      confirming={berserking}
      onClose={() => setBerserkDialogOpen(false)}
      onConfirm={() => void confirmBerserk()}
    />
    <div className="flex flex-col flex-1 min-h-0 w-full max-w-lg mx-auto">
      <div className="flex-1 flex flex-col items-center min-h-0 overflow-y-auto w-full pb-2">
        {berserk && !finished && (
          <p className="text-amber-400 text-xs font-semibold uppercase tracking-wide mb-2 shrink-0">
            Berserk · 4 guesses
          </p>
        )}
        {berserkSlot && (
          <div
            className={`grid shrink-0 transition-[grid-template-rows,opacity,margin-bottom] duration-300 ease-out ${
              canBerserk
                ? "grid-rows-[1fr] opacity-100 mb-3"
                : "grid-rows-[0fr] opacity-0 mb-0 pointer-events-none"
            }`}
          >
            <div className="overflow-hidden min-h-0">
              <button
                type="button"
                disabled={berserking || !canBerserk}
                onClick={() => setBerserkDialogOpen(true)}
                className="w-full px-4 py-1.5 text-sm font-bold uppercase tracking-wide rounded border border-amber-500/60 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
              >
                Berserk
              </button>
            </div>
          </div>
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
          <>
            <Link
              to="/leaderboard"
              className="mt-2 text-sm text-correct hover:underline shrink-0"
            >
              View today&apos;s leaderboard →
            </Link>
          </>
        )}
        <GuessesFooter
          used={guesses.length}
          max={maxGuesses}
          berserk={berserk}
          status={status}
          scoredPoints={game?.points}
        />
      </div>

      {!finished && (
        <div className="shrink-0 w-full mt-auto sticky bottom-0 z-10 bg-neutral-950/95 backdrop-blur-sm border-t border-neutral-800 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
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


