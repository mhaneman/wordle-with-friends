import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { UserProfile } from "../api/types";
import { useAuth } from "../hooks/useAuth";
import { useDelayedLoading } from "../hooks/useDelayedLoading";

export function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading && profile == null);

  useEffect(() => {
    setLoading(true);
    setError("");
    api<UserProfile>("/api/v1/profile/me")
      .then(setProfile)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load"),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-md">
      <h1 className="text-xl font-bold text-center mb-6">
        {profile?.username ?? user?.username ?? "Profile"}
      </h1>

      {showLoading && (
        <p className="text-neutral-400 text-center">Loading…</p>
      )}
      {error && <p className="text-red-400 text-center text-sm">{error}</p>}

      {!error && profile && (
        <section className="rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400 mb-3">
            Most points in a week
          </h2>
          {profile.bestWeek ? (
            <>
              <p className="text-3xl font-bold tabular-nums">
                {profile.bestWeek.totalPoints}{" "}
                <span className="text-lg font-semibold text-neutral-400">
                  pts
                </span>
              </p>
              <p className="text-neutral-500 text-xs mt-2">
                {profile.bestWeek.weekStart} – {profile.bestWeek.weekEnd}
              </p>
            </>
          ) : (
            <p className="text-neutral-400 text-sm">
              No completed games yet. Finish a puzzle to start tracking weekly
              totals.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
