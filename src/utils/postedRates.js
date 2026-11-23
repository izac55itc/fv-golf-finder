// Fallback pricing from a course's posted rate board, used when the scraper
// has no data for that course/date (e.g. the course's booking site is down).
// Uses adult "regular" rates; all posted prices include tax.

function dayOfWeek(dateStr) {
  return new Date(dateStr + 'T12:00:00').getDay() // 0 = Sun, 6 = Sat
}

// Returns { walk, ride } for an 18-hole round on the given date
export function postedRateFor(course, dateStr) {
  const r = course.postedRates
  if (!r) return null
  const dow = dayOfWeek(dateStr)
  const isWeekend = dow === 0 || dow === 6
  const tier = isWeekend ? r.weekend : r.weekday
  let walk = tier.walk18
  // Tuesday special applies to walking 18 only
  if (dow === 2 && r.tuesdayWalk18 != null) walk = r.tuesdayWalk18
  return { walk, ride: tier.ride18 }
}

// Build price_summaries-shaped rows for courses with posted rates on dates
// the scraper didn't cover.
export function postedRateRows(courses, dates, scrapedRows) {
  const have = new Set(scrapedRows.map(r => `${r.courseId}|${r.date}`))
  const rows = []
  for (const course of courses) {
    if (!course.postedRates) continue
    for (const date of dates) {
      if (have.has(`${course.id}|${date}`)) continue
      const rate = postedRateFor(course, date)
      rows.push({
        courseId: course.id,
        date,
        minPrice: rate.walk,
        maxPrice: rate.walk,
        // Cart cost = riding rate minus walking rate (half power cart per player)
        cartCost: rate.ride - rate.walk,
        availableCount: null, // unknown: tee sheet not available
        hasHotDeals: false,
        postedRates: true,
      })
    }
  }
  return rows
}
