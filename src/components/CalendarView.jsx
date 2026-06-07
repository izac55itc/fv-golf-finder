import { useState, useMemo } from 'react'
import { COURSES } from '../data/courses.js'
import { fuelCostDollars } from '../utils/ranker.js'
import { getSunsetTime } from '../utils/sunset.js'
import { getWeatherAtTime } from '../utils/weather.js'
import './CalendarView.css'

const CART_RENTAL = 20

export default function CalendarView({ teetimes, driveTimes, weatherData, sessionDate, onDateChange, availableDates }) {

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

      const course = COURSES.find(c => c.id === item.courseId)
      if (!course) continue

      const driveMinutes = driveTimes?.get(course.id) ?? 15

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
      })
    }

    return Array.from(map.values())
  }, [teetimes, sessionDate, driveTimes, weatherData])


  const baseDate = new Date(sessionDate + 'T12:00:00')
  const sunset = getSunsetTime(baseDate)
  const sunsetStr = sunset.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })

  const bookingUrl = (course) => {
    if (!course.golfnowId) return '#'
    const date = sessionDate.replace(/-/g, '')
    return `https://www.golfnow.com/tee-times/results?facility=${course.golfnowId}&date=${date}`
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


      <div className="cal-results">
        {summaries.length === 0 ? (
          <p className="cal-no-results">No courses available for this date.</p>
        ) : (
          summaries.map(item => (
              <div key={item.course.id} className="cal-course-card">

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
                    href={bookingUrl(item.course)}
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
