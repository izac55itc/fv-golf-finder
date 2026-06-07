'use strict'
const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const golfnow = require('./golfnow')

const DAYS_AHEAD = 7

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const today = new Date()
  console.log(`\nFV Golf Finder scraper — ${today.toISOString().split('T')[0]} (${DAYS_AHEAD} days)\n`)

  const dates = []
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  const allTeetimes = []

  try {
    for (const dateStr of dates) {
      console.log(`\n── Scraping ${dateStr} ──`)
      const scraped = await golfnow.scrapeAll(dateStr)
      for (const [courseId, rawList] of scraped) {
        for (const raw of rawList) {
          const isoTime = parseTime(raw.time, dateStr)
          if (!isoTime) continue
          if (raw.spaces <= 0) continue
          allTeetimes.push({
            course_id: courseId,
            time: isoTime,
            greenfee: raw.greenfee,
            spaces: raw.spaces,
            max_players: raw.maxPlayers,
            source: 'golfnow',
          })
        }
      }
    }

    // Delete old tee times (older than today) then insert new batch
    const { error: deleteErr } = await supabase
      .from('teetimes')
      .delete()
      .lt('time', new Date().toISOString())

    if (deleteErr) {
      console.error('Error deleting old records:', deleteErr.message)
    } else {
      console.log(`✓ Deleted expired tee times`)
    }

    // Upsert new tee times (on conflict, do nothing to preserve existing data)
    const { data, error } = await supabase
      .from('teetimes')
      .upsert(allTeetimes, { onConflict: 'course_id,time,greenfee' })

    if (error) {
      console.error('Error upserting tee times:', error.message)
      process.kill(process.pid, 'SIGKILL')
      return
    }

    console.log(`\n✓ Upserted ${allTeetimes.length} tee times across ${dates.length} days → Supabase\n`)
  } finally {
    golfnow.closeBrowser().catch(() => {})
  }

  process.kill(process.pid, 'SIGTERM')
}

function parseTime(raw, dateStr) {
  if (!raw) return null

  const pad = x => String(x).padStart(2, '0')

// ISO format — extract hours/minutes directly
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const match = raw.match(/T(\d{2}):(\d{2})/)
    if (match) {
      return `${dateStr}T${match[1]}:${match[2]}:00`
    }
  }

  // "7:30 AM" / "7:30 PM"
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let h = parseInt(ampm[1], 10)
    const m = parseInt(ampm[2], 10)
    if (ampm[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (ampm[3].toUpperCase() === 'AM' && h === 12) h = 0
    return `${dateStr}T${pad(h)}:${pad(m)}:00`
  }

  // "07:30" (24h)
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    return `${dateStr}T${raw.padStart(5,'0')}:00`
  }

  // Unix timestamp (ms or seconds) — convert to Pacific time
  const n = Number(raw)
  if (!isNaN(n) && n > 0) {
    const ms = n > 1e10 ? n : n * 1000
    const d = new Date(ms)
    const pacific = new Date(d.toLocaleString('en-US', { timeZone: 'America/Vancouver' }))
    return `${dateStr}T${pad(pacific.getHours())}:${pad(pacific.getMinutes())}:00`
  }

  return null
}

// Hard timeout: 20 minutes for 7 days of scraping
setTimeout(() => {
  console.error('Hard timeout: force killing process')
  process.kill(process.pid, 'SIGKILL')
}, 1200_000)

main()
  .then(() => { process.exit(0) })
  .catch(err => { console.error('Fatal:', err.message); process.exit(1) })
