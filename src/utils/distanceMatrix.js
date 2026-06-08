// Haversine straight-line fallback (no API needed)
function haversineMinutes(fromLat, fromLng, toLat, toLng) {
  const R = 6371
  const dLat = ((toLat - fromLat) * Math.PI) / 180
  const dLng = ((toLng - fromLng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  // Road factor 1.3, average 40 km/h urban, +3 min base
  return Math.max(3, Math.round((km * 1.3) / 40 * 60) + 3)
}

// Google Maps Distance Matrix API — real-time traffic-aware driving duration
// Includes live traffic data for accurate last-minute decision-making
async function googleMapsMinutes(fromLat, fromLng, toLat, toLng, apiKey) {
  const origins = `${fromLat},${fromLng}`
  const destinations = `${toLat},${toLng}`
  const now = Math.floor(Date.now() / 1000)

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
  url.searchParams.append('origins', origins)
  url.searchParams.append('destinations', destinations)
  url.searchParams.append('mode', 'driving')
  url.searchParams.append('departure_time', now)
  url.searchParams.append('traffic_model', 'best_guess')
  url.searchParams.append('key', apiKey)

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Google Maps ${res.status}`)
  const data = await res.json()

  if (data.status !== 'OK') throw new Error(`Google Maps: ${data.status}`)
  const element = data.rows?.[0]?.elements?.[0]
  if (!element || element.status !== 'OK') throw new Error('No route found')

  const seconds = element.duration_in_traffic?.value || element.duration?.value
  if (!seconds) throw new Error('No duration data')

  return Math.ceil(seconds / 60)
}

// Fetch drive times for all courses in one pass using Google Maps real-time traffic.
// Returns Map<courseId, minutes>.
// Falls back to Haversine if API fails.
export async function fetchAllDriveTimes(fromLat, fromLng, courses) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const results = new Map()

  await Promise.all(
    courses.map(async (course) => {
      try {
        if (apiKey) {
          const mins = await googleMapsMinutes(fromLat, fromLng, course.lat, course.lng, apiKey)
          results.set(course.id, mins)
        } else {
          results.set(course.id, haversineMinutes(fromLat, fromLng, course.lat, course.lng))
        }
      } catch (err) {
        // Google Maps failed — use Haversine fallback
        console.warn(`Drive time fallback for course ${course.id}:`, err.message)
        results.set(course.id, haversineMinutes(fromLat, fromLng, course.lat, course.lng))
      }
    })
  )

  return results
}
