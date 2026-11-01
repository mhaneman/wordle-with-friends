package game

import "testing"

func TestAwardedPoints(t *testing.T) {
	tests := []struct {
		name       string
		won        bool
		guessCount int
		berserk    bool
		peeked     bool
		want       int
	}{
		{name: "one guess", won: true, guessCount: 1, want: 7},
		{name: "six guesses", won: true, guessCount: 6, want: 2},
		{name: "normal win", won: true, guessCount: 3, want: 5},
		{name: "berserk one guess", won: true, guessCount: 1, berserk: true, want: 9},
		{name: "berserk four guesses", won: true, guessCount: 4, berserk: true, want: 6},
		{name: "berserk win", won: true, guessCount: 2, berserk: true, want: 8},
		{name: "loss", want: 0},
		{name: "peeked normal win", won: true, guessCount: 3, peeked: true, want: 4},
		{name: "peeked loss", peeked: true, want: -1},
		{name: "peeked six-guess win", won: true, guessCount: 6, peeked: true, want: 1},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := AwardedPoints(tt.won, tt.guessCount, tt.berserk, tt.peeked)
			if got != tt.want {
				t.Fatalf("AwardedPoints() = %d, want %d", got, tt.want)
			}
		})
	}
}
