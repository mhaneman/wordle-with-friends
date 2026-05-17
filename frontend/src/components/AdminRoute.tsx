import { Navigate } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();
  if (loading) {
    return <p className="text-neutral-400 text-sm mt-12">Loading…</p>;
  }
  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}
