import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import type { GameToday, GuessResponse, GuessRow, LetterState } from "../api/types";
import { Grid } from "../components/Grid";
import { Keyboard } from "../components/Keyboard";

const MAX_GUESSES = 6;

export function GamePage() {
  const [game, setGame] = useState<GameToday | null>(null);
  const [currentWord, setCurrentWord] = useState("");
  const [guesses, setGuesses] = useState<GuessRow[]>([]);
  const [status, setStatus] = useState<"in_progress" | "won" | "lost">("in_progress");
  const [message, setMessage] = useState("");
  const [shake, setShake] = useState(false);
  const [revealingRow, setRevealingRow] = useState<number | null>(null);
  const [keyStates, setKeyStates] = useState<Record<string, LetterState>>({});
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadGame = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api<GameToday>("/api/v1/game/today");
      setGame(data);
      setGuesses(data.guesses ?? []);
      setStatus(data.status);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to load game");
    } finally {
      setLoading(false);
    }
  }, []);

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
            setGuesses(res.guesses);
            setStatus(res.status);
            setCurrentWord("");
            setRevealingRow(null);
            if (res.answer) setAnswer(res.answer);
            if (res.status === "won") {
              setMessage(`You won in ${res.guessCount} guesses!`);
            } else if (res.status === "lost") {
              setMessage(`The word was ${res.answer}`);
            }
          }, 600);
        } catch (err) {
          setMessage(err instanceof Error ? err.message : "Invalid guess");
          setShake(true);
          setTimeout(() => setShake(false), 400);
        } finally {
          setSubmitting(false);
        }
        return;
      }
      if (currentWord.length < 5) {
        setCurrentWord((w) => w + key);
        setMessage("");
      }
    },
    [currentWord, finished, guesses.length, submitting, guesses],
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

  if (loading) {
    return <p className="text-neutral-400">Loading today&apos;s puzzle…</p>;
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg">
      <p className="text-neutral-500 text-xs mb-4 uppercase tracking-widest">
        {game?.puzzleDate} · Daily puzzle
      </p>
      <Grid
        guesses={guesses}
        currentWord={finished ? "" : currentWord}
        shake={shake}
        revealingRow={revealingRow}
      />
      {message && (
        <p className="mt-4 text-sm font-semibold text-center min-h-[1.25rem]">
          {message}
        </p>
      )}
      {finished && (
        <Link
          to="/leaderboard"
          className="mt-2 text-sm text-correct hover:underline"
        >
          View today&apos;s leaderboard →
        </Link>
      )}
      {!finished && (
        <Keyboard
          keyStates={keyStates}
          onKey={(k) => void handleKey(k)}
          disabled={submitting}
        />
      )}
      {finished && answer && (
        <p className="mt-6 text-neutral-500 text-sm">Answer: {answer}</p>
      )}
      <p className="mt-4 text-neutral-600 text-xs">
        {guesses.length}/{MAX_GUESSES} guesses used
      </p>
    </div>
  );
}
