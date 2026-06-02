import { useEffect } from 'react'
import { fuelCostDollars } from '../utils/ranker.js'

function fmtTime(date) {
  return date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function getBookingUrl(course, teeTime) {
  const dateStr = teeTime.toISOString().split('T')[0]
  if (course.golfnowId) {
    return `https://www.golfnow.com/tee-times/facility/${course.golfnowId}/search?date=${dateStr}&holes=${course.holes}&players=1&time=all`
  }
  return `https://www.google.com/search?q=${encodeURIComponent(course.name + ' tee times ' + dateStr)}`
}

export default function BottomSheet({ slot, onClose }) {
  const { tt, teeTime, doneBy, holesBeforeDusk, verdict, driveMinutes, course } = slot
  const totalCost = tt.greenfee + fuelCostDollars(driveMinutes)
  const bookingUrl = getBookingUrl(course, teeTime)

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-header">
          <div>
            <div className="sheet-time">{fmtTime(teeTime)}</div>
            <div className="sheet-course">{course.name} · {course.holes}-hole</div>
          </div>
          <span className={`verdict-badge verdict-${verdict}`}>{verdict.toUpperCase()}</span>
        </div>
        <div className="sheet-grid">
          <div className="sheet-stat">
            <span className="sheet-stat-label">Green fee</span>
            <span className="sheet-stat-val">${tt.greenfee} <span className="sheet-stat-sub">({tt.spaces ?? '?'} spots)</span></span>
          </div>
          <div className="sheet-stat">
            <span className="sheet-stat-label">Total cost</span>
            <span className="sheet-stat-val">${totalCost.toFixed(0)} <span className="sheet-stat-sub">+fuel</span></span>
          </div>
          <div className="sheet-stat">
            <span className="sheet-stat-label">Drive time</span>
            <span className="sheet-stat-val">{driveMinutes} min</span>
          </div>
          <div className="sheet-stat">
            <span className="sheet-stat-label">Holes before dusk</span>
            <span className={`sheet-stat-val ${holesBeforeDusk >= course.holes ? 'holes-ok' : 'holes-short'}`}>
              {holesBeforeDusk}/{course.holes} <span className="sheet-stat-sub">(done by {fmtTime(doneBy)})</span>
            </span>
          </div>
        </div>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="sheet-book-btn">
          Book on GolfNow
        </a>
      </div>
    </div>
  )
}
