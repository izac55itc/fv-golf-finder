'use strict'
const fs   = require('fs')
const path = require('path')
const golfnow = require('./golfnow')

async function main() {
  const dateStr = new Date().toISOString().split('T')[0]
  console.log(`\nFV Golf Finder scraper — ${dateStr}\n`)

  let teetimes = []

  try {
    console.log('Scraping all GolfNow facilities...')
    const scraped = await golfnow.scrapeAll(dateStr)

    // Process all courses
    for (const [courseId, rawList] of scraped) {
      let seq = 1
      for (const raw of rawList) {
        const isoTime = parseTime(raw.time, dateStr)
        if (!isoTime) continue
        if (raw.spaces <= 0) continue
        teetimes.push({
          id:       `gn-${courseId}-${seq++}`,
          courseId,
          time:     isoTime,
          greenfee: raw.greenfee,
          spaces:   raw.spaces,
          source:   'golfnow',
        })
      }
    }
  } finally {
    await golfnow.closeBrowser()
  }

  const output = {
    generatedAt: new Date().toISOString(),
    date: dateStr,
    count: teetimes.length,
    teetimes,
  }

  const outPath = path.join(__dirname, 'teetimes.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\n✓ Wrote ${teetimes.length} tee times → teetimes.json\n`)

  process.exit(0)
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

// Hard timeout: after 90 seconds, force kill the entire process with SIGKILL
setTimeout(() => {
  console.error('Hard timeout: force killing process')
  process.kill(process.pid, 'SIGKILL')
}, 90_000)

main()
  .then(() => { process.exit(0) })
  .catch(err => { console.error('Fatal:', err.message); process.exit(1) })
