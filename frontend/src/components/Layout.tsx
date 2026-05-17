import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 rounded text-sm font-semibold uppercase tracking-wide ${
      isActive ? "text-white" : "text-neutral-400 hover:text-white"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-800 px-4 py-3 flex items-center justify-between max-w-lg mx-auto w-full">
        <nav className="flex gap-2">
          <NavLink to="/" className={linkClass} end>
            Play
          </NavLink>
          <NavLink to="/leaderboard" className={linkClass}>
            Leaderboard
          </NavLink>
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-neutral-400 hidden sm:inline">
                {user.displayName}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-neutral-400 hover:text-white"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-neutral-400 hover:text-white">
              Log in
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col items-center px-4 py-6">
        {children}
      </main>
    </div>
  );
}
