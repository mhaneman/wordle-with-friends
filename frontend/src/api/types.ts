export type LetterState = "correct" | "present" | "absent";

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface GuessRow {
  word: string;
  states: LetterState[];
}

export interface GameToday {
  puzzleDate: string;
  maxGuesses: number;
  guesses: GuessRow[];
  status: "in_progress" | "won" | "lost";
  guessCount?: number;
  points?: number;
}

export interface GuessResponse {
  word: string;
  states: LetterState[];
  status: "in_progress" | "won" | "lost";
  guesses: GuessRow[];
  guessNum: number;
  answer?: string;
  guessCount?: number;
  points?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  guessCount: number;
  points: number;
  completedAt: string;
}

export interface LeaderboardToday {
  puzzleDate: string;
  entries: LeaderboardEntry[];
  myRank?: number;
}
