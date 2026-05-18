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
  berserk: boolean;
  guesses: GuessRow[];
  status: "in_progress" | "won" | "lost";
  guessCount?: number;
  points?: number;
}

export interface GuessResponse extends GameToday {
  word: string;
  states: LetterState[];
  guessNum: number;
  answer?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  guessCount: number;
  points: number;
  berserk: boolean;
  completedAt: string;
}

export interface LeaderboardToday {
  puzzleDate: string;
  entries: LeaderboardEntry[];
  myRank?: number;
}
