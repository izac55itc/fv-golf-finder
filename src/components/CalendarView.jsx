import { useState, useMemo } from 'react'
import { COURSES } from '../data/courses.js'
import { fuelCostDollars } from '../utils/ranker.js'
import { getSunsetTime } from '../utils/sunset.js'
import { getWeatherAtTime } from '../utils/weather.js'
import './CalendarView.css'

const CART_RENTAL = 20

export default function CalendarView({ teetimes, driveTimes, weatherData, sessionDate, onDateChange, availableDates, maxGreenfee, maxDriveMin, selectedCourses }) {
  const [sortBy, setSortBy] = useState('cost')

  const now = new Date()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const summaries = useMemo(() => {
    const map = new Map()
    const baseDate = new Date(sessionDate + 'T12:00:00')
    const sunset = getSunsetTime(baseDate)

    for (const item of teetimes) {
      if (item.date !== sessionDate) continue
      if (item.availableCount === 0) continue
      if (item.minPrice > maxGreenfee) continue

      const course = COURSES.find(c => c.id === item.courseId)
      if (!course) continue
      if (selectedCourses !== null && !selectedCourses.has(course.id)) continue

      const driveMinutes = driveTimes?.get(course.id) ?? 15
      if (driveMinutes > maxDriveMin) continue

      const weatherMorning = getWeatherAtTime(weatherData, course.id, sessionDate + 'T08:00:00')
      const weatherAfternoon = getWeatherAtTime(weatherData, course.id, sessionDate + 'T14:00:00')
      const weatherTwilight = getWeatherAtTime(weatherData, course.id, sessionDate + 'T17:00:00')

      const avgPrice = Math.round((item.minPrice + item.maxPrice) / 2)
      const gasCost = fuelCostDollars(driveMinutes)
      const totalCost = avgPrice + gasCost + CART_RENTAL
      const totalWithoutCart = avgPrice + gasCost

      // Calculate latest tee time to finish before dusk
      const roundDurationMs = course.holes * course.avgHoleMinutes * 60_000
      const latestStartMs = sunset.getTime() - roundDurationMs
      const latestStart = new Date(latestStartMs)

      // Determine verdict based on whether round fits
      const roundFitsBeforeDusk = latestStartMs >= new Date(sessionDate + 'T06:00:00').getTime()
      let verdict = 'skip'
      if (roundFitsBeforeDusk) {
        verdict = 'go'
      } else {
        // Check if partial round fits
        const firstLightMs = new Date(sessionDate + 'T06:00:00').getTime()
        const availableMs = sunset.getTime() - firstLightMs
        const holesAvailable = Math.floor(availableMs / (course.avgHoleMinutes * 60_000))
        if (holesAvailable > 0) {
          verdict = 'tight'
        }
      }

      map.set(item.courseId, {
        course,
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
        availableCount: item.availableCount,
        hasHotDeals: item.hasHotDeals,
        driveMinutes,
        gasCost,
        cartCost: CART_RENTAL,
        totalCost,
        totalWithoutCart,
        weatherMorning,
        weatherAfternoon,
        weatherTwilight,
        sunset,
        latestStart,
        verdict,
      })
    }

    return Array.from(map.values())
  }, [teetimes, sessionDate, maxGreenfee, maxDriveMin, selectedCourses, driveTimes, weatherData, now])

  const sorted = useMemo(() => {
    return [...summaries].sort((a, b) => {
      if (sortBy === 'cost') return a.totalCost - b.totalCost
      if (sortBy === 'deals') return b.hasHotDeals - a.hasHotDeals
      return a.course.name.localeCompare(b.course.name)
    })
  }, [summaries, sortBy])

  const baseDate = new Date(sessionDate + 'T12:00:00')
  const sunset = getSunsetTime(baseDate)
  const sunsetStr = sunset.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })

  const bookingUrl = (courseId) => {
    const date = sessionDate.replace(/-/g, '')
    return `https://www.golfnow.com/tee-times/results?course=${courseId}&date=${date}`
  }

  const verdictColor = (verdict) => {
    if (verdict === 'go') return 'go'
    if (verdict === 'tight') return 'tight'
    return 'skip'
  }

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

      <div className="cal-meta">
        <span>Sunset {sunsetStr} PDT</span>
        <span>Total courses: {summaries.length}</span>
      </div>

      <div className="cal-filters">
        <div className="cal-filter-group">
          <span className="cal-filter-label">Sort by</span>
          <div className="cal-sort-btns">
            {[
              { key: 'cost', label: 'Best Price' },
              { key: 'name', label: 'Course Name' },
            ].map(opt => (
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
      </div>

      <div className="cal-results">
        {sorted.length === 0 ? (
          <p className="cal-no-results">No courses available for this date.</p>
        ) : (
          sorted.map(item => (
              <div key={item.course.id} className={`cal-course-card verdict-${verdictColor(item.verdict)}`}>
                <div className="cal-verdict-badge">{item.verdict.toUpperCase()}</div>

                <div className="cal-card-header">
                  <div className="cal-course-info">
                    <h3 className="cal-course-name">{item.course.name}</h3>
                    <div className="cal-course-details">
                      {item.course.location} • {item.course.holes}H • {item.driveMinutes}m drive
                    </div>
                  </div>
                  {item.hasHotDeals && <span className="cal-badge-deals">🔥 Hot Deal</span>}
                </div>

                <div className="cal-card-pricing">
                  <div className="cal-price-section">
                    <div className="cal-price-label">Green Fee</div>
                    <div className="cal-price-value">
                      ${item.minPrice.toFixed(2)}–${item.maxPrice.toFixed(2)}
                    </div>
                  </div>

                  <div className="cal-price-section">
                    <div className="cal-price-label">Gas</div>
                    <div className="cal-price-value">${item.gasCost.toFixed(2)}</div>
                  </div>

                  <div className="cal-price-section">
                    <div className="cal-price-label">Cart</div>
                    <div className="cal-price-value">${item.cartCost.toFixed(2)}</div>
                  </div>

                  <div className="cal-price-section total">
                    <div className="cal-price-label">Total</div>
                    <div className="cal-price-value">${item.totalCost.toFixed(2)}</div>
                  </div>
                </div>

                <div className="cal-card-meta">
                  <div className="cal-holes-info">
                    Sunset {item.sunset.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })} • Start by {item.latestStart.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })} PDT
                  </div>
                  <div className="cal-weather-group">
                    {item.weatherMorning && (
                      <div className="cal-weather-period">
                        <span className="cal-weather-time">8am</span>
                        <span>{item.weatherMorning.icon} {item.weatherMorning.temp}°C</span>
                      </div>
                    )}
                    {item.weatherAfternoon && (
                      <div className="cal-weather-period">
                        <span className="cal-weather-time">2pm</span>
                        <span>{item.weatherAfternoon.icon} {item.weatherAfternoon.temp}°C</span>
                      </div>
                    )}
                    {item.weatherTwilight && (
                      <div className="cal-weather-period">
                        <span className="cal-weather-time">5pm</span>
                        <span>{item.weatherTwilight.icon} {item.weatherTwilight.temp}°C</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="cal-card-footer">
                  <div className="cal-availability">{item.availableCount} slots</div>
                  <a
                    href={bookingUrl(item.course.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cal-book-btn"
                  >
                    Book on GolfNow →
                  </a>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
