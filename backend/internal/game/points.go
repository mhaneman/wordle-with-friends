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
// Normal: 8 − guesses (1 guess = 7, 6 guesses = 2). Berserk adds 2.
func PointsFromGuessCount(guessCount int, berserk bool) int {
	points := 8 - guessCount
	if berserk {
		points += 2
	}
	return points
}

// AwardedPoints is the score stored for a finished game.
// Peeking at the leaderboard before finishing subtracts one point, so a loss is −1.
// Keep in sync with store.gamePointsSQL.
func AwardedPoints(won bool, guessCount int, berserk, peeked bool) int {
	points := 0
	if won {
		points = PointsFromGuessCount(guessCount, berserk)
	}
	if peeked {
		points--
	}
	return points
}
