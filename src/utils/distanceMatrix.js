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

// Mapbox Directions API — traffic-aware driving duration
// Docs: https://docs.mapbox.com/api/navigation/directions/
// Free tier: 100,000 requests/month, no credit card required
async function mapboxMinutes(fromLat, fromLng, toLat, toLng, token) {
  const coords = `${fromLng},${fromLat};${toLng},${toLat}`
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}` +
    `?access_token=${token}&overview=false`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapbox ${res.status}`)
  const data = await res.json()
  const seconds = data.routes?.[0]?.duration
  if (!seconds) throw new Error('No route returned')
  return Math.ceil(seconds / 60)
}

// Fetch drive times for all courses in one pass.
// Returns Map<courseId, minutes>.
// Falls back to Haversine per-course if Mapbox fails.
export async function fetchAllDriveTimes(fromLat, fromLng, courses) {
  const token = import.meta.env.VITE_MAPBOX_TOKEN

  const results = new Map()

  await Promise.all(
    courses.map(async (course) => {
      try {
        if (token) {
          const mins = await mapboxMinutes(fromLat, fromLng, course.lat, course.lng, token)
          results.set(course.id, mins)
        } else {
          results.set(course.id, haversineMinutes(fromLat, fromLng, course.lat, course.lng))
        }
      } catch {
        // Mapbox failed for this course — use Haversine
        results.set(course.id, haversineMinutes(fromLat, fromLng, course.lat, course.lng))
      }
    })
  )

  return results
}
