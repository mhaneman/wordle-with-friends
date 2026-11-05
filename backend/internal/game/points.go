package game

const (
	MaxGuesses        = 6
	BerserkMaxGuesses = 4
)

func MaxGuessesForGame(berserk bool) int {
	if berserk {
		return BerserkMaxGuesses
	}
	return MaxGuesses
}

// PointsFromGuessCount returns win points before the no-peek bonus.
// Normal: 7 − guesses (1 guess = 6, 6 guesses = 1). Berserk adds 2.
func PointsFromGuessCount(guessCount int, berserk bool) int {
	points := 7 - guessCount
	if berserk {
		points += 2
	}
	return points
}

// AwardedPoints is the score stored for a finished game.
// Finishing without peeking adds one point. A peeked loss scores 0, so the
// score is never negative. Keep in sync with store.gamePointsSQL.
func AwardedPoints(won bool, guessCount int, berserk, peeked bool) int {
	points := 0
	if won {
		points = PointsFromGuessCount(guessCount, berserk)
	}
	if !peeked {
		points++
	}
	return points
}
