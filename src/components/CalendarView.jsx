import { useMemo } from 'react'
import { getWeatherAtTime } from '../utils/weather.js'
import BottomSheet from './BottomSheet.jsx'

export default function CalendarView({ teetimes, driveTimes, weatherData, sessionDate, onDateChange, availableDates }) {
  const [selectedSlot, setSelectedSlot] = useMemo(() => [null, () => {}], [])

  const timetimesForDate = useMemo(() => {
    if (!teetimes.length || !driveTimes || !sessionDate) return []

    const dateMatch = t => new Date(t.time).toISOString().split('T')[0] === sessionDate

    return teetimes
      .filter(dateMatch)
      .map(tt => {
        const course = teetimes.find(x => x.courseId === tt.courseId)?._course
        const teeTime = new Date(tt.time)
        const driveMinutes = driveTimes.get(tt.courseId) ?? 15
        const needToLeaveBy = new Date(teeTime.getTime() - driveMinutes * 60_000)
        const now = new Date()

        if (needToLeaveBy <= now || teeTime < now) return null

        return { tt, teeTime, driveMinutes, course }
      })
      .filter(Boolean)
      .sort((a, b) => a.teeTime - b.teeTime)
  }, [teetimes, driveTimes, sessionDate])

  return (
    <div className="calendar-view">
      <div className="calendar-dates">
        {availableDates.map(d => (
          <button
            key={d}
            className={`date-btn${d === sessionDate ? ' active' : ''}`}
            onClick={() => onDateChange(d)}
          >
            {new Date(d).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' })}
          </button>
        ))}
      </div>

      <div className="calendar-slots">
        {timetimesForDate.length === 0 ? (
          <div className="empty-state">No tee times available for this date</div>
        ) : (
          timetimesForDate.map((slot, i) => {
            const weather = weatherData ? getWeatherAtTime(weatherData, slot.course.id, slot.teeTime) : null
            const time = slot.teeTime.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })

            return (
              <button
                key={i}
                className="slot-chip"
                onClick={() => setSelectedSlot(slot)}
              >
                <div className="chip-time">{time}</div>
                <div className="chip-course">{slot.course.name}</div>
                {weather && <span className="chip-weather"> · {weather.icon} {weather.temp}°</span>}
              </button>
            )
          })
        )}
      </div>

      {selectedSlot && <BottomSheet slot={selectedSlot} onClose={() => setSelectedSlot(null)} weatherData={weatherData} />}
    </div>
  )
}
