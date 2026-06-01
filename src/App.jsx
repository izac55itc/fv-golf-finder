import { useState, useEffect, useMemo, useCallback } from 'react'
import { COURSES } from './data/courses.js'
import { rankTeetimes } from './utils/ranker.js'
import { fetchAllDriveTimes } from './utils/distanceMatrix.js'
import { getCurrentLocation, WALNUT_GROVE } from './utils/geo.js'
import { getSunsetTime } from './utils/sunset.js'
import TeeTimeTable from './components/TeeTimeTable.jsx'

// Raw GitHub URL for the data branch — updated hourly by the scrape.yml Action
const DATA_URL = 'https://raw.githubusercontent.com/izac55itc/fv-golf-finder/data/teetimes.json'

// ── Helpers ───────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0') }
function toTimeInput(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

function fromTimeInput(str, ref) {
  const [h, m] = str.split(':').map(Number)
  const d = new Date(ref)
  d.setHours(h, m, 0, 0)
  return d
}

function roundUpQuarter(d) {
  const ms = d.getTime(), q = 15 * 60_000
  const rem = ms % q
  return rem === 0 ? new Date(ms) : new Date(ms + (q - rem))
}

function timeAgo(isoStr) {
  if (!isoStr) return null
  const mins = Math.round((Date.now() - new Date(isoStr)) / 60_000)
  if (mins < 1)  return 'just now'
  if (mins === 1) return '1 min ago'
  if (mins < 60) return `${mins} mins ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m ago`
}

// ── Component ─────────────────────────────────────────────────────────────

export default function App() {
  // Location
  const [location, setLocation]     = useState({ ...WALNUT_GROVE, source: 'default' })
  const [locLoading, setLocLoading] = useState(true)

  // Session planner
  const [fromTimeStr,   setFromTimeStr]   = useState(() => toTimeInput(roundUpQuarter(new Date())))
  const [doneByTimeStr, setDoneByTimeStr] = useState(() => toTimeInput(getSunsetTime(new Date())))

  // Tee times from data branch
  const [teetimes,     setTeetimes]     = useState([])
  const [dataDate,     setDataDate]     = useState(null)   // date the scraper ran for
  const [generatedAt,  setGeneratedAt]  = useState(null)   // ISO timestamp
  const [teeFetching,  setTeeFetching]  = useState(true)
  const [teeError,     setTeeError]     = useState(null)

  // Drive times (Mapbox or Haversine)
  const [driveTimes,   setDriveTimes]   = useState(null)

  // ── GPS location
  useEffect(() => {
    setLocLoading(true)
    getCurrentLocation().then(loc => {
      setLocation(loc)
      setLocLoading(false)
    })
  }, [])

  // ── Drive times — refetch when location changes
  useEffect(() => {
    let alive = true
    setDriveTimes(null)
    fetchAllDriveTimes(location.lat, location.lng, COURSES)
      .then(map => { if (alive) setDriveTimes(map) })
    return () => { alive = false }
  }, [location.lat, location.lng])

  // ── Fetch tee times from data branch
  const fetchTeetimes = useCallback(() => {
    setTeeFetching(true)
    setTeeError(null)

    // Cache-bust with current hour so stale CDN copies are skipped
    const hour = Math.floor(Date.now() / 3_600_000)
    fetch(`${DATA_URL}?h=${hour}`)
      .then(r => {
        if (r.status === 404) throw new Error('No data yet — scraper hasn\'t run. Trigger it manually in the Actions tab.')
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setTeetimes(data.teetimes || [])
        setDataDate(data.date || null)
        setGeneratedAt(data.generatedAt || null)
        setTeeFetching(false)
      })
      .catch(err => {
        setTeeError(err.message)
        setTeeFetching(false)
      })
  }, [])

  useEffect(() => { fetchTeetimes() }, [fetchTeetimes])

  // ── Derive Date objects from time inputs (always relative to today/dataDate)
  const baseDate = dataDate ? new Date(dataDate + 'T00:00:00') : new Date()

  const availableFrom = useMemo(() => fromTimeInput(fromTimeStr, baseDate),   [fromTimeStr, dataDate])
  const mustBeDoneBy  = useMemo(() => fromTimeInput(doneByTimeStr, baseDate), [doneByTimeStr, dataDate])

  // ── Rank
  const ranked = useMemo(() => {
    if (!driveTimes || !teetimes.length) return []
    return rankTeetimes({ teetimes, courses: COURSES, driveTimes, availableFrom, mustBeDoneBy })
  }, [teetimes, driveTimes, availableFrom, mustBeDoneBy])

  const goCount = ranked.filter(r => r.verdict === 'go').length
  const sunset  = getSunsetTime(new Date())

  const loading = teeFetching || !driveTimes

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-icon">⛳</div>
        <div>
          <h1>FV Golf Finder</h1>
          <p className="header-subtitle">Fraser Valley Tee Time Session Planner</p>
        </div>
        <div className="header-meta">
          <div>Sunset {toTimeInput(sunset)} PDT</div>
          <div>{goCount} GO available</div>
        </div>
      </header>

      <main>
        <div className="planner-card">
          <div className="planner-top-row">
            <h2>Plan Your Session</h2>
            <div className="data-freshness">
              {generatedAt && <span>Updated {timeAgo(generatedAt)}</span>}
              <button
                className="refresh-btn"
                onClick={fetchTeetimes}
                disabled={teeFetching}
                title="Re-fetch latest tee times from GitHub"
              >
                {teeFetching ? '⟳ Loading…' : '⟳ Refresh'}
              </button>
            </div>
          </div>

          <div className="planner-fields">
            <div className="field field-location">
              <label>Location</label>
              <div className="loc-display">
                {locLoading ? '📍 Detecting…' : `📍 ${location.name}${location.source === 'denied' ? ' (GPS denied)' : ''}`}
              </div>
            </div>

            <div className="field">
              <label htmlFor="available-from">Available From</label>
              <input
                id="available-from"
                type="time"
                value={fromTimeStr}
                onChange={e => setFromTimeStr(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="must-be-done">Must Be Done By</label>
              <input
                id="must-be-done"
                type="time"
                value={doneByTimeStr}
                onChange={e => setDoneByTimeStr(e.target.value)}
              />
            </div>
          </div>
        </div>

        {teeError && (
          <div className="error-banner">⚠️ {teeError}</div>
        )}

        <TeeTimeTable rows={ranked} loading={loading} driveTimesReady={!!driveTimes} />
      </main>
    </div>
  )
}
