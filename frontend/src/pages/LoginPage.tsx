import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, oauthUrl } from "../api/client";
import type { User } from "../api/types";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const oauthError = params.get("error");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api<User>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-6 tracking-wide">
        WORDLE WITH FRIENDS
      </h1>
      {oauthError && (
        <p className="text-red-400 text-sm mb-4 text-center">
          OAuth sign-in failed. Try again or use email.
        </p>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-neutral-900 border border-neutral-700 rounded px-3 py-2"
          required
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-correct hover:opacity-90 text-white font-bold py-2 rounded"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <div className="flex gap-2 mt-4">
        <a
          href={oauthUrl("google")}
          className="flex-1 text-center border border-neutral-600 rounded py-2 text-sm hover:bg-neutral-900"
        >
          Google
        </a>
        <a
          href={oauthUrl("github")}
          className="flex-1 text-center border border-neutral-600 rounded py-2 text-sm hover:bg-neutral-900"
        >
          GitHub
        </a>
      </div>
      <p className="text-neutral-400 text-sm text-center mt-6">
        No account?{" "}
        <Link to="/register" className="text-white underline">
          Register
        </Link>
      </p>
    </div>
  );
}
