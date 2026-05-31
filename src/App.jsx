import { useState, useMemo } from 'react'
import { COURSES } from './data/courses.js'
import { MOCK_TEE_TIMES } from './data/mockTeetimes.js'
import { rankTeetimes } from './utils/ranker.js'
import { WALNUT_GROVE } from './utils/distanceMatrix.js'
import TeeTimeTable from './components/TeeTimeTable.jsx'

// ── Helpers ────────────────────────────────────────────────────
function pad(n) {
  return String(n).padStart(2, '0')
}

function toTimeInput(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function fromTimeInput(str, ref) {
  const [hours, minutes] = str.split(':').map(Number)
  const d = new Date(ref)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function roundUpQuarter(date) {
  const ms = date.getTime()
  const quarter = 15 * 60 * 1000
  const remainder = ms % quarter
  if (remainder === 0) return new Date(ms)
  return new Date(ms + (quarter - remainder))
}

// ── Component ──────────────────────────────────────────────────
export default function App() {
  const [locationName] = useState(WALNUT_GROVE.name)
  const [fromLat] = useState(WALNUT_GROVE.lat)
  const [fromLng] = useState(WALNUT_GROVE.lng)

  const [availableFrom, setAvailableFrom] = useState(() =>
    roundUpQuarter(new Date())
  )

  const [mustBeDoneBy, setMustBeDoneBy] = useState(() => {
    const d = new Date()
    d.setHours(21, 5, 0, 0)
    return d
  })

  const ranked = useMemo(
    () =>
      rankTeetimes({
        teetimes: MOCK_TEE_TIMES,
        courses: COURSES,
        fromLat,
        fromLng,
        availableFrom,
        mustBeDoneBy,
      }),
    [fromLat, fromLng, availableFrom, mustBeDoneBy]
  )

  const goCount = ranked.filter((r) => r.verdict === 'go').length

  function handleAvailableFrom(e) {
    setAvailableFrom(fromTimeInput(e.target.value, availableFrom))
  }

  function handleMustBeDoneBy(e) {
    setMustBeDoneBy(fromTimeInput(e.target.value, mustBeDoneBy))
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-icon">⛳</div>
        <div>
          <h1>FV Golf Finder</h1>
          <p className="header-subtitle">
            Find a tee time that fits your evening in the Fraser Valley
          </p>
        </div>
        <div className="header-meta">
          <div>Sunset ~9:05 PM PDT</div>
          <div>{goCount} GO available</div>
        </div>
      </header>

      <main>
        <div className="planner-card">
          <h2>Plan Your Session</h2>
          <div className="planner-fields">
            <div className="field">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                type="text"
                readOnly
                value={locationName}
                title="GPS coming soon"
                style={{ background: '#f5f5f5' }}
              />
            </div>

            <div className="field">
              <label htmlFor="available-from">Available From</label>
              <input
                id="available-from"
                type="time"
                value={toTimeInput(availableFrom)}
                onChange={handleAvailableFrom}
              />
            </div>

            <div className="field">
              <label htmlFor="must-be-done">Must Be Done By</label>
              <input
                id="must-be-done"
                type="time"
                value={toTimeInput(mustBeDoneBy)}
                onChange={handleMustBeDoneBy}
              />
            </div>
          </div>
        </div>

        <TeeTimeTable rows={ranked} />
      </main>
    </div>
  )
}
