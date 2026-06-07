import { useState, useMemo } from 'react'
import { COURSES } from '../data/courses.js'
import './CalendarView.css'

export default function CalendarView({ teetimes, sessionDate, onDateChange, availableDates, maxGreenfee, selectedCourses }) {
  const [sortBy, setSortBy] = useState('price')

  const now = new Date()
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  const summaries = useMemo(() => {
    const map = new Map()

    for (const item of teetimes) {
      if (item.date !== sessionDate) continue
      if (item.availableCount === 0) continue
      if (item.minPrice > maxGreenfee) continue

      const course = COURSES.find(c => c.id === item.courseId)
      if (!course) continue
      if (selectedCourses !== null && !selectedCourses.has(course.id)) continue

      map.set(item.courseId, {
        course,
        minPrice: item.minPrice,
        maxPrice: item.maxPrice,
        availableCount: item.availableCount,
        hasHotDeals: item.hasHotDeals,
      })
    }

    return Array.from(map.values())
  }, [teetimes, sessionDate, maxGreenfee, selectedCourses])

  const sorted = useMemo(() => {
    return [...summaries].sort((a, b) => {
      if (sortBy === 'price') return a.minPrice - b.minPrice
      if (sortBy === 'deals') return b.hasHotDeals - a.hasHotDeals
      return a.course.name.localeCompare(b.course.name)
    })
  }, [summaries, sortBy])

  const bookingUrl = (courseId) => {
    const date = sessionDate.replace(/-/g, '')
    return `https://www.golfnow.com/tee-times/results?course=${courseId}&date=${date}`
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

      <div className="cal-filters">
        <div className="cal-filter-group">
          <span className="cal-filter-label">Sort by</span>
          <div className="cal-sort-btns">
            {[
              { key: 'price', label: 'Best Price' },
              { key: 'deals', label: 'Hot Deals' },
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
            <div key={item.course.id} className="cal-course-row">
              <div className="cal-course-info">
                <div className="cal-course-name">{item.course.name}</div>
                <div className="cal-course-details">
                  {item.course.location} • {item.course.holes}H
                </div>
              </div>

              <div className="cal-course-pricing">
                <div className="cal-price">
                  {item.minPrice === item.maxPrice
                    ? `$${item.minPrice}`
                    : `$${item.minPrice}–$${item.maxPrice}`}
                </div>
                {item.hasHotDeals && <span className="cal-badge-deals">🔥 Hot Deal</span>}
              </div>

              <div className="cal-course-availability">
                <div className="cal-slots">{item.availableCount} slots</div>
              </div>

              <a
                href={bookingUrl(item.course.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="cal-book-btn"
              >
                Book on GolfNow →
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
