'use strict'
const fs   = require('fs')
const path = require('path')
const ws = require('ws')
const { createClient } = require('@supabase/supabase-js')
const golfnow = require('./golfnow')

const DAYS_AHEAD = 7

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: { transport: ws }
  })

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

    // Deduplicate by (course_id, time) — keep cheapest non-zero if available, else keep one $0
    const bySlot = new Map()
    allTeetimes.forEach(tt => {
      const key = `${tt.course_id}|${tt.time}`
      const existing = bySlot.get(key)
      if (!existing) {
        bySlot.set(key, tt)
      } else {
        // Prefer non-zero greenfee; if both are zero or both non-zero, prefer cheaper
        const existingIsZero = existing.greenfee === 0
        const newIsZero = tt.greenfee === 0
        if (newIsZero && existingIsZero) {
          // both $0, keep existing (or could pick by spaces)
        } else if (!newIsZero && existingIsZero) {
          // new has price, existing is $0, replace
          bySlot.set(key, tt)
        } else if (!newIsZero && !existingIsZero && tt.greenfee < existing.greenfee) {
          // both have prices, keep cheaper
          bySlot.set(key, tt)
        }
      }
    })
    const deduped = Array.from(bySlot.values())

    // Delete all tee times and start fresh (timezone fix requires clean slate)
    const { error: deleteErr } = await supabase
      .from('teetimes')
      .delete()
      .not('id', 'is', null)

    if (deleteErr) {
      console.error('Error deleting old records:', JSON.stringify(deleteErr, null, 2))
    } else {
      console.log(`✓ Deleted expired tee times`)
    }

    // Upsert new tee times (on conflict, do nothing to preserve existing data)
    const { data, error } = await supabase
      .from('teetimes')
      .upsert(deduped, { onConflict: 'course_id,time,greenfee' })

    if (error) {
      console.error('Error upserting tee times:', JSON.stringify(error, null, 2))
      process.kill(process.pid, 'SIGKILL')
      return
    }

    console.log(`\n✓ Upserted ${deduped.length} tee times across ${dates.length} days → Supabase\n`)
  } finally {
    golfnow.closeBrowser().catch(() => {})
  }

  process.kill(process.pid, 'SIGTERM')
}

function parseTime(raw, dateStr) {
  if (!raw) return null

  const pad = x => String(x).padStart(2, '0')

  function pacificToUTC(h, m) {
    const date = new Date(dateStr + 'T12:00:00Z')
    const month = date.getUTCMonth()
    const offsetHours = (month >= 2 && month <= 9) ? 7 : 8

    let utcH = h + offsetHours
    let finalDateStr = dateStr

    if (utcH >= 24) {
      utcH -= 24
      const d = new Date(dateStr + 'T00:00:00Z')
      d.setUTCDate(d.getUTCDate() + 1)
      finalDateStr = d.toISOString().split('T')[0]
    }

    return `${finalDateStr}T${pad(utcH)}:${pad(m)}:00Z`
  }

  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    const match = raw.match(/T(\d{2}):(\d{2})/)
    if (match) {
      return pacificToUTC(parseInt(match[1], 10), parseInt(match[2], 10))
    }
  }

  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let h = parseInt(ampm[1], 10)
    const m = parseInt(ampm[2], 10)
    if (ampm[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (ampm[3].toUpperCase() === 'AM' && h === 12) h = 0
    return pacificToUTC(h, m)
  }

  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const parts = raw.split(':')
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    return pacificToUTC(h, m)
  }

  const n = Number(raw)
  if (!isNaN(n) && n > 0) {
    const ms = n > 1e10 ? n : n * 1000
    const d = new Date(ms)
    const pacific = new Date(d.toLocaleString('en-US', { timeZone: 'America/Vancouver' }))
    return pacificToUTC(pacific.getHours(), pacific.getMinutes())
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
