import { useState, useMemo } from 'react'
import { fuelCostDollars } from '../utils/ranker.js'
import { COURSES } from '../data/courses.js'
import { getWeatherAtTime } from '../utils/weather.js'
import BottomSheet from './BottomSheet.jsx'

function fmtTime(date) {
  return date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getTempColorClass(weatherCode) {
  if (weatherCode >= 51 && weatherCode <= 67) return 'weather-temp-rain'
  if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 85 && weatherCode <= 86)) return 'weather-temp-snow'
  if (weatherCode === 0 || weatherCode === 1) return 'weather-temp-clear'
  return 'weather-temp'
}

const SORT_OPTIONS = [
  { key: 'cost',  label: 'Total Cost' },
  { key: 'drive', label: 'Drive Time' },
  { key: 'holes', label: 'Holes Before Dusk' },
]

export default function CalendarView({ teetimes, driveTimes, weatherData, sessionDate, onDateChange, availableDates, playerCount, timeRange, maxGreenfee, maxDriveMin, selectedCourses }) {
  const [sortBy,     setSortBy]     = useState('cost')
  const [holeFilter, setHoleFilter] = useState(null)
  const [selected,   setSelected]   = useState(null)

  const now = new Date()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const filtered = useMemo(() => {
    return teetimes.filter(tt => {
      if (!tt.time.startsWith(sessionDate)) return false
      const t = new Date(tt.time)
      const h = t.getHours()
      if (h < timeRange[0] || h > timeRange[1]) return false
      if ((tt.spaces ?? 4) < playerCount) return false
      if (tt.greenfee > maxGreenfee) return false
      return true
    })
  }, [teetimes, sessionDate, timeRange, playerCount, maxGreenfee])

  const grouped = useMemo(() => {
    const map = new Map()
    for (const tt of filtered) {
      const course = COURSES.find(c => c.id === tt.courseId)
      if (!course) continue
      if (selectedCourses !== null && !selectedCourses.has(course.id)) continue
      if (holeFilter !== null && course.holes !== holeFilter) continue
      const driveMinutes = driveTimes?.get(course.id) ?? 15
      if (driveMinutes > maxDriveMin) continue
      const teeTime = new Date(tt.time)
      const roundMinutes = course.holes * course.avgHoleMinutes
      const doneBy = new Date(teeTime.getTime() + roundMinutes * 60_000)
      const isToday = sessionDate === todayStr
      const needToLeaveBy = new Date(teeTime.getTime() - driveMinutes * 60_000)
      if (isToday && needToLeaveBy <= now) continue

      const sunset = new Date(sessionDate + 'T21:05:00')
      const minsUntilSunset = (sunset - teeTime) / 60_000
      const holesBeforeDusk = Math.min(course.holes, Math.max(0, Math.floor(minsUntilSunset / course.avgHoleMinutes)))
      const mustBeDoneBy = new Date(sessionDate + 'T21:05:00')
      const verdict = doneBy > mustBeDoneBy ? 'skip' : holesBeforeDusk >= course.holes ? 'go' : 'tight'

      const totalCost = tt.greenfee + fuelCostDollars(driveMinutes)

      if (!map.has(course.id)) {
        map.set(course.id, {
          course,
          driveMinutes,
          slots: [],
          minCost: Infinity,
          maxHoles: 0,
        })
      }
      const entry = map.get(course.id)
      entry.slots.push({ tt, teeTime, doneBy, holesBeforeDusk, verdict, totalCost, driveMinutes, roundMinutes })
      entry.minCost = Math.min(entry.minCost, totalCost)
      entry.maxHoles = Math.max(entry.maxHoles, holesBeforeDusk)
    }
    return [...map.values()]
  }, [filtered, driveTimes, sessionDate, holeFilter, now, maxDriveMin, selectedCourses])

  const sorted = useMemo(() => {
    return [...grouped].sort((a, b) => {
      if (sortBy === 'cost')  return a.minCost - b.minCost
      if (sortBy === 'drive') return a.driveMinutes - b.driveMinutes
      if (sortBy === 'holes') return b.maxHoles - a.maxHoles
      return 0
    })
  }, [grouped, sortBy])

  const totalSlots = sorted.reduce((sum, g) => sum + g.slots.length, 0)

  return (
    <div className="cal-wrap">
      <div className="cal-day-tabs">
        {availableDates.map(d => {
          const date = new Date(d + 'T12:00:00')
          const isToday = d === todayStr
          const label = isToday ? 'Today' : date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })
          return (
            <button
              key={d}
              className={`cal-day-tab${sessionDate === d ? ' active' : ''}`}
              onClick={() => onDateChange(d)}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="cal-filters">
        <div className="cal-filter-group">
          <span className="cal-filter-label">Sort by</span>
          <div className="cal-sort-btns">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                className={`cal-sort-btn${sortBy === opt.key ? ' active' : ''}`}
                onClick={() => setSortBy(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="cal-filter-group">
          <span className="cal-filter-label">Holes</span>
          <div className="cal-sort-btns">
            {[9, 18].map(n => (
              <button
                key={n}
                className={`cal-sort-btn${holeFilter === n ? ' active' : ''}`}
                onClick={() => setHoleFilter(holeFilter === n ? null : n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cal-results-meta">
        <span className="dot dot-go" /> {sorted.filter(g => g.slots.some(s => s.verdict === 'go')).length} courses
        <span style={{marginLeft: '1rem'}}>{totalSlots} tee times</span>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">No tee times match your filters for this day.</div>
      ) : (
        <div className="cal-groups">
          {sorted.map(({ course, driveMinutes, slots }) => (
            <div key={course.id} className="cal-course-group">
              <div className="cal-course-header">
                <span className="cal-course-name">{course.name}</span>
                <span className="cal-course-meta">{driveMinutes}m drive · from ${Math.min(...slots.map(s => s.totalCost)).toFixed(0)}</span>
              </div>
              <div className="cal-chips">
                {slots
                  .sort((a, b) => a.teeTime - b.teeTime)
                  .map(slot => {
                    const weather = weatherData ? getWeatherAtTime(weatherData, course.id, slot.teeTime) : null
                    return (
                      <button
                        key={slot.tt.id}
                        className={`cal-chip verdict-chip-${slot.verdict}${selected?.tt.id === slot.tt.id ? ' selected' : ''}`}
                        onClick={() => setSelected(selected?.tt.id === slot.tt.id ? null : { ...slot, course, driveMinutes, date: sessionDate })}
                      >
                        {fmtTime(slot.teeTime)} · ${slot.tt.greenfee}{weather && <span className="chip-weather"> · <span className="weather-icon">{weather.icon}</span><span className={getTempColorClass(weather.code)}>{weather.temp}°</span></span>}
                      </button>
                    )
                  })
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <BottomSheet
          slot={selected}
          onClose={() => setSelected(null)}
          weatherData={weatherData}
          playerCount={playerCount}
        />
      )}
    </div>
  )
}
