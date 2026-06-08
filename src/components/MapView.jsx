import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { useJsApiLoader } from '@react-google-maps/api'
import { useState, useMemo } from 'react'
import { COURSES } from '../data/courses.js'
import './MapView.css'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function MapView({ location, driveTimes, teetimes, sessionDate, onCourseSelect }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  })

  const [selectedCourse, setSelectedCourse] = useState(null)

  const courseMarkers = useMemo(() => {
    const map = new Map()
    for (const item of teetimes) {
      if (item.date !== sessionDate) continue
      const course = COURSES.find(c => c.id === item.courseId)
      if (course && !map.has(course.id)) {
        const driveMinutes = driveTimes?.get(course.id) ?? 15
        map.set(course.id, {
          course,
          driveMinutes,
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
          availableCount: item.availableCount,
        })
      }
    }
    return Array.from(map.values())
  }, [teetimes, sessionDate, driveTimes])

  const mapCenter = { lat: location.lat, lng: location.lng }

  if (!isLoaded) return <div className="map-loading">Loading map…</div>

  return (
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

        {selectedCourse && (
          <InfoWindowF
            position={{ lat: selectedCourse.course.lat, lng: selectedCourse.course.lng }}
            onCloseClick={() => setSelectedCourse(null)}
          >
            <div className="info-window">
              <h3>{selectedCourse.course.name}</h3>
              <p><strong>Drive:</strong> {selectedCourse.driveMinutes}m</p>
              <p><strong>Price:</strong> ${selectedCourse.minPrice.toFixed(0)}–${selectedCourse.maxPrice.toFixed(0)}</p>
              <p><strong>Available:</strong> {selectedCourse.availableCount} slots</p>
              <button onClick={() => onCourseSelect(selectedCourse.course.id)} className="info-view-btn">
                View Details →
              </button>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
    </div>
  )
}
