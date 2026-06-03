// Open-Meteo free weather API — no key required
const BASE = 'https://api.open-meteo.com/v1/forecast'

const WMO_ICON = (code) => {
  if (code === 0)  return '☀️'
  if (code <= 2)   return '🌤'
  if (code === 3)  return '☁️'
  if (code <= 49)  return '🌫'
  if (code <= 59)  return '🌦'
  if (code <= 69)  return '🌧'
  if (code <= 79)  return '🌨'
  if (code <= 84)  return '🌧'
  if (code <= 99)  return '⛈'
  return '🌡'
}

const WMO_LABEL = (code) => {
  if (code === 0)  return 'Clear'
  if (code <= 2)   return 'Partly cloudy'
  if (code === 3)  return 'Overcast'
  if (code <= 49)  return 'Fog'
  if (code <= 59)  return 'Drizzle'
  if (code <= 69)  return 'Rain'
  if (code <= 79)  return 'Snow'
  if (code <= 84)  return 'Showers'
  if (code <= 99)  return 'Thunderstorm'
  return 'Unknown'
}

async function fetchHourlyForecast(lat, lng) {
  const params = new URLSearchParams({
    latitude:         lat,
    longitude:        lng,
    hourly:           'temperature_2m,precipitation_probability,weathercode,windspeed_10m',
    timezone:         'America/Vancouver',
    forecast_days:    7,
    temperature_unit: 'celsius',
    windspeed_unit:   'kmh',
  })
  const res = await fetch(`${BASE}?${params}`)
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`)
  const data = await res.json()
  const hours = data.hourly.time.map((t, i) => ({
    time:       t,
    temp:       Math.round(data.hourly.temperature_2m[i]),
    precipProb: data.hourly.precipitation_probability[i],
    windspeed:  Math.round(data.hourly.windspeed_10m[i]),
    code:       data.hourly.weathercode[i],
    icon:       WMO_ICON(data.hourly.weathercode[i]),
    label:      WMO_LABEL(data.hourly.weathercode[i]),
  }))
  const index = new Map()
  for (const h of hours) index.set(h.time, h)
  return index
}

export async function fetchAllCourseWeather(courses) {
  const results = new Map()
  const coordKey = (c) => `${c.lat.toFixed(2)},${c.lng.toFixed(2)}`
  const fetched = new Map()
  await Promise.all(
    courses.map(async (course) => {
      const key = coordKey(course)
      if (!fetched.has(key)) {
        try {
          const index = await fetchHourlyForecast(course.lat, course.lng)
          fetched.set(key, index)
        } catch {
          fetched.set(key, new Map())
        }
      }
      results.set(course.id, fetched.get(key))
    })
  )
  return results
}

export function getWeatherAtTime(weatherMap, courseId, teeTime) {
  const index = weatherMap?.get(courseId)
  if (!index) return null
  const d = new Date(teeTime)
  const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00`
  return index.get(key) ?? null
}

export function getWeatherForRound(weatherMap, courseId, teeTime, roundMinutes) {
  const index = weatherMap?.get(courseId)
  if (!index) return null
  const startMs = new Date(teeTime).getTime()
  const endMs   = startMs + roundMinutes * 60_000
  const snapshots = []
  for (let ms = startMs; ms <= endMs; ms += 60 * 60_000) {
    const d = new Date(ms)
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00`
    const w = index.get(key)
    if (w) snapshots.push(w)
  }
  if (!snapshots.length) return null
  const temps   = snapshots.map(w => w.temp)
  const precips = snapshots.map(w => w.precipProb)
  const winds   = snapshots.map(w => w.windspeed)
  return {
    startWeather:  snapshots[0],
    endWeather:    snapshots[snapshots.length - 1],
    maxPrecipProb: Math.max(...precips),
    minTemp:       Math.min(...temps),
    maxTemp:       Math.max(...temps),
    maxWind:       Math.max(...winds),
  }
}
