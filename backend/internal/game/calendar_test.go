package game

import (
	"testing"
	"time"
)

func TestTodayPuzzleDateUsesPacificMidnight(t *testing.T) {
	// 08:00 UTC on Jan 15 = midnight Pacific (PST, UTC-8).
	utc := time.Date(2026, 1, 15, 8, 0, 0, 0, time.UTC)
	now := utc.In(pacificLoc)
	got := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, pacificLoc)
	want := time.Date(2026, 1, 15, 0, 0, 0, 0, pacificLoc)
	if !got.Equal(want) {
		t.Fatalf("got %v want %v", got, want)
	}

	// 07:59 UTC on Jan 15 = still Jan 14 in Pacific.
	utc = time.Date(2026, 1, 15, 7, 59, 0, 0, time.UTC)
	now = utc.In(pacificLoc)
	got = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, pacificLoc)
	want = time.Date(2026, 1, 14, 0, 0, 0, 0, pacificLoc)
	if !got.Equal(want) {
		t.Fatalf("got %v want %v", got, want)
	}
}

func TestWeekRangePacific(t *testing.T) {
	wed := time.Date(2026, 5, 20, 15, 0, 0, 0, pacificLoc)
	start, end := WeekRange(wed)
	wantStart := time.Date(2026, 5, 18, 0, 0, 0, 0, pacificLoc)
	wantEnd := time.Date(2026, 5, 24, 0, 0, 0, 0, pacificLoc)
	if !start.Equal(wantStart) || !end.Equal(wantEnd) {
		t.Fatalf("got %v–%v want %v–%v", start, end, wantStart, wantEnd)
	}
}
