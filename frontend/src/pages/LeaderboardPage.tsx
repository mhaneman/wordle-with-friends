import { useEffect, useState } from "react";
import { api } from "../api/client";
import type {
  LeaderboardToday,
  LeaderboardWeek,
} from "../api/types";
import { useAuth } from "../hooks/useAuth";

type Period = "today" | "week";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1 text-sm font-semibold uppercase tracking-wide rounded ${
    isActive
      ? "bg-neutral-800 text-white"
      : "text-neutral-400 hover:text-white"
  }`;

export function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [today, setToday] = useState<LeaderboardToday | null>(null);
  const [week, setWeek] = useState<LeaderboardWeek | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError("");
    const load =
      period === "today"
        ? api<LeaderboardToday>("/api/v1/leaderboard/today").then(setToday)
        : api<LeaderboardWeek>("/api/v1/leaderboard/week").then(setWeek);
    load
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, [period]);

  const myRank = period === "today" ? today?.myRank : week?.myRank;
  const subtitle =
    period === "today"
      ? today
        ? `${today.puzzleDate} · Today's points`
        : ""
      : week
        ? `${week.weekStart} – ${week.weekEnd} · Weekly total`
        : "";

  return (
    <div className="w-full max-w-md">
      <h1 className="text-xl font-bold text-center mb-4">Leaderboard</h1>

      <div className="flex justify-center gap-2 mb-4">
        <button type="button" onClick={() => setPeriod("today")} className={tabClass({ isActive: period === "today" })}>
          Today
        </button>
        <button type="button" onClick={() => setPeriod("week")} className={tabClass({ isActive: period === "week" })}>
          This week
        </button>
      </div>

      {subtitle && (
        <p className="text-neutral-500 text-xs text-center mb-6">{subtitle}</p>
      )}

      {myRank != null && (
        <p className="text-correct text-sm text-center mb-4">
          Your rank: #{myRank}
        </p>
      )}

      {loading && <p className="text-neutral-400 text-center">Loading…</p>}
      {error && <p className="text-red-400 text-center text-sm">{error}</p>}

      {!loading && !error && period === "today" && today && (
        <LeaderboardDailyTable entries={today.entries} userId={user?.id} />
      )}

      {!loading && !error && period === "week" && week && (
        <LeaderboardWeeklyTable entries={week.entries} userId={user?.id} />
      )}
    </div>
  );
}

function LeaderboardDailyTable({
  entries,
  userId,
}: {
  entries: LeaderboardToday["entries"];
  userId?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-neutral-400 text-center text-sm">
        No completed games yet today.
      </p>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-neutral-500 border-b border-neutral-800">
          <th className="py-2 text-left w-12">#</th>
          <th className="py-2 text-left">Player</th>
          <th className="py-2 text-right w-16">Pts</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr
            key={e.userId}
            className={`border-b border-neutral-900 ${
              userId === e.userId ? "bg-neutral-900/50" : ""
            }`}
          >
            <td className="py-2.5 text-neutral-400">{e.rank}</td>
            <td className="py-2.5 font-medium">
              {e.username}
              {e.berserk && (
                <span className="ml-1.5 text-amber-400 text-xs font-semibold">
                  ⚡
                </span>
              )}
            </td>
            <td className="py-2.5 text-right font-bold">{e.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeaderboardWeeklyTable({
  entries,
  userId,
}: {
  entries: LeaderboardWeek["entries"];
  userId?: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="text-neutral-400 text-center text-sm">
        No completed games this week yet.
      </p>
    );
  }
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-neutral-500 border-b border-neutral-800">
          <th className="py-2 text-left w-12">#</th>
          <th className="py-2 text-left">Player</th>
          <th className="py-2 text-right w-14">Pts</th>
          <th className="py-2 text-right w-12">Days</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr
            key={e.userId}
            className={`border-b border-neutral-900 ${
              userId === e.userId ? "bg-neutral-900/50" : ""
            }`}
          >
            <td className="py-2.5 text-neutral-400">{e.rank}</td>
            <td className="py-2.5 font-medium">{e.username}</td>
            <td className="py-2.5 text-right font-bold">{e.totalPoints}</td>
            <td className="py-2.5 text-right text-neutral-400">
              {e.gamesPlayed}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
