import { GoogleMap, MarkerF } from '@react-google-maps/api'
import { useJsApiLoader } from '@react-google-maps/api'
import { useState, useMemo, useEffect } from 'react'
import { COURSES } from '../data/courses.js'
import { fuelCostDollars } from '../utils/ranker.js'
import { getSunsetTime } from '../utils/sunset.js'
import { getWeatherAtTime } from '../utils/weather.js'
import './MapView.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const CART_RENTAL = 20

export default function MapView({ location, driveTimes, teetimes, sessionDate, weatherData, onCourseSelect }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const [selectedCourse, setSelectedCourse] = useState(null)

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps load error:', loadError)
    }
  }, [loadError])

  const courseMarkers = useMemo(() => {
    const map = new Map()
    const baseDate = new Date(sessionDate + 'T12:00:00')
    const sunset = getSunsetTime(baseDate)

    for (const item of teetimes) {
      if (item.date !== sessionDate) continue
      const course = COURSES.find(c => c.id === item.courseId)
      if (course && !map.has(course.id)) {
        const driveMinutes = driveTimes?.get(course.id) ?? 15
        const gasCost = fuelCostDollars(driveMinutes)
        const avgPrice = Math.round((item.minPrice + item.maxPrice) / 2)
        const totalCost = avgPrice + gasCost + CART_RENTAL

        const weatherMorning = getWeatherAtTime(weatherData, course.id, sessionDate + 'T08:00:00')
        const weatherAfternoon = getWeatherAtTime(weatherData, course.id, sessionDate + 'T14:00:00')
        const weatherTwilight = getWeatherAtTime(weatherData, course.id, sessionDate + 'T17:00:00')

        const roundDurationMs = course.holes * course.avgHoleMinutes * 60_000
        const latestStartMs = sunset.getTime() - roundDurationMs
        const latestStart = new Date(latestStartMs)

        map.set(course.id, {
          course,
          driveMinutes,
          gasCost,
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
          avgPrice,
          totalCost,
          availableCount: item.availableCount,
          hasHotDeals: item.hasHotDeals,
          weatherMorning,
          weatherAfternoon,
          weatherTwilight,
          sunset,
          latestStart,
        })
      }
    }
    return Array.from(map.values())
  }, [teetimes, sessionDate, driveTimes, weatherData])

  const mapCenter = { lat: location.lat, lng: location.lng }

  const bookingUrl = (course) => {
    if (!course.golfnowSlug) return '#'
    const d = new Date(sessionDate + 'T12:00:00')
    const monthName = d.toLocaleString('en-US', { month: 'short' })
    const day = String(d.getDate()).padStart(2, '0')
    const year = d.getFullYear()
    const dateStr = `${monthName}+${day}+${year}`
    return `https://www.golfnow.com/tee-times/facility/${course.golfnowSlug}/search#date=${dateStr}`
  }

  if (!isLoaded) return <div className="map-loading">Loading map…</div>

  if (loadError) {
    return (
      <div className="map-error">
        <p>Map failed to load. Please try the list view instead.</p>
        <button onClick={() => onCourseSelect(null)} className="map-error-btn">
          ← Back to List
        </button>
      </div>
    )
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="map-error">
        <p>Google Maps API key not configured. Please try again in a moment.</p>
        <button onClick={() => onCourseSelect(null)} className="map-error-btn">
          ← Back to List
        </button>
      </div>
    )
  }

  return (
    <div className="map-wrapper">
      <div className="map-container">
        <GoogleMap
          mapContainerClassName="map-canvas"
          center={mapCenter}
          zoom={10}
          options={{
            streetViewControl: false,
            fullscreenControl: false,
            mapTypeControl: false,
          }}
        >
          {courseMarkers.map(item => (
            <MarkerF
              key={item.course.id}
              position={{ lat: item.course.lat, lng: item.course.lng }}
              title={item.course.name}
              onClick={() => setSelectedCourse(item)}
            />
          ))}
        </GoogleMap>
      </div>

      {selectedCourse && (
        <div className="map-details-modal">
          <button className="modal-close" onClick={() => setSelectedCourse(null)}>✕</button>
          <h3>{selectedCourse.course.name} • {selectedCourse.course.holes} Holes</h3>
          <p className="course-location">{selectedCourse.course.location}</p>

          <div className="details-grid">
            <div className="detail-item clickable" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedCourse.course.lat},${selectedCourse.course.lng}`, '_blank')}>
              <span className="label">Drive Time</span>
              <span className="value">{selectedCourse.driveMinutes}m 🗺️</span>
            </div>
            <div className="detail-item">
              <span className="label">Latest Start</span>
              <span className="value">{selectedCourse.latestStart.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
            </div>
            <div className="cost-summary">
              <span className="cost-item fee">💚 ${selectedCourse.minPrice.toFixed(0)}–${selectedCourse.maxPrice.toFixed(0)}</span>
              <span className="separator">|</span>
              <span className="cost-item gas">⛽ ${selectedCourse.gasCost.toFixed(2)}</span>
              <span className="separator">|</span>
              <span className="cost-item cart">🛒 $20</span>
              <span className="separator">|</span>
              <span className="cost-item total">💰 ${selectedCourse.totalCost.toFixed(2)}</span>
            </div>
          </div>

          <div className="details-weather">
            {selectedCourse.weatherMorning && (
              <div className="weather-box">
                <span className="weather-time">8am</span>
                <span className="weather-icon">{selectedCourse.weatherMorning.icon}</span>
                <span>{selectedCourse.weatherMorning.temp}°C</span>
              </div>
            )}
            {selectedCourse.weatherAfternoon && (
              <div className="weather-box">
                <span className="weather-time">2pm</span>
                <span className="weather-icon">{selectedCourse.weatherAfternoon.icon}</span>
                <span>{selectedCourse.weatherAfternoon.temp}°C</span>
              </div>
            )}
            {selectedCourse.weatherTwilight && (
              <div className="weather-box">
                <span className="weather-time">5pm</span>
                <span className="weather-icon">{selectedCourse.weatherTwilight.icon}</span>
                <span>{selectedCourse.weatherTwilight.temp}°C</span>
              </div>
            )}
          </div>

          <a href={bookingUrl(selectedCourse.course)} target="_blank" rel="noopener noreferrer" className="book-btn">
            Book on GolfNow →
          </a>
        </div>
      )}
    </div>
  )
}
