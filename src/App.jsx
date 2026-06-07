import './App.css'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { COURSES } from './data/courses.js'
import FilterPanel from './components/FilterPanel.jsx'
import CalendarView from './components/CalendarView.jsx'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

const GH_TOKEN    = import.meta.env.VITE_GITHUB_TOKEN
const GH_DISPATCH = 'https://api.github.com/repos/izac55itc/fv-golf-finder/actions/workflows/scrape.yml/dispatches'

const SCRAPE_WAIT_MS = 5 * 60 * 1000

function timeAgo(isoStr) {
  if (!isoStr) return null
  const mins = Math.round((Date.now() - new Date(isoStr)) / 60_000)
  if (mins < 1)   return 'just now'
  if (mins === 1) return '1 min ago'
  if (mins < 60)  return `${mins} mins ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m ago`
}

export default function App() {

  const [sessionDate,   setSessionDate]   = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const [teetimes,    setTeetimes]    = useState([])
  const [generatedAt, setGeneratedAt] = useState(null)
  const [teeFetching, setTeeFetching] = useState(true)
  const [teeError,    setTeeError]    = useState(null)

  const [scrapeStatus,      setScrapeStatus]      = useState(null)
  const [scrapeSecondsLeft, setScrapeSecondsLeft] = useState(0)

  const [maxGreenfee,     setMaxGreenfee]     = useState(120)
  const [selectedCourses, setSelectedCourses] = useState(null)

  const availableDates = useMemo(() => (
    [...Array(7)].map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const date = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${date}`
    })
  ), [])

  const handleDateChange = (newDate) => {
    setSessionDate(newDate)
    const isToday = newDate === toDateInput(new Date())
    if (isToday) {
      setFromTimeStr(toTimeInput(roundUpQuarter(new Date())))
      setDoneByTimeStr(toTimeInput(getSunsetTime(new Date())))
    } else {
      setFromTimeStr('06:00')
      setDoneByTimeStr(toTimeInput(getSunsetTime(new Date(newDate + 'T12:00:00'))))
    }
  }

  const fetchTeetimes = useCallback(() => {
    setTeeFetching(true)
    setTeeError(null)

    if (!supabase) {
      setTeeError('Supabase not configured')
      setTeeFetching(false)
      return
    }

    supabase
      .from('price_summaries')
      .select('*')
      .order('date,course_id', { ascending: true })
      .then(({ data, error }) => {
        if (error) {
          setTeeError(error.message)
          setTeeFetching(false)
          return
        }

        const summaries = data || []
        const transformed = summaries.map(s => ({
          courseId: s.course_id,
          date: s.date,
          minPrice: s.min_price,
          maxPrice: s.max_price,
          availableCount: s.available_count,
          hasHotDeals: s.has_hot_deals,
        }))

        setTeetimes(transformed)
        setGeneratedAt(new Date().toISOString())
        setTeeFetching(false)
      })
  }, [supabase])

  useEffect(() => { fetchTeetimes() }, [fetchTeetimes])

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

  const baseDate      = useMemo(() => new Date(sessionDate + 'T00:00:00'), [sessionDate])
  const courseOptions = COURSES

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

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-icon">⛳</div>
        <div>
          <h1>FV Golf Finder</h1>
          <p className="header-subtitle">Fraser Valley Tee Time Session Planner</p>
        </div>
        <div className="header-meta">
          <div>{teetimes.length} courses available</div>
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
              >
                {teeFetching ? '⟳ Loading…' : '⟳ Refresh'}
              </button>
              {GH_TOKEN && (
                <button
                  className="refresh-btn scrape-btn"
                  onClick={triggerScraper}
                  disabled={scrapeStatus === 'triggering' || scrapeStatus === 'waiting'}
                >
                  {scrapeStatus === 'triggering' && '⏳ Triggering…'}
                  {scrapeStatus === 'waiting'    && `⏳ Scraping… ${Math.floor(scrapeSecondsLeft / 60)}:${String(scrapeSecondsLeft % 60).padStart(2,'0')}`}
                  {scrapeStatus === 'error'      && '⚠ Run failed'}
                  {!scrapeStatus                 && '▶ Run Scraper'}
                </button>
              )}
            </div>
          </div>

          <FilterPanel
            maxGreenfee={maxGreenfee}
            onMaxGreenfee={setMaxGreenfee}
            courseOptions={courseOptions}
            selectedCourses={selectedCourses}
            onToggleCourse={handleToggleCourse}
            onSelectAllCourses={handleSelectAllCourses}
          />
        </div>

        {teeError && (
          <div className="error-banner">⚠️ {teeError}</div>
        )}

        <CalendarView
          teetimes={teetimes}
          sessionDate={sessionDate}
          onDateChange={handleDateChange}
          availableDates={availableDates}
          maxGreenfee={maxGreenfee}
          selectedCourses={selectedCourses}
        />
      </main>
    </div>
  )
}
