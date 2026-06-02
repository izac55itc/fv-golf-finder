'use strict'

const { chromium } = require('playwright')

const FACILITIES = {
  'fort-langley':   3524,
  'belmont':        358,
  'newlands-cc':    3525,
  'langley-centre': 6967,
  'swaneset-cc':    19887,
  'pitt-meadows':   15280,
  'meadow-gardens': 308,
  'ledgeview':      6384,
}

let _browser = null

async function getBrowser() {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }
  return _browser
}

async function closeBrowser() {
  if (_browser) { await _browser.close(); _browser = null }
}

// Scrape one facility — intercept GolfNow's own XHR calls and capture tee time JSON
async function scrapeFacility(facilityId, dateStr) {
  const browser = await getBrowser()
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    locale: 'en-CA',
  })
  const page = await ctx.newPage()
  const captured = []

  page.on('response', async (resp) => {
    const url  = resp.url()
    const ct   = resp.headers()['content-type'] || ''
    if (!ct.includes('json')) return
    if (!url.includes('golfnow') && !url.includes('gnsvc')) return
    try {
      const json = await resp.json()
      const hits = extractTeeTimes(json)
      if (hits.length) captured.push(...hits)
    } catch { /* ignore */ }
  })

  try {
    const url = `https://www.golfnow.com/tee-times/facility/${facilityId}/search?date=${dateStr}&holes=18&players=1&time=all`
    console.log(`[${facilityId}] Loading...`)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    console.log(`[${facilityId}] DOM loaded, waiting for XHR...`)
    await page.waitForTimeout(3_000)
    console.log(`[${facilityId}] Done, captured ${captured.length} so far`)
  } catch (err) {
    console.error(`[${facilityId}] Error: ${err.message}`)
    throw err
  } finally {
    await ctx.close()
  }

  return captured
}

let _normaliseLogged = false

// Walk common GolfNow response shapes looking for tee time objects
function extractTeeTimes(json) {
  const candidates = []

  const tryArray = (arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach(item => {
      const norm = normalise(item)
      if (norm) candidates.push(norm)
    })
  }

  tryArray(json?.teetimes)
  tryArray(json?.teeTimes)
  tryArray(json?.data?.teetimes)
  tryArray(json?.data?.teeTimes)
  tryArray(json?.results)
  if (Array.isArray(json)) tryArray(json)

  return candidates
}

function normalise(raw) {
  if (!raw) return null
  const time = raw.time ?? raw.teetime ?? raw.teeTime ?? raw.startTime ?? raw.displayTime
  if (!time) return null

  // GolfNow returns time as object with { formatted: "HH:MM", ... }
  let timeStr = String(time)
  if (typeof time === 'object' && time.formatted) {
    timeStr = time.formatted
  }

  // Log raw object keys on first tee time to see what properties are available
  if (!_normaliseLogged && raw) {
    console.log(`[normalise] Raw object keys: ${Object.keys(raw).join(', ')}`)
    _normaliseLogged = true
  }

  // Parse formattedPrice like "$99" → 99
  let greenfee = 0
  if (raw.formattedPrice) {
    const match = raw.formattedPrice.match(/\d+/)
    greenfee = match ? Number(match[0]) : 0
  }

  return {
    time:     timeStr,
    greenfee,
    spaces:   Number(raw.available ?? raw.spots ?? raw.openSpots ?? raw.maxPlayers ?? 4),
  }
}

// Scrape just Newlands CC for the POC
async function scrapeAll(dateStr) {
  const results = new Map()

  try {
    const tts = await scrapeFacility(FACILITIES['newlands-cc'], dateStr)
    results.set('newlands-cc', tts)
    console.log(`  newlands-cc: ${tts.length} tee times`)
  } catch (err) {
    console.error(`  newlands-cc failed: ${err.message}`)
    results.set('newlands-cc', [])
  }

  return results
}

module.exports = { scrapeAll, closeBrowser, FACILITIES }
