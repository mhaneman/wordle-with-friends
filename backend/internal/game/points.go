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

// PointsFromGuessCount returns leaderboard points.
// Normal: 7 − guesses. Berserk win: 2 × (5 − guesses).
func PointsFromGuessCount(guessCount int, berserk bool) int {
	if berserk {
		return 2 * (5 - guessCount)
	}
	return MaxGuesses + 1 - guessCount
}
