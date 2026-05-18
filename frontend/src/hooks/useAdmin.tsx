import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";
import { api } from "../api/client";

interface AdminContextValue {
  isAdmin: boolean;
  loading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      await api<{ admin: boolean }>("/api/v1/admin/me");
      setIsAdmin(true);
    } catch {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!location.pathname.startsWith("/admin")) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    void refresh();
  }, [location.pathname, refresh]);

  const login = useCallback(
    async (password: string) => {
      await api("/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await api("/api/v1/admin/logout", { method: "POST" });
    setIsAdmin(false);
  }, []);

  return (
    <AdminContext.Provider value={{ isAdmin, loading, login, logout, refresh }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}
