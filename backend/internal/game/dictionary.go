package game

import (
	"bufio"
	"hash/fnv"
	"os"
	"strings"
	"time"
)

type Dictionary struct {
	Answers []string
	Guesses map[string]struct{}
}

func LoadDictionary(answersPath, guessesPath string) (*Dictionary, error) {
	answers, err := readWords(answersPath)
	if err != nil {
		return nil, err
	}
	guessList, err := readWords(guessesPath)
	if err != nil {
		return nil, err
	}
	guesses := make(map[string]struct{}, len(guessList)+len(answers))
	for _, w := range guessList {
		guesses[w] = struct{}{}
	}
	for _, w := range answers {
		guesses[w] = struct{}{}
	}
	return &Dictionary{Answers: answers, Guesses: guesses}, nil
}

func readWords(path string) ([]string, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var words []string
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		w := strings.TrimSpace(strings.ToLower(sc.Text()))
		if len(w) == 5 {
			words = append(words, w)
		}
	}
	return words, sc.Err()
}

func (d *Dictionary) IsValidGuess(word string) bool {
	_, ok := d.Guesses[word]
	return ok
}

func (d *Dictionary) WordForDate(date time.Time) string {
	if len(d.Answers) == 0 {
		return "crane"
	}
	h := fnv.New32a()
	_, _ = h.Write([]byte(date.Format("2006-01-02")))
	idx := int(h.Sum32()) % len(d.Answers)
	return d.Answers[idx]
}
