import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useDelayedLoading } from "../hooks/useDelayedLoading";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const showLoading = useDelayedLoading(loading);
  if (loading && !showLoading) {
    return null;
  }
  if (showLoading) {
    return (
      <p className="text-neutral-400 text-sm mt-12">Loading…</p>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div className="flex flex-1 flex-col min-h-0 basis-0 w-full h-full">
      {children}
    </div>
  );
}
