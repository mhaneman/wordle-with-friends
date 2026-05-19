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

export function AdminDashboardPage() {
  const { logout } = useAdmin();
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const showLoading = useDelayedLoading(loading);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ requests: PendingRequest[] }>(
        "/api/v1/admin/requests",
      );
      setRequests(data.requests ?? []);
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

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold">Registration requests</h1>
          <div className="flex gap-3 text-sm">
            <Link to="/" className="text-neutral-400 hover:text-white">
              App
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-neutral-400 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

        {showLoading ? (
          <p className="text-neutral-400">Loading…</p>
        ) : !loading && requests.length === 0 ? (
          <p className="text-neutral-400">No pending requests.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((req) => (
              <li
                key={req.id}
                className="border border-neutral-800 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="font-semibold font-mono">{req.username}</p>
                  <p className="text-neutral-600 text-xs mt-1">
                    {new Date(req.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={acting === req.id}
                    onClick={() => void approve(req.id)}
                    className="px-3 py-1.5 rounded bg-correct text-white text-sm font-semibold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={acting === req.id}
                    onClick={() => void reject(req.id)}
                    className="px-3 py-1.5 rounded border border-neutral-600 text-sm hover:bg-neutral-900 disabled:opacity-50"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
