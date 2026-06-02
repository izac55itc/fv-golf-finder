import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { COURSES } from './data/courses.js'
import { rankTeetimes, fuelCostDollars } from './utils/ranker.js'
import { fetchAllDriveTimes } from './utils/distanceMatrix.js'
import { getCurrentLocation, WALNUT_GROVE } from './utils/geo.js'
import { getSunsetTime } from './utils/sunset.js'
import TeeTimeTable from './components/TeeTimeTable.jsx'
import FilterPanel from './components/FilterPanel.jsx'

// Raw GitHub URL for the data branch — updated hourly by the scrape.yml Action
const DATA_URL = 'https://raw.githubusercontent.com/izac55itc/fv-golf-finder/main/scraper/teetimes.json'

// GitHub API — trigger the scrape.yml workflow on demand
const GH_TOKEN   = import.meta.env.VITE_GITHUB_TOKEN
const GH_DISPATCH = 'https://api.github.com/repos/izac55itc/fv-golf-finder/actions/workflows/scrape.yml/dispatches'

// How long to wait after triggering before auto-refreshing data (ms)
const SCRAPE_WAIT_MS = 5 * 60 * 1000

const QUICK_TIMES = [
  { label: 'Morning',   fromH: 6,  toH: 12, fromStr: '06:00', toStr: '12:00' },
  { label: 'Afternoon', fromH: 12, toH: 17, fromStr: '12:00', toStr: '17:00' },
  { label: 'Twilight',  fromH: 17, toH: 23, fromStr: '17:00', toStr: '23:00' },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function pad(n) { return String(n).padStart(2, '0') }
function toDateInput(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
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

async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=1&countrycodes=ca`
  const res = await fetch(url, {
    headers: {
      'Accept-Language': 'en',
      'User-Agent': 'FV-Golf-Finder/0.1 (personal project)',
    },
  })
  if (!res.ok) throw new Error('Geocode failed')
  const data = await res.json()
  if (!data.length) throw new Error('Location not found')
  const item = data[0]
  const a = item.address || {}
  const neighbourhood = a.neighbourhood || a.suburb || a.hamlet || a.quarter
  const city = a.city || a.town || a.village || a.municipality || a.county
  const parts = [neighbourhood, city].filter(Boolean)
  const name = parts.length ? parts.join(', ') : item.display_name?.split(',')[0]
  return { lat: parseFloat(item.lat), lng: parseFloat(item.lon), name, source: 'manual' }
}

// ── Component ─────────────────────────────────────────────────────────────

export default function App() {
  // Location
  const [location, setLocation]       = useState({ ...WALNUT_GROVE, source: 'default' })
  const [locLoading, setLocLoading]   = useState(true)
  const [locInput, setLocInput]       = useState('')
  const [locSearching, setLocSearching] = useState(false)
  const [locError, setLocError]       = useState(null)
  const locInputRef = useRef(null)

  // Session planner
  const [sessionDate,   setSessionDate]   = useState(() => toDateInput(new Date()))
  const [fromTimeStr,   setFromTimeStr]   = useState(() => toTimeInput(roundUpQuarter(new Date())))
  const [doneByTimeStr, setDoneByTimeStr] = useState(() => toTimeInput(getSunsetTime(new Date())))

  // Tee times from data branch
  const [teetimes,     setTeetimes]     = useState([])
  const [dataDate,     setDataDate]     = useState(null)
  const [generatedAt,  setGeneratedAt]  = useState(null)
  const [teeFetching,  setTeeFetching]  = useState(true)
  const [teeError,     setTeeError]     = useState(null)

  // Manual scraper trigger
  const [scrapeStatus,  setScrapeStatus]  = useState(null)
  const [scrapeSecondsLeft, setScrapeSecondsLeft] = useState(0)

  // Filters
  const [timeRange,      setTimeRange]      = useState([6, 23])
  const [maxGreenfee,    setMaxGreenfee]    = useState(120)
  const [maxDriveMin,    setMaxDriveMin]    = useState(60)
  const [playerCount,    setPlayerCount]    = useState(1)
  const [selectedCourses, setSelectedCourses] = useState(null)

  // Drive times
  const [driveTimes, setDriveTimes] = useState(null)

// ── Default to Walnut Grove, no GPS on load
  useEffect(() => {
    setLocInput(WALNUT_GROVE.name)
    setLocLoading(false)
  }, [])

  // ── Drive times — refetch when location changes
  useEffect(() => {
    let alive = true
    setDriveTimes(null)
    fetchAllDriveTimes(location.lat, location.lng, COURSES)
      .then(map => { if (alive) setDriveTimes(map) })
    return () => { alive = false }
  }, [location.lat, location.lng])

  // ── Manual location search
  const handleLocSearch = useCallback(async () => {
    if (!locInput.trim()) return
    setLocSearching(true)
    setLocError(null)
    try {
      const loc = await geocodeAddress(locInput.trim())
      setLocation(loc)
      setLocInput(loc.name)
    } catch (err) {
      setLocError('Location not found — try a different search')
    } finally {
      setLocSearching(false)
    }
  }, [locInput])

  const handleLocKeyDown = (e) => {
    if (e.key === 'Enter') handleLocSearch()
  }

  const handleLocGps = useCallback(() => {
    setLocLoading(true)
    setLocError(null)
    getCurrentLocation().then(loc => {
      setLocation(loc)
      setLocInput(loc.name)
      setLocLoading(false)
    })
  }, [])

  // ── Fetch tee times
  const fetchTeetimes = useCallback(() => {
    setTeeFetching(true)
    setTeeError(null)
    fetch(`${DATA_URL}?v=${Date.now()}`)
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

  // ── Trigger scraper
  const triggerScraper = useCallback(async () => {
    if (!GH_TOKEN) { setScrapeStatus('error'); return }
    setScrapeStatus('triggering')
    try {
      const res = await fetch(GH_DISPATCH, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GH_TOKEN}`,
          'Accept': 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ref: 'main' }),
      })
      if (res.status === 204) {
        setScrapeStatus('waiting')
        setScrapeSecondsLeft(Math.round(SCRAPE_WAIT_MS / 1000))
      } else {
        setScrapeStatus('error')
      }
    } catch {
      setScrapeStatus('error')
    }
  }, [])

  // ── Countdown after scrape trigger
  useEffect(() => {
    if (scrapeStatus !== 'waiting') return
    if (scrapeSecondsLeft <= 0) {
      setScrapeStatus(null)
      fetchTeetimes()
      return
    }
    const id = setTimeout(() => setScrapeSecondsLeft(s => s - 1), 1000)
    return () => clearTimeout(id)
  }, [scrapeStatus, scrapeSecondsLeft, fetchTeetimes])

  // ── Derive Date objects
  const baseDate = new Date(sessionDate + 'T00:00:00')
  const availableFrom = useMemo(() => fromTimeInput(fromTimeStr, baseDate),   [fromTimeStr, dataDate])
  const mustBeDoneBy  = useMemo(() => fromTimeInput(doneByTimeStr, baseDate), [doneByTimeStr, dataDate])

  // ── Rank
  const ranked = useMemo(() => {
    if (!driveTimes || !teetimes.length) return []
    return rankTeetimes({ teetimes, courses: COURSES, driveTimes, availableFrom, mustBeDoneBy })
  }, [teetimes, driveTimes, availableFrom, mustBeDoneBy])

  // ── Filter
  const courseOptions = useMemo(() => {
    const ids = new Set(ranked.map(r => r.course.id))
    return COURSES.filter(c => ids.has(c.id))
  }, [ranked])

  const filteredRanked = useMemo(() => {
    if (!ranked.length) return ranked
    const [fromH, toH] = timeRange
    const fromMs = fromH * 3600_000
    const toMs   = toH   * 3600_000
    return ranked
      .filter(row => {
        const teeH = row.teetime.time.getHours() * 3600_000 +
                     row.teetime.time.getMinutes() * 60_000
        if (teeH < fromMs || teeH > toMs) return false
        if (row.teetime.greenfee > maxGreenfee) return false
        if (row.driveMinutes > maxDriveMin) return false
        if ((row.teetime.spaces ?? 4) < playerCount) return false
        if (selectedCourses !== null && !selectedCourses.has(row.course.id)) return false
        return true
      })
      .sort((a, b) => {
        const aCost = a.teetime.greenfee + fuelCostDollars(a.driveMinutes)
        const bCost = b.teetime.greenfee + fuelCostDollars(b.driveMinutes)
        return aCost - bCost
      })
  }, [ranked, timeRange, maxGreenfee, maxDriveMin, playerCount, selectedCourses])

  // ── Filter handlers
  const handleApplyQuickTime = (qt) => {
    setFromTimeStr(qt.fromStr)
    setDoneByTimeStr(qt.toStr)
    setTimeRange([qt.fromH, qt.toH])
  }

  const handleToggleCourse = (id) => {
    setSelectedCourses(prev => {
      const base = prev === null
        ? new Set(courseOptions.map(c => c.id))
        : new Set(prev)
      if (base.has(id)) base.delete(id)
      else base.add(id)
      return base.size === courseOptions.length ? null : base
    })
  }

  const handleSelectAllCourses = () => setSelectedCourses(null)

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
                disabled={teeFetching || scrapeStatus === 'waiting'}
                title="Re-fetch latest tee times from GitHub"
              >
                {teeFetching ? '⟳ Loading…' : '⟳ Refresh'}
              </button>
              {GH_TOKEN && (
                <button
                  className="refresh-btn scrape-btn"
                  onClick={triggerScraper}
                  disabled={scrapeStatus === 'triggering' || scrapeStatus === 'waiting'}
                  title="Run the GitHub Actions scraper now (takes ~5 min)"
                >
                  {scrapeStatus === 'triggering' && '⏳ Triggering…'}
                  {scrapeStatus === 'waiting'    && `⏳ Scraping… ${Math.floor(scrapeSecondsLeft / 60)}:${String(scrapeSecondsLeft % 60).padStart(2,'0')}`}
                  {scrapeStatus === 'error'      && '⚠ Run failed'}
                  {!scrapeStatus                 && '▶ Run Scraper'}
                </button>
              )}
              {scrapeStatus === 'error' && !GH_TOKEN && (
                <span className="scrape-no-token">VITE_GITHUB_TOKEN not set</span>
              )}
            </div>
          </div>

          <div className="planner-fields">
            <div className="field field-location">
              <label>Location</label>
              <div className="loc-input-row">
                <input
                  ref={locInputRef}
                  type="text"
                  className="loc-input"
                  value={locLoading ? 'Detecting…' : locInput}
                  onChange={e => setLocInput(e.target.value)}
                  onKeyDown={handleLocKeyDown}
                  disabled={locLoading || locSearching}
                  placeholder="Enter city or address"
                />
                <button
                  className="loc-search-btn"
                  onClick={handleLocSearch}
                  disabled={locLoading || locSearching || !locInput.trim()}
                  title="Search this location"
                >
                  {locSearching ? '…' : '🔍'}
                </button>
                <button
                  className="loc-gps-btn"
                  onClick={handleLocGps}
                  disabled={locLoading || locSearching}
                  title="Use my GPS location"
                >
                  📍
                </button>
              </div>
              {locError && <div className="loc-error">{locError}</div>}
            </div>

            <div className="field">
              <label htmlFor="session-date">Date</label>
              <input
                id="session-date"
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                min={toDateInput(new Date())}
              />
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
          <hr className="filter-divider" />
          <FilterPanel
            quickTimes={QUICK_TIMES}
            onQuickTime={handleApplyQuickTime}
            timeRange={timeRange}
            onTimeRange={setTimeRange}
            maxGreenfee={maxGreenfee}
            onMaxGreenfee={setMaxGreenfee}
            maxDriveMin={maxDriveMin}
            onMaxDriveMin={setMaxDriveMin}
            playerCount={playerCount}
            onPlayerCount={setPlayerCount}
            courseOptions={courseOptions}
            selectedCourses={selectedCourses}
            onToggleCourse={handleToggleCourse}
            onSelectAllCourses={handleSelectAllCourses}
          />
        </div>

        {teeError && (
          <div className="error-banner">⚠️ {teeError}</div>
        )}

        <TeeTimeTable rows={filteredRanked} loading={loading} driveTimesReady={!!driveTimes} />
      </main>
    </div>
  )
}
