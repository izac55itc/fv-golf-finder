'use strict'

const fs   = require('fs')
const path = require('path')
const golfnow = require('./golfnow')
const chronogolf = require('./chronogolf')
const wcgolfgroup = require('./wcgolfgroup')

async function main() {
  const dateStr = new Date().toISOString().split('T')[0]
  console.log(`\nFV Golf Finder scraper — ${dateStr}\n`)

  let teetimes = []

  try {
    // Run all three scrapers in parallel, even if one fails
    console.log('Scraping all platforms in parallel...\n')
    const results = await Promise.allSettled([
      (async () => {
        console.log('▶ GolfNow')
        const scraped = await golfnow.scrapeAll(dateStr)
        console.log('✓ GolfNow done')
        return { scraped, source: 'golfnow' }
      })(),
      (async () => {
        console.log('▶ ChronoGolf')
        const scraped = await chronogolf.scrapeAll(dateStr)
        console.log('✓ ChronoGolf done')
        return { scraped, source: 'chronogolf' }
      })(),
      (async () => {
        console.log('▶ WCGolfGroup')
        const scraped = await wcgolfgroup.scrapeAll(dateStr)
        console.log('✓ WCGolfGroup done')
        return { scraped, source: 'wcgolfgroup' }
      })(),
    ])

    console.log()

    // Collect results from all that succeeded
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const { scraped, source } = result.value
        teetimes.push(...flatten(scraped, dateStr, source))
      } else {
        console.error(`✗ ${result.reason?.message || 'Unknown error'}`)
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
  console.log(`\nWrote ${teetimes.length} tee times → ${outPath}`)
}

function flatten(scraped, dateStr, source) {
  const out = []
  let seq = 1
  let parseFailures = 0

  for (const [courseId, rawList] of scraped) {
    for (const raw of rawList) {
      const isoTime = parseTime(raw.time, dateStr)
      if (!isoTime) {
        if (parseFailures === 0) console.log(`[${source}/${courseId}] Example unparsed time: ${raw.time}`)
        parseFailures++
        continue
      }
      out.push({
        id:        `${source.charAt(0)}-${courseId}-${seq++}`,
        courseId,
        time:      isoTime,
        greenfee:  raw.greenfee,
        spaces:    raw.spaces,
        source,
      })
    }
  }

  if (parseFailures > 0) console.log(`[${source}] ${parseFailures} times failed to parse`)
  return out
}

function parseTime(raw, dateStr) {
  if (!raw) return null
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

  // "07:30"
  if (/^\d{1,2}:\d{2}$/.test(raw)) return `${dateStr}T${raw.padStart(5,'0')}:00`

  // Unix timestamp
  const n = Number(raw)
  if (!isNaN(n)) return new Date(n > 1e10 ? n : n * 1000).toISOString()

  return null
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
