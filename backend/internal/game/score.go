package game

// LetterState matches Wordle tile feedback.
type LetterState string

const (
	Correct LetterState = "correct"
	Present LetterState = "present"
	Absent  LetterState = "absent"
)

// ScoreGuess returns per-letter feedback for a guess against the answer.
func ScoreGuess(guess, answer string) []LetterState {
	result := make([]LetterState, 5)
	answerCounts := make(map[byte]int)
	for i := 0; i < 5; i++ {
		result[i] = Absent
		if guess[i] == answer[i] {
			result[i] = Correct
		} else {
			answerCounts[answer[i]]++
		}
	}
	for i := 0; i < 5; i++ {
		if result[i] == Correct {
			continue
		}
		c := guess[i]
		if answerCounts[c] > 0 {
			result[i] = Present
			answerCounts[c]--
		}
	}
	return result
}
