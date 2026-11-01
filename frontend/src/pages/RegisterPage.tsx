import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { CopyableSecret } from "../components/CopyableSecret";

interface RegisterResponse {
  status: string;
  message: string;
  username: string;
  password: string;
}

interface RegistrationComplete {
  username: string;
  password: string;
  message: string;
}

export function RegisterPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState<RegistrationComplete | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api<RegisterResponse>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: username.trim().toLowerCase() }),
      });
      setComplete({
        username: res.username,
        password: res.password,
        message: res.message,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2 tracking-wide">
          Request submitted
        </h1>
        <div className="rounded border border-correct/40 bg-correct/10 px-4 py-4 text-sm space-y-4">
          <p className="text-ink-soft text-center">{complete.message}</p>
          <p className="text-muted text-center text-xs">
            Log in as{" "}
            <span className="text-ink font-mono">{complete.username}</span>{" "}
            after an admin approves you.
          </p>
          <CopyableSecret label="Your password" value={complete.password} />
          <p className="text-warning/90 text-xs text-center">
            Save this password now. You won&apos;t be able to see it again on
            this site.
          </p>
        </div>
        <Link
          to="/login"
          className="block text-center mt-6 text-correct hover:underline text-sm"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-2 tracking-wide">
        Request access
      </h1>
      <p className="text-muted text-sm text-center mb-6">
        Word War is invite-only. Pick a username; an admin will
        approve you before you can log in. We&apos;ll generate a password for
        you to save.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Username (letters, numbers, _)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          className="bg-surface border border-line-strong rounded px-3 py-2"
          required
          minLength={3}
          maxLength={32}
          pattern="[a-zA-Z0-9_]+"
          title="3–32 characters: letters, numbers, and underscores only"
        />
        {error && <p className="text-danger text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="bg-correct hover:opacity-90 text-canvas font-bold py-2 rounded"
        >
          {loading ? "Submitting…" : "Request access"}
        </button>
      </form>

      <p className="text-muted text-sm text-center mt-6">
        Already approved?{" "}
        <Link to="/login" className="text-ink underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
