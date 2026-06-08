import { useState, useMemo } from 'react'
import { COURSES } from '../data/courses.js'
import { fuelCostDollars } from '../utils/ranker.js'
import { getSunsetTime } from '../utils/sunset.js'
import { getWeatherAtTime } from '../utils/weather.js'
import CourseCard from './CourseCard.jsx'
import './CalendarView.css'

const CART_RENTAL = 20

export default function CalendarView({ teetimes, driveTimes, weatherData, sessionDate, onDateChange, availableDates, sortBy, onSortBy, hidden }) {

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

  const sorted = useMemo(() => {
    const arr = [...summaries]
    if (sortBy === 'totalCost') arr.sort((a, b) => a.totalCost - b.totalCost)
    else if (sortBy === 'greenFee') arr.sort((a, b) => a.minPrice - b.minPrice)
    else if (sortBy === 'driveTime') arr.sort((a, b) => a.driveMinutes - b.driveMinutes)
    else if (sortBy === 'deals') arr.sort((a, b) => (b.hasHotDeals ? 1 : 0) - (a.hasHotDeals ? 1 : 0))
    else arr.sort((a, b) => a.course.name.localeCompare(b.course.name))
    return arr
  }, [summaries, sortBy])

  const baseDate = new Date(sessionDate + 'T12:00:00')
  const sunset = getSunsetTime(baseDate)

  const bookingUrl = (course) => {
    if (!course.golfnowSlug) return '#'
    const d = new Date(sessionDate + 'T12:00:00')
    const monthName = d.toLocaleString('en-US', { month: 'short' })
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    const dateStr = `${monthName}+${day}+${year}`
    return `https://www.golfnow.com/tee-times/facility/${course.golfnowSlug}/search#date=${dateStr}`
  }

  if (hidden) return null

  return (
    <div className="cal-wrap">
      <div className="cal-meta">
        <span>Showing {sorted.length} courses</span>
      </div>

      <div className="cal-filters">
        <div className="cal-filter-group">
          <label>Sort By</label>
          <select value={sortBy} onChange={(e) => onSortBy(e.target.value)} className="cal-filter-select">
            <option value="totalCost">Total Cost</option>
            <option value="greenFee">Green Fee</option>
            <option value="driveTime">Drive Time</option>
            <option value="deals">Hot Deals</option>
            <option value="name">Course Name</option>
          </select>
        </div>
      </div>

      <div className="cal-results">
        {sorted.length === 0 ? (
          <p className="cal-no-results">No courses available for this date.</p>
        ) : (
          sorted.map(item => (
            <CourseCard key={item.course.id} item={item} bookingUrl={bookingUrl} />
          ))
        )}
      </div>
    </div>
  )
}
