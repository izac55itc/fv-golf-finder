import { getSunsetTime } from './sunset.js'

export function fuelCostDollars(driveMinutes) {
  const km = (driveMinutes / 60) * 50
  const litres = (km / 100) * 8
  return litres * 2
}

// driveTimes: Map<courseId, minutes> — precomputed by fetchAllDriveTimes()
export function rankTeetimes({ teetimes, courses, driveTimes, availableFrom, mustBeDoneBy }) {
  const now = new Date()
  const sunset = getSunsetTime(now)
  const verdictOrder = { go: 0, tight: 1, skip: 2 }

  const rows = teetimes
    .map((tt) => {
      const course = courses.find((c) => c.id === tt.courseId)
      if (!course) return null

      // tt.time may be an ISO string (from server) or a Date (from mock data)
      const teeTime = tt.time instanceof Date ? tt.time : new Date(tt.time)
      if (isNaN(teeTime)) return null

      const driveMinutes = driveTimes?.get(course.id) ?? 15
      const needToLeaveBy = new Date(teeTime.getTime() - driveMinutes * 60_000)

      // Already too late to leave, or tee time is before the user's window
      if (needToLeaveBy <= now) return null
      if (teeTime < availableFrom) return null

      // leaveInMinutes: how long until you need to walk out the door
      const leaveInMinutes = Math.round((needToLeaveBy - now) / 60_000)
      const teeInMinutes = Math.round((teeTime - now) / 60_000)

      const roundMinutes = course.holes * course.avgHoleMinutes
      const doneBy = new Date(teeTime.getTime() + roundMinutes * 60_000)

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
