package game

const MaxGuesses = 6

// PointsFromGuessCount returns leaderboard points: (MaxGuesses + 1) - guesses.
// One guess = 6 points; six guesses = 1 point.
func PointsFromGuessCount(guessCount int) int {
	return MaxGuesses + 1 - guessCount
}
