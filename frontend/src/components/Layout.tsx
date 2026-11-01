import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1 rounded text-sm font-semibold uppercase tracking-wide ${
      isActive ? "text-ink" : "text-muted hover:text-ink"
    }`;

  return (
    <div className="flex flex-1 flex-col min-h-0 basis-0 w-full h-full">
      <header className="border-b border-line px-4 py-2 flex items-center justify-between max-w-lg mx-auto w-full">
        <nav className="flex gap-2">
          {user && (
            <>
              <NavLink to="/" className={linkClass} end>
                Play
              </NavLink>
              <NavLink to="/leaderboard" className={linkClass}>
                Leaderboard
              </NavLink>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {user ? (
            <>
              <span className="text-muted hidden sm:inline">
                {user.username}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-muted hover:text-ink"
              >
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="text-muted hover:text-ink">
              Log in
            </Link>
          )}
        </div>
      </header>
      <main className="flex-1 flex flex-col min-h-0 w-full px-4 pt-0 pb-0">
        <div className="flex flex-1 flex-col min-h-0 basis-0 w-full max-w-lg mx-auto h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
