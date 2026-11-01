import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";

export function AdminLoginPage() {
  const { isAdmin, loading, login } = useAdmin();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-6">Admin</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-surface border border-line-strong rounded px-3 py-2"
            required
            autoComplete="current-password"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="bg-correct hover:opacity-90 text-canvas font-bold py-2 rounded"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
