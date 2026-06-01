'use strict'

const { chromium } = require('playwright')

// ChronoGolf courses in Fraser Valley
const COURSES = {
  'redwoods': 'https://www.redwoods-golf.com/book-tee-time',
  // Add more ChronoGolf courses as discovered
}

async function scrapeCourse(courseUrl, dateStr) {
  let browser
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    })
    const page = await ctx.newPage()
    const captured = []

    page.on('response', async (resp) => {
      const url = resp.url()
      const ct = resp.headers()['content-type'] || ''
      if (!ct.includes('json')) return
      if (!url.includes('chrono') && !url.includes('availability')) return
      try {
        const json = await resp.json()
        const hits = extractTeeTimes(json)
        if (hits.length) captured.push(...hits)
      } catch { /* ignore */ }
    })

    console.log(`[chronogolf] Loading ${courseUrl}...`)
    await page.goto(courseUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 })
    console.log(`[chronogolf] Waiting for API calls...`)
    await page.waitForTimeout(3_000)

    await ctx.close()
    return captured
  } catch (err) {
    console.error(`[chronogolf] Error: ${err.message}`)
    return []
  } finally {
    if (browser) await browser.close()
  }
}

function extractTeeTimes(json) {
  const candidates = []

  // Try common ChronoGolf response shapes
  const tryArray = (arr) => {
    if (!Array.isArray(arr)) return
    arr.forEach(item => {
      const norm = normalise(item)
      if (norm) candidates.push(norm)
    })
  }

  tryArray(json?.availableSlots)
  tryArray(json?.teetimes)
  tryArray(json?.slots)
  tryArray(json?.data?.availableSlots)
  if (Array.isArray(json)) tryArray(json)

  return candidates
}

function normalise(raw) {
  if (!raw) return null
  const time = raw.time ?? raw.teetime ?? raw.slotTime ?? raw.startTime
  if (!time) return null

  return {
    time: String(time),
    greenfee: Number(raw.price ?? raw.greenFee ?? raw.rate ?? 0),
    spaces: Number(raw.spots ?? raw.available ?? 4),
  }
}

async function scrapeAll(dateStr) {
  const results = new Map()

  for (const [courseId, url] of Object.entries(COURSES)) {
    try {
      const tts = await scrapeCourse(url, dateStr)
      results.set(courseId, tts)
      console.log(`  ${courseId}: ${tts.length} tee times`)
    } catch (err) {
      console.error(`  ${courseId} failed: ${err.message}`)
      results.set(courseId, [])
    }
  }

  return results
}

async function closeBrowser() {
  // chromium instances are closed after each course scrape
}

module.exports = { scrapeAll, closeBrowser, COURSES }
