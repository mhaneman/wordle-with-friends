import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

interface RegisterResponse {
  status: string;
  message: string;
}

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api<RegisterResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      setSuccess(
        res.message ??
          "Registration submitted. You'll be able to log in after approval.",
      );
      setEmail("");
      setPassword("");
      setDisplayName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-2 tracking-wide">
        Request access
      </h1>
      <p className="text-neutral-400 text-sm text-center mb-6">
        Wordle With Friends is invite-only. Submit your details; an admin will
        approve you before you can log in.
      </p>

      {success ? (
        <div className="rounded border border-correct/40 bg-correct/10 px-4 py-3 text-sm text-center">
          <p className="text-white font-medium mb-1">Request submitted</p>
          <p className="text-neutral-300">{success}</p>
          <Link
            to="/login"
            className="inline-block mt-4 text-correct hover:underline"
          >
            Back to log in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
            required
          />
          <input
            type="password"
            placeholder="Password (8+ characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-correct hover:opacity-90 text-white font-bold py-2 rounded"
          >
            {loading ? "Submitting…" : "Request access"}
          </button>
        </form>
      )}

      {!success && (
        <p className="text-neutral-400 text-sm text-center mt-6">
          Already approved?{" "}
          <Link to="/login" className="text-white underline">
            Log in
          </Link>
        </p>
      )}
    </div>
  );
}
