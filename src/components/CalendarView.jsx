import { useState, useMemo, useEffect, useRef } from 'react'
import { COURSES } from '../data/courses.js'
import { fuelCostDollars } from '../utils/ranker.js'
import { getSunsetTime } from '../utils/sunset.js'
import { getWeatherAtTime } from '../utils/weather.js'
import CourseCard from './CourseCard.jsx'
import './CalendarView.css'

const CART_RENTAL = 20

export default function CalendarView({ teetimes, driveTimes, weatherData, sessionDate, onDateChange, availableDates, sortBy, onSortBy, hidden, location }) {
  const [excludedCourses, setExcludedCourses] = useState(new Set())
  const [holesFilter, setHolesFilter] = useState(null) // null = all, 9, or 18
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setCourseDropdownOpen(false)
      }
    }
    if (courseDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [courseDropdownOpen])

  const now = new Date()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const summaries = useMemo(() => {
    const map = new Map()
    const baseDate = new Date(sessionDate + 'T12:00:00')
    const sunset = getSunsetTime(baseDate)

    // Build map of available tee times by course
    const teeTimesByDate = new Map()
    for (const item of teetimes) {
      if (item.date !== sessionDate) continue
      teeTimesByDate.set(item.courseId, item)
    }

    // Show all courses, even if no data
    for (const course of COURSES) {
      const item = teeTimesByDate.get(course.id)
      if (!item) {
        // No data for this course on this date - show as unavailable
        map.set(course.id, {
          course,
          minPrice: 0,
          maxPrice: 0,
          availableCount: 0,
          hasHotDeals: false,
          driveMinutes: driveTimes?.get(course.id) ?? 15,
          gasCost: fuelCostDollars(driveTimes?.get(course.id) ?? 15),
          cartCost: course.cartFee !== null ? course.cartFee : (course.cartRequired ? CART_RENTAL : 0),
          totalCost: 0,
          totalWithoutCart: 0,
          weatherMorning: null,
          weatherAfternoon: null,
          weatherTwilight: null,
          sunset: getSunsetTime(baseDate),
          latestStart: null,
        })
        continue
      }

      const driveMinutes = driveTimes?.get(course.id) ?? 15

      const weatherMorning = getWeatherAtTime(weatherData, course.id, sessionDate + 'T08:00:00')
      const weatherAfternoon = getWeatherAtTime(weatherData, course.id, sessionDate + 'T14:00:00')
      const weatherTwilight = getWeatherAtTime(weatherData, course.id, sessionDate + 'T17:00:00')

      const avgPrice = Math.round((item.minPrice + item.maxPrice) / 2)
      const gasCost = fuelCostDollars(driveMinutes)
      const cartCost = course.cartFee !== null ? course.cartFee : (course.cartRequired ? CART_RENTAL : 0)
      const totalCostWithCart = avgPrice + gasCost + cartCost
      const totalCost = course.cartRequired ? totalCostWithCart : avgPrice + gasCost
      const totalWithoutCart = avgPrice + gasCost

      // Min/max total for sorting (includes cart if required)
      const minTotal = item.minPrice + gasCost + (course.cartRequired ? cartCost : 0)
      const maxTotal = item.maxPrice + gasCost + (course.cartRequired ? cartCost : 0)

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
        cartCost,
        totalCost,
        totalWithoutCart,
        minTotal,
        maxTotal,
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
    // Primary sort: available courses first, unavailable at bottom
    // Secondary sort: by selected sort criteria
    if (sortBy === 'totalCost') {
      arr.sort((a, b) => {
        if (a.availableCount === 0 && b.availableCount > 0) return 1
        if (a.availableCount > 0 && b.availableCount === 0) return -1
        return a.minTotal - b.minTotal
      })
    } else if (sortBy === 'greenFee') {
      arr.sort((a, b) => {
        if (a.availableCount === 0 && b.availableCount > 0) return 1
        if (a.availableCount > 0 && b.availableCount === 0) return -1
        return a.minPrice - b.minPrice
      })
    } else if (sortBy === 'driveTime') {
      arr.sort((a, b) => {
        if (a.availableCount === 0 && b.availableCount > 0) return 1
        if (a.availableCount > 0 && b.availableCount === 0) return -1
        return a.driveMinutes - b.driveMinutes
      })
    } else if (sortBy === 'deals') {
      arr.sort((a, b) => {
        if (a.availableCount === 0 && b.availableCount > 0) return 1
        if (a.availableCount > 0 && b.availableCount === 0) return -1
        return (b.hasHotDeals ? 1 : 0) - (a.hasHotDeals ? 1 : 0)
      })
    } else {
      arr.sort((a, b) => {
        if (a.availableCount === 0 && b.availableCount > 0) return 1
        if (a.availableCount > 0 && b.availableCount === 0) return -1
        return a.course.name.localeCompare(b.course.name)
      })
    }
    return arr
  }, [summaries, sortBy])

  const filtered = useMemo(() => {
    return sorted.filter(item => {
      if (excludedCourses.has(item.course.id)) return false
      if (holesFilter && item.course.holes !== holesFilter) return false
      return true
    })
  }, [sorted, excludedCourses, holesFilter])

  const baseDate = new Date(sessionDate + 'T12:00:00')
  const sunset = getSunsetTime(baseDate)

  const bookingUrl = (course) => {
    // Chronogolf courses (with date parameter support)
    if (course.bookingUrl && course.bookingUrl.includes('chronogolf')) {
      return `${course.bookingUrl}?date=${sessionDate}`
    }
    // Club Prophet courses (with direct bookingUrl)
    if (course.bookingUrl) {
      // Try adding date parameter to Club Prophet URL
      const d = new Date(sessionDate + 'T12:00:00')
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      const year = d.getFullYear()
      return `${course.bookingUrl}?date=${month}/${day}/${year}`
    }
    if (!course.golfnowSlug) return '#'
    const d = new Date(sessionDate + 'T12:00:00')
    const monthName = d.toLocaleString('en-US', { month: 'short' })
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    const dateStr = `${monthName}+${day}+${year}`
    return `https://www.golfnow.com/tee-times/facility/${course.golfnowSlug}/search#date=${dateStr}`
  }

  if (hidden) return null

  const handleCourseToggle = (courseId) => {
    const newExcluded = new Set(excludedCourses)
    if (newExcluded.has(courseId)) {
      newExcluded.delete(courseId)
    } else {
      newExcluded.add(courseId)
    }
    setExcludedCourses(newExcluded)
  }

  const handleFilterHoles = (holes) => {
    if (holesFilter === holes) {
      setHolesFilter(null) // Toggle off if already selected
    } else {
      setHolesFilter(holes)
    }
  }

  return (
    <div className="cal-wrap">
      <div className="cal-controls">
        <div className="cal-filter-group cal-course-filter" ref={dropdownRef}>
          <button
            className="cal-course-btn"
            onClick={() => setCourseDropdownOpen(!courseDropdownOpen)}
          >
            🏌️ Courses: {sorted.length - excludedCourses.size}/13
          </button>
          {courseDropdownOpen && (
            <div className="cal-course-dropdown">
              <div className="cal-course-buttons">
                <button
                  onClick={() => handleFilterHoles(9)}
                  className={`cal-quick-btn ${holesFilter === 9 ? 'cal-quick-btn-active' : ''}`}
                >
                  9 Holes
                </button>
                <button
                  onClick={() => handleFilterHoles(18)}
                  className={`cal-quick-btn ${holesFilter === 18 ? 'cal-quick-btn-active' : ''}`}
                >
                  18 Holes
                </button>
                <button
                  onClick={() => setHolesFilter(null)}
                  className={`cal-quick-btn ${holesFilter === null ? 'cal-quick-btn-active' : ''}`}
                >
                  All
                </button>
              </div>
              <div className="cal-course-list">
                {COURSES.map(course => (
                  <label key={course.id} className="cal-course-item">
                    <input
                      type="checkbox"
                      checked={!excludedCourses.has(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                    />
                    <span>{course.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="cal-filter-group">
          <select value={sortBy} onChange={(e) => onSortBy(e.target.value)} className="cal-filter-select">
            <option value="totalCost">💰 Total Cost</option>
            <option value="greenFee">🍃 Green Fee</option>
            <option value="driveTime">🚗 Drive Time</option>
            <option value="deals">🔥 Hot Deals</option>
            <option value="name">📝 Course Name</option>
          </select>
        </div>
      </div>

      <div className="cal-results">
        {filtered.length === 0 ? (
          <p className="cal-no-results">No courses available for this date.</p>
        ) : (
          filtered.map(item => (
            <CourseCard key={item.course.id} item={item} bookingUrl={bookingUrl} userLocation={location} />
          ))
        )}
      </div>
    </div>
  )
}
