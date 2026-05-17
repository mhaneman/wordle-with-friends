import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { LeaderboardToday } from "../api/types";
import { useAuth } from "../hooks/useAuth";

export function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardToday | null>(null);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    api<LeaderboardToday>("/api/v1/leaderboard/today")
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      );
  }, []);

  if (error) {
    return <p className="text-red-400">{error}</p>;
  }

  if (!data) {
    return <p className="text-neutral-400">Loading leaderboard…</p>;
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-xl font-bold text-center mb-1">Leaderboard</h1>
      <p className="text-neutral-500 text-xs text-center mb-6">
        {data.puzzleDate} · Fewest guesses wins
      </p>
      {data.myRank != null && (
        <p className="text-correct text-sm text-center mb-4">
          Your rank: #{data.myRank}
        </p>
      )}
      {data.entries.length === 0 ? (
        <p className="text-neutral-400 text-center text-sm">
          No winners yet today. Be the first!
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-neutral-500 border-b border-neutral-800">
              <th className="py-2 text-left w-12">#</th>
              <th className="py-2 text-left">Player</th>
              <th className="py-2 text-right w-16">Guesses</th>
            </tr>
          </thead>
          <tbody>
            {data.entries.map((e) => (
              <tr
                key={e.userId}
                className={`border-b border-neutral-900 ${
                  user?.id === e.userId ? "bg-neutral-900/50" : ""
                }`}
              >
                <td className="py-2.5 text-neutral-400">{e.rank}</td>
                <td className="py-2.5 font-medium">{e.displayName}</td>
                <td className="py-2.5 text-right font-bold">{e.guessCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
