import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { User } from "../api/types";
import { useAuth } from "../hooks/useAuth";

export function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api<User>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, displayName }),
      });
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-6 tracking-wide">
        Create account
      </h1>
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
          {loading ? "Creating…" : "Register"}
        </button>
      </form>
      <p className="text-neutral-400 text-sm text-center mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-white underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
