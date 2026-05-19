package game

import (
	"path/filepath"
	"runtime"
	"testing"
)

func dictionaryPaths(t *testing.T) (answers, guesses string) {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("runtime.Caller failed")
	}
	dataDir := filepath.Join(filepath.Dir(file), "..", "..", "data")
	return filepath.Join(dataDir, "answers.txt"), filepath.Join(dataDir, "guesses.txt")
}

func TestLoadDictionaryOfficialLists(t *testing.T) {
	answersPath, guessesPath := dictionaryPaths(t)
	dict, err := LoadDictionary(answersPath, guessesPath)
	if err != nil {
		t.Fatal(err)
	}

	const wantAnswers = 2315
	const wantGuesses = 12972

	if n := len(dict.Answers); n != wantAnswers {
		t.Errorf("answers: got %d words, want %d", n, wantAnswers)
	}
	if n := len(dict.Guesses); n != wantGuesses {
		t.Errorf("guesses: got %d words, want %d", n, wantGuesses)
	}

	for _, w := range dict.Answers {
		if len(w) != 5 {
			t.Fatalf("answer %q is not 5 letters", w)
		}
		if !dict.IsValidGuess(w) {
			t.Fatalf("answer %q is not in guess list", w)
		}
	}
}
