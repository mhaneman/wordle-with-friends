import { createContext, useCallback, useContext, type ReactNode } from "react";
import { api } from "../api/client";
import type { GameToday } from "../api/types";

type LeaderboardGateValue = {
  requestAccess: () => Promise<boolean>;
};

const LeaderboardGateContext = createContext<LeaderboardGateValue | null>(null);

export function LeaderboardGateProvider({ children }: { children: ReactNode }) {
  const requestAccess = useCallback(async () => {
    const game = await api<GameToday>("/api/v1/game/today");
    if (game.status === "in_progress" && game.peeked !== true) {
      await api("/api/v1/game/peek", { method: "POST" });
    }
    return true;
  }, []);

  return (
    <LeaderboardGateContext.Provider value={{ requestAccess }}>
      {children}
    </LeaderboardGateContext.Provider>
  );
}

export function useLeaderboardGate() {
  const ctx = useContext(LeaderboardGateContext);
  if (!ctx) {
    throw new Error("useLeaderboardGate must be used within LeaderboardGateProvider");
  }
  return ctx;
}
