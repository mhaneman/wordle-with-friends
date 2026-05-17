import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <p className="text-neutral-400 text-sm mt-12">Loading…</p>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
