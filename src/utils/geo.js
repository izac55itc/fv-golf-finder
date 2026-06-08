export const WALNUT_GROVE = {
  lat: 49.175940,
  lng: -122.626678,
  name: '21510 95A Ave, Langley BC V1M 2C6',
}

// Reverse-geocode coordinates to a human-readable name via Nominatim (OpenStreetMap, free, no key)
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        // Nominatim requires a descriptive User-Agent
        'User-Agent': 'FV-Golf-Finder/0.1 (personal project)',
      },
    })
    if (!res.ok) throw new Error('Nominatim error')
    const data = await res.json()
    const a = data.address || {}

    // Build a readable label: neighbourhood/suburb + city/town/village
    const neighbourhood = a.neighbourhood || a.suburb || a.hamlet || a.quarter
    const city = a.city || a.town || a.village || a.municipality || a.county
    const parts = [neighbourhood, city].filter(Boolean)
    return parts.length ? parts.join(', ') : data.display_name?.split(',')[0] || `${lat.toFixed(3)}, ${lng.toFixed(3)}`
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  }
}

// Attempt browser GPS, resolve to { lat, lng, name, source }
// source: 'gps' | 'denied' | 'unavailable' | 'timeout'
export function getCurrentLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ ...WALNUT_GROVE, source: 'unavailable' })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const name = await reverseGeocode(lat, lng)
        resolve({ lat, lng, name, source: 'gps' })
      },
      (err) => {
        const source = err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable'
        resolve({ ...WALNUT_GROVE, source })
      },
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    )
  })
}
