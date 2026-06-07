'use strict'

const { chromium } = require('playwright')

const FACILITIES = {
  'newlands-cc':            3525,
  'newlands-executive':     11039,
  'westfield':              6629,
  'eighteen-pastures':      3530,
  'golden-eagle-north':     3515,
  'golden-eagle-south':     15899,
}

let _browsers = []
const NUM_BROWSERS = 4
let _nextBrowserIdx = 0

async function initBrowserPool() {
  _browsers = await Promise.all(
    Array.from({ length: NUM_BROWSERS }, () =>
      chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      })
    )
  )
}

async function getBrowser() {
  if (!_browsers.length) await initBrowserPool()
  const browser = _browsers[_nextBrowserIdx]
  _nextBrowserIdx = (_nextBrowserIdx + 1) % NUM_BROWSERS
  return browser
}

async function closeBrowser() {
  await Promise.all(_browsers.map(b => b.close().catch(() => {})))
  _browsers = []
  _nextBrowserIdx = 0
}

async function scrapeFacility(facilityId, dateStr) {
  const TIMEOUT_MS = 60_000

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
    if (!url.includes('golfnow') && !url.includes('gnsvc') && !url.includes('teetime')) return
    try {
      const json = await resp.json()
      const hits = extractTeeTimes(json)
      if (hits.length) captured.push(...hits)
    } catch { /* ignore */ }
  })

  try {
    const url = `https://www.golfnow.com/tee-times/facility/${facilityId}/search?date=${dateStr}&holes=18&players=1&time=all`
    console.log(`[${facilityId}] Loading...`)

    await Promise.race([
      (async () => {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
        console.log(`[${facilityId}] DOM loaded, waiting for XHR...`)
        await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {})
        await page.waitForTimeout(2_000)
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timed out after ${TIMEOUT_MS / 1000}s`)), TIMEOUT_MS)
      ),
    ])

    console.log(`[${facilityId}] Done, captured ${captured.length} so far`)
  } catch (err) {
    console.error(`[${facilityId}] Error: ${err.message}`)
  } finally {
    try { await page.close() } catch { /* ignore */ }
    try { await ctx.close() } catch { /* ignore */ }
  }

  return captured
}

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
  tryArray(json?.SearchResults)
  tryArray(json?.searchResults)
  if (Array.isArray(json)) tryArray(json)

  if (json?.data && typeof json.data === 'object') {
    tryArray(json.data.results)
    tryArray(json.data.SearchResults)
  }

  return candidates
}

function normalise(raw) {
  if (!raw) return null
  const time = raw.time ?? raw.teetime ?? raw.teeTime ?? raw.startTime ?? raw.displayTime
  if (!time) return null

  // Skip unavailable slots
  if (raw.available === false) return null

  let timeStr

  if (typeof time === 'object') {
    if (time.formatted && time.formattedTimeMeridian) {
      timeStr = `${time.formatted} ${time.formattedTimeMeridian}`
    } else if (time.date) {
      timeStr = time.date
    } else if (time.formatted) {
      timeStr = time.formatted
    } else {
      timeStr = String(time)
    }
  } else {
    timeStr = String(time)
  }

  let greenfee = 0
  if (raw.formattedPrice) {
    const match = raw.formattedPrice.match(/\d+/)
    greenfee = match ? Number(match[0]) : 0
  }

  // rounds = actual player count available for this slot (1-4)
  const spaces = Number(raw.rounds ?? raw.spots ?? raw.openSpots ?? raw.maxPlayers ?? 4)

  return {
    time:       timeStr,
    greenfee,
    spaces,
    available:  raw.available,
    maxPlayers: raw.maxPlayers ?? spaces,
  }
}

async function scrapeAll(dateStr) {
  const results = new Map()
  const entries = Object.entries(FACILITIES)

  await Promise.all(
    entries.map(async ([courseId, facilityId]) => {
      try {
        const tts = await scrapeFacility(facilityId, dateStr)
        results.set(courseId, tts)
        console.log(`  ${courseId}: ${tts.length} tee times`)
      } catch (err) {
        console.error(`  ${courseId} failed: ${err.message}`)
        results.set(courseId, [])
      }
    })
  )

  return results
}

module.exports = { scrapeAll, closeBrowser, FACILITIES }
