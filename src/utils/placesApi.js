const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Local cache for place ratings (courseId -> {rating, reviews, photoUrl})
const ratingCache = new Map()

export async function getCourseRating(course) {
  if (!GOOGLE_MAPS_API_KEY) return null

  // Return cached result if available
  if (ratingCache.has(course.id)) {
    return ratingCache.get(course.id)
  }

  try {
    // Search for the course using Place Text Search
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
    searchUrl.searchParams.set('query', `${course.name} golf course ${course.location}`)
    searchUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY)

    const searchRes = await fetch(searchUrl)
    if (!searchRes.ok) throw new Error('Place search failed')

    const searchData = await searchRes.json()
    if (!searchData.results || !searchData.results.length) {
      ratingCache.set(course.id, null)
      return null
    }

    const place = searchData.results[0]
    const placeId = place.place_id
    const rating = place.rating

    // Get more details (photos, reviews) using Place Details API
    let photoUrl = null
    let reviewCount = 0

    if (place.photos && place.photos.length > 0) {
      const photoRef = place.photos[0].photo_reference
      photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoRef}&key=${GOOGLE_MAPS_API_KEY}`
    }

    if (place.user_ratings_total) {
      reviewCount = place.user_ratings_total
    }

    const result = {
      rating: rating || null,
      reviewCount,
      photoUrl,
      placeId,
    }

    ratingCache.set(course.id, result)
    return result
  } catch (err) {
    console.warn(`Failed to fetch rating for ${course.name}:`, err)
    ratingCache.set(course.id, null)
    return null
  }
}
