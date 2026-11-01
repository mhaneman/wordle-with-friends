import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import type { GameToday } from "../api/types";
import { PeekPrompt } from "../components/PeekPrompt";

type LeaderboardGateValue = {
  promptOpen: boolean;
  accessVersion: number;
  requestAccess: () => Promise<boolean>;
};

const LeaderboardGateContext = createContext<LeaderboardGateValue | null>(null);

export function LeaderboardGateProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [promptOpen, setPromptOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [accessVersion, setAccessVersion] = useState(0);

  const requestAccess = useCallback(async () => {
    const game = await api<GameToday>("/api/v1/game/today");
    const allowed = game.status !== "in_progress" || game.peeked === true;
    if (!allowed) {
      setError("");
      setPromptOpen(true);
    }
    return allowed;
  }, []);

  const confirmPeek = useCallback(async () => {
    setConfirming(true);
    setError("");
    try {
      await api("/api/v1/game/peek", { method: "POST" });
      setPromptOpen(false);
      setAccessVersion((version) => version + 1);
      navigate("/leaderboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not peek");
    } finally {
      setConfirming(false);
    }
  }, [navigate]);

  const cancelPeek = useCallback(() => {
    if (confirming) return;
    setPromptOpen(false);
    setError("");
    if (location.pathname === "/leaderboard") {
      navigate("/");
    }
  }, [confirming, location.pathname, navigate]);

  return (
    <LeaderboardGateContext.Provider
      value={{ promptOpen, accessVersion, requestAccess }}
    >
      {children}
      {promptOpen && (
        <PeekPrompt
          confirming={confirming}
          error={error}
          onPeek={() => void confirmPeek()}
          onCancel={cancelPeek}
        />
      )}
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
