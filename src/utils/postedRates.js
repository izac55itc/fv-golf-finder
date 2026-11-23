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
  // Twilight (from twilightStart) is charged at the 9-hole rate
  const twilightWalk = r.twilightAtNineHoleRate ? tier.walk9 : null
  return { walk, ride: tier.ride18, twilightWalk }
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
        // Range: cheapest of twilight / daytime walking rate up to daytime walking rate
        minPrice: rate.twilightWalk != null ? Math.min(rate.twilightWalk, rate.walk) : rate.walk,
        maxPrice: rate.walk,
        twilightStart: course.postedRates.twilightStart ?? null,
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

// Merge scraped rows with posted rates: on days with scraped data, widen the
// price range so the cheapest of (GolfNow, posted) is the low end and the
// highest is the top. Days with no scraped data get posted-rate rows.
export function withPostedRates(courses, dates, scrapedRows) {
  const byId = new Map(courses.map(c => [c.id, c]))
  const merged = scrapedRows.map(row => {
    const course = byId.get(row.courseId)
    if (!course?.postedRates) return row
    const rate = postedRateFor(course, row.date)
    const postedMin = rate.twilightWalk != null ? Math.min(rate.twilightWalk, rate.walk) : rate.walk
    return {
      ...row,
      minPrice: Math.min(row.minPrice, postedMin),
      maxPrice: Math.max(row.maxPrice, rate.walk),
    }
  })
  return [...merged, ...postedRateRows(courses, dates, scrapedRows)]
}
