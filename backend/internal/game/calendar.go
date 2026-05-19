package game

import "time"

const pacificTZ = "America/Los_Angeles"

var pacificLoc *time.Location

func init() {
	loc, err := time.LoadLocation(pacificTZ)
	if err != nil {
		panic("load " + pacificTZ + ": " + err.Error())
	}
	pacificLoc = loc
}

// TodayPuzzleDate is midnight at the start of the current calendar day in Los Angeles (PT/PDT).
func TodayPuzzleDate() time.Time {
	now := time.Now().In(pacificLoc)
	return time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, pacificLoc)
}

// WeekRange returns Monday and Sunday (inclusive) for the week containing ref in Pacific time.
func WeekRange(ref time.Time) (start, end time.Time) {
	ref = ref.In(pacificLoc)
	d := time.Date(ref.Year(), ref.Month(), ref.Day(), 0, 0, 0, 0, pacificLoc)
	daysFromMonday := (int(d.Weekday()) + 6) % 7
	start = d.AddDate(0, 0, -daysFromMonday)
	end = start.AddDate(0, 0, 6)
	return start, end
}
