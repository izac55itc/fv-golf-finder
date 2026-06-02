'use strict'
const fs   = require('fs')
const path = require('path')
const golfnow = require('./golfnow')

const DAYS_AHEAD = 7

async function main() {
  const today = new Date()
  console.log(`\nFV Golf Finder scraper — ${today.toISOString().split('T')[0]} (${DAYS_AHEAD} days)\n`)

  // Build list of dates to scrape
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
            id:       `gn-${courseId}-${dateStr}-${seq++}`,
            courseId,
            time:     isoTime,
            greenfee: raw.greenfee,
            spaces:   raw.spaces,
            source:   'golfnow',
          })
        }
      }
    }
  } finally {
    golfnow.closeBrowser().catch(() => {})
  }

  const output = {
    generatedAt: new Date().toISOString(),
    dates,
    count: allTeetimes.length,
    teetimes: allTeetimes,
  }

  const outPath = path.join(__dirname, 'teetimes.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\n✓ Wrote ${allTeetimes.length} tee times across ${dates.length} days → teetimes.json\n`)

  process.kill(process.pid, 'SIGTERM')
}

function parseTime(raw, dateStr) {
  if (!raw) return null
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let h = parseInt(ampm[1], 10)
    const m = parseInt(ampm[2], 10)
    if (ampm[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (ampm[3].toUpperCase() === 'AM' && h === 12) h = 0
    return `${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`
  }
  if (/^\d{1,2}:\d{2}$/.test(raw)) return `${dateStr}T${raw.padStart(5,'0')}:00`
  const n = Number(raw)
  if (!isNaN(n) && n > 0) return new Date(n > 1e10 ? n : n * 1000).toISOString()
  return null
}

// Hard timeout: 8 minutes for 7 days of scraping
setTimeout(() => {
  console.error('Hard timeout: force killing process')
  process.kill(process.pid, 'SIGKILL')
}, 840_000)

main()
  .then(() => { process.exit(0) })
  .catch(err => { console.error('Fatal:', err.message); process.exit(1) })
