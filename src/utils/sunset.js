// Real sunset time (NOAA solar calculation) for a given date and location.
// Defaults to the Langley area; courses are all within a few km so the
// difference between them is well under a minute.
const DEFAULT_LAT = 49.15
const DEFAULT_LNG = -122.6

const rad = (d) => (d * Math.PI) / 180
const deg = (r) => (r * 180) / Math.PI

export function getSunsetTime(date, lat = DEFAULT_LAT, lng = DEFAULT_LNG) {
  // Day of year for the given local date
  const y = date.getFullYear()
  const m = date.getMonth()
  const d = date.getDate()
  const start = Date.UTC(y, 0, 0)
  const dayOfYear = Math.floor((Date.UTC(y, m, d) - start) / 86_400_000)

  // Fractional year (radians), evaluated around local noon-ish
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1 + (12 - 12) / 24)

  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma))
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)

  // Hour angle at sunset (zenith 90.833° accounts for refraction + sun radius)
  const cosHa = Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl))
    - Math.tan(rad(lat)) * Math.tan(decl)
  const ha = deg(Math.acos(Math.min(1, Math.max(-1, cosHa))))

  // Sunset in minutes after 00:00 UTC
  const sunsetUtcMin = 720 - 4 * (lng - ha) - eqTime
  return new Date(Date.UTC(y, m, d) + sunsetUtcMin * 60_000)
}
