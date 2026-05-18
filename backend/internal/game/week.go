package game

import "time"

// WeekRangeUTC returns Monday and Sunday (inclusive) for the week containing ref.
func WeekRangeUTC(ref time.Time) (start, end time.Time) {
	ref = ref.In(time.UTC)
	d := time.Date(ref.Year(), ref.Month(), ref.Day(), 0, 0, 0, 0, time.UTC)
	daysFromMonday := (int(d.Weekday()) + 6) % 7
	start = d.AddDate(0, 0, -daysFromMonday)
	end = start.AddDate(0, 0, 6)
	return start, end
}
