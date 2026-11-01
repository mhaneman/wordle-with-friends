import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAdmin } from "../hooks/useAdmin";
import { useDelayedLoading } from "../hooks/useDelayedLoading";

interface PendingRequest {
  id: string;
  username: string;
  createdAt: string;
}

interface Player {
  id: string;
  username: string;
  createdAt: string;
}

export function AdminDashboardPage() {
  const { logout } = useAdmin();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);
  const [deletingPlayerId, setDeletingPlayerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reqData, playerData] = await Promise.all([
        api<{ requests: PendingRequest[] }>("/api/v1/admin/requests"),
        api<{ players: Player[] }>("/api/v1/admin/players"),
      ]);
      setRequests(reqData.requests ?? []);
      setPlayers(playerData.players ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(id: string) {
    setActing(id);
    try {
      await api(`/api/v1/admin/requests/${id}/approve`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setActing(null);
    }
  }

  async function reject(id: string) {
    setActing(id);
    try {
      await api(`/api/v1/admin/requests/${id}/reject`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
    } finally {
      setActing(null);
    }
  }

  async function removePlayer(id: string, username: string) {
    if (
      !window.confirm(
        `Delete "${username}"? Their account and game history will be removed permanently.`,
      )
    ) {
      return;
    }
    setDeletingPlayerId(id);
    setError("");
    try {
      await api(`/api/v1/admin/players/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingPlayerId(null);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold">Admin</h1>
          <div className="flex gap-3 text-sm">
            <Link to="/" className="text-muted hover:text-ink">
              App
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-muted hover:text-ink"
            >
              Log out
            </button>
          </div>
        </div>

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        <section className="mb-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            Registration requests
          </h2>
          {showLoading ? (
            <p className="text-muted">Loading…</p>
          ) : !loading && requests.length === 0 ? (
            <p className="text-muted">No pending requests.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((req) => (
                <li
                  key={req.id}
                  className="border border-line rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold font-mono">{req.username}</p>
                    <p className="text-dim text-xs mt-1">
                      {new Date(req.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={acting === req.id}
                      onClick={() => void approve(req.id)}
                      className="px-3 py-1.5 rounded bg-correct text-canvas text-sm font-semibold disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={acting === req.id}
                      onClick={() => void reject(req.id)}
                      className="px-3 py-1.5 rounded border border-line-emphasis text-sm hover:bg-surface disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            Players
          </h2>
          {showLoading ? (
            <p className="text-muted">Loading…</p>
          ) : !loading && players.length === 0 ? (
            <p className="text-muted">No players yet.</p>
          ) : (
            <ul className="space-y-3">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="border border-line rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold font-mono">{player.username}</p>
                    <p className="text-dim text-xs mt-1">
                      Joined {new Date(player.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={deletingPlayerId === player.id}
                    onClick={() => void removePlayer(player.id, player.username)}
                    className="px-3 py-1.5 rounded border border-danger-strong/60 text-danger text-sm font-semibold hover:bg-danger-strong/10 disabled:opacity-50 shrink-0"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
