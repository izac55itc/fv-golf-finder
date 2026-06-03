'use strict'
const fs   = require('fs')
const path = require('path')
const golfnow = require('./golfnow')

const DAYS_AHEAD = 7

async function main() {
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
        let seq = 1
        for (const raw of rawList) {
          const isoTime = parseTime(raw.time, dateStr)
          if (!isoTime) continue
          if (raw.spaces <= 0) continue
          allTeetimes.push({
            id:         `gn-${courseId}-${dateStr}-${seq++}`,
            courseId,
            time:       isoTime,
            greenfee:   raw.greenfee,
            spaces:     raw.spaces,
            maxPlayers: raw.maxPlayers,
            source:     'golfnow',
          })
        }
      }
    }
  } finally {
    golfnow.closeBrowser().catch(() => {})
  }

  // Deduplicate — same course + same time slot appears multiple times
  // at different rate tiers (walking, cart, promo). Keep cheapest per slot.
  const dedupMap = new Map()
  for (const tt of allTeetimes) {
    const key = `${tt.courseId}|${tt.time}`
    const existing = dedupMap.get(key)
    if (!existing || tt.greenfee < existing.greenfee) {
      dedupMap.set(key, tt)
    }
  }
  const deduped = [...dedupMap.values()]

  console.log(`\n✓ Deduped: ${allTeetimes.length} → ${deduped.length} tee times\n`)

  const output = {
    generatedAt: new Date().toISOString(),
    dates,
    count:     deduped.length,
    teetimes:  deduped,
  }

  const outPath = path.join(__dirname, 'teetimes.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`✓ Wrote ${deduped.length} tee times across ${dates.length} days → teetimes.json\n`)

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
