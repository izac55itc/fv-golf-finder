'use strict'

const fs   = require('fs')
const path = require('path')
const golfnow = require('./golfnow')

async function main() {
  const dateStr = new Date().toISOString().split('T')[0]
  console.log(`\nFV Golf Finder scraper — ${dateStr}\n`)

  let teetimes = []
  let newlands = []

  try {
    // Scrape just Newlands CC for the POC
    console.log('Scraping Newlands CC...')
    const scraped = await golfnow.scrapeAll(dateStr)

    // Extract just Newlands data
    newlands = scraped.get('newlands-cc') || []
    console.log(`Found ${newlands.length} raw tee times from Newlands CC`)
    console.log(`Raw newlands data for inspection:`)
    console.log(JSON.stringify(newlands.slice(0, 3), null, 2))

    // Parse and flatten
    for (let seq = 1; seq <= newlands.length; seq++) {
      const raw = newlands[seq - 1]
      const isoTime = parseTime(raw.time, dateStr)
      if (!isoTime) {
        continue
      }
      // Skip tee times with no available spaces
      if (raw.spaces <= 0) {
        continue
      }
      teetimes.push({
        id:       `newlands-${seq}`,
        courseId: 'newlands-cc',
        time:     isoTime,
        greenfee: raw.greenfee,
        spaces:   raw.spaces,
        source:   'golfnow',
      })
    }
  } finally {
    await golfnow.closeBrowser()
  }

  const output = {
    generatedAt: new Date().toISOString(),
    date: dateStr,
    count: teetimes.length,
    rawDebug: newlands.slice(0, 5),  // Keep first 5 raw items for inspection
    teetimes,
  }

  const outPath = path.join(__dirname, 'teetimes.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2))
  console.log(`\n✓ Wrote ${teetimes.length} tee times → teetimes.json\n`)
}

function parseTime(raw, dateStr) {
  if (!raw) return null

  // ISO format — pass through
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) return raw

  // "7:30 AM" / "7:30 PM"
  const ampm = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (ampm) {
    let h = parseInt(ampm[1], 10)
    const m = parseInt(ampm[2], 10)
    if (ampm[3].toUpperCase() === 'PM' && h !== 12) h += 12
    if (ampm[3].toUpperCase() === 'AM' && h === 12) h = 0
    return `${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00`
  }

  // "07:30" (24h)
  if (/^\d{1,2}:\d{2}$/.test(raw)) return `${dateStr}T${raw.padStart(5,'0')}:00`

  // Unix timestamp (ms or seconds)
  const n = Number(raw)
  if (!isNaN(n) && n > 0) return new Date(n > 1e10 ? n : n * 1000).toISOString()

  return null
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
