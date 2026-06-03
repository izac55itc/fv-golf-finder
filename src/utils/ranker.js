import { getSunsetTime } from './sunset.js'

export function fuelCostDollars(driveMinutes) {
  const km = (driveMinutes / 60) * 50
  const roundTripKm = km * 2
  const litres = (roundTripKm / 100) * 8
  return litres * 2
}

export function rankTeetimes({ teetimes, courses, driveTimes, availableFrom, mustBeDoneBy, sessionDate }) {
  const now = new Date()
  const isToday = sessionDate === new Date().toISOString().split('T')[0]
  const sunset = getSunsetTime(new Date(sessionDate + 'T12:00:00'))
  const verdictOrder = { go: 0, tight: 1, skip: 2 }

  // Deduplicate: for same courseId + time, keep lowest greenfee and sum spots
  const deduped = new Map()
  for (const tt of teetimes) {
    // Only include tee times matching the selected session date
    if (!tt.time.startsWith(sessionDate)) continue
    const key = `${tt.courseId}|${tt.time}`
    if (!deduped.has(key)) {
      deduped.set(key, { ...tt })
    } else {
      const existing = deduped.get(key)
      if (tt.greenfee < existing.greenfee) existing.greenfee = tt.greenfee
      existing.spaces = (existing.spaces || 1) + (tt.spaces || 1)
    }
  }

  const rows = [...deduped.values()]
    .map((tt) => {
      const course = courses.find((c) => c.id === tt.courseId)
      if (!course) return null

      const teeTime = tt.time instanceof Date ? tt.time : new Date(tt.time)
      if (isNaN(teeTime)) return null

      const driveMinutes = driveTimes?.get(course.id) ?? 15
      const needToLeaveBy = new Date(teeTime.getTime() - driveMinutes * 60_000)

      // For today: skip tee times where it's too late to leave
      if (isToday && needToLeaveBy <= now) return null

      // Filter by user's available from time
      if (teeTime < availableFrom) return null

      const leaveInMinutes = Math.round((needToLeaveBy - now) / 60_000)
      const teeInMinutes   = Math.round((teeTime - now) / 60_000)
      const roundMinutes   = course.holes * course.avgHoleMinutes
      const doneBy         = new Date(teeTime.getTime() + roundMinutes * 60_000)

      const minsUntilSunset = (sunset - teeTime) / 60_000
      const holesBeforeDusk = Math.min(
        course.holes,
        Math.max(0, Math.floor(minsUntilSunset / course.avgHoleMinutes)),
      )

      let verdict
      if (doneBy > mustBeDoneBy) {
        verdict = 'skip'
      } else if (holesBeforeDusk >= course.holes) {
        verdict = 'go'
      } else {
        verdict = 'tight'
      }

      return {
        teetime: { ...tt, time: teeTime },
        course,
        driveMinutes,
        leaveInMinutes,
        teeInMinutes,
        roundMinutes,
        doneBy,
        holesBeforeDusk,
        verdict,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const vd = verdictOrder[a.verdict] - verdictOrder[b.verdict]
      if (vd !== 0) return vd
      return a.teetime.time - b.teetime.time
    })

  return rows
}
