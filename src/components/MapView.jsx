import { GoogleMap, MarkerF } from '@react-google-maps/api'
import { useJsApiLoader } from '@react-google-maps/api'
import { useState, useMemo, useEffect } from 'react'
import { COURSES } from '../data/courses.js'
import { fuelCostDollars } from '../utils/ranker.js'
import { getSunsetTime } from '../utils/sunset.js'
import { getWeatherAtTime } from '../utils/weather.js'
import { getCourseRating } from '../utils/placesApi.js'
import CourseCard from './CourseCard.jsx'
import './MapView.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const CART_RENTAL = 20

export default function MapView({ location, driveTimes, teetimes, sessionDate, weatherData, onCourseSelect }) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseRating, setCourseRating] = useState(null)
  const [ratingLoading, setRatingLoading] = useState(false)

  useEffect(() => {
    if (loadError) {
      console.error('Google Maps load error:', loadError)
    }
  }, [loadError])

  useEffect(() => {
    if (!selectedCourse) {
      setCourseRating(null)
      return
    }
    setRatingLoading(true)
    getCourseRating(selectedCourse.course)
      .then(rating => {
        setCourseRating(rating)
        setRatingLoading(false)
      })
      .catch(() => {
        setCourseRating(null)
        setRatingLoading(false)
      })
  }, [selectedCourse])

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
        const cartCost = course.cartRequired ? (course.cartFee ?? CART_RENTAL) : 0
        const totalCost = avgPrice + gasCost + cartCost

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
          cartCost,
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

  const mapBookingUrl = (course) => bookingUrl(course)

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
          <CourseCard item={selectedCourse} bookingUrl={mapBookingUrl} userLocation={location} />
        </div>
      )}
    </div>
  )
}
