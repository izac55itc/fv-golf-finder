'use strict'
const puppeteer = require('puppeteer')

const CLOUDPLAY_COURSES = {
  'fort-langley': {
    url: 'https://fortlangley.cps.golf/onlineresweb/search-teetime',
    id: 'fort-langley'
  }
}

async function scrapeCloudPlayCourse(courseId, course) {
  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(30000)
    await page.setDefaultTimeout(30000)

    // Spoof user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Override webdriver property to hide headless detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      })
    })

    console.log(`  Loading ${course.url}...`)
    await page.goto(course.url, { waitUntil: 'networkidle2' })

    // Wait for prices to load (they're rendered by JavaScript after initial load)
    await page.waitForFunction(
      () => {
        const text = document.body.innerText
        return text.includes('$') && text.length > 500
      },
      { timeout: 15000 }
    ).catch(() => {
      console.log(`  Price data not found after wait, proceeding anyway...`)
    })

    // Give extra time for async rendering to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Extract price range for all available slots on the current date view
    const priceData = await page.evaluate(() => {
      const prices = []
      const allFoundPrices = [] // Debug: track all found prices

      // Look for tee time buttons/slots - CloudPlay typically uses divs or buttons for time slots
      const slots = document.querySelectorAll('button, div[class*="slot"], div[class*="time"]')

      // Try to extract prices from visible slots
      slots.forEach(slot => {
        const text = slot.textContent || slot.innerText || ''
        const match = text.match(/\$(\d+(?:\.\d{2})?)/g)
        if (match) {
          match.forEach(priceStr => {
            const price = parseFloat(priceStr.replace('$', ''))
            allFoundPrices.push(price)
            if (price > 0 && price < 500) prices.push(price)
          })
        }
      })

      // Fallback: extract all dollar amounts from page text
      if (prices.length === 0) {
        const pageText = document.body.innerText || ''
        const matches = pageText.match(/\$(\d+(?:\.\d{2})?)/g) || []
        matches.forEach(priceStr => {
          const price = parseFloat(priceStr.replace('$', ''))
          allFoundPrices.push(price)
          if (price > 0 && price < 500) prices.push(price)
        })
      }

      return {
        prices: [...new Set(prices.filter(p => p >= 15))],
        allFoundPrices: [...new Set(allFoundPrices)], // Debug: all prices found
        slotCount: slots.length,
        pageLoaded: document.body.textContent.length > 100
      }
    })


    // Calculate min/max from extracted prices
    let minPrice = 0
    let maxPrice = 0
    let availableCount = 0

    if (priceData.prices.length > 0) {
      minPrice = Math.min(...priceData.prices)
      maxPrice = Math.max(...priceData.prices)
      availableCount = priceData.slotCount || priceData.prices.length
    }

    console.log(`    Found ${priceData.prices.length} prices: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)} (${availableCount} slots)`)

    await browser.close()

    // Return summary for the current date (we can enhance this to scrape multiple dates)
    return [{
      date: new Date().toISOString().split('T')[0],
      minPrice,
      maxPrice,
      availableCount,
      hasHotDeals: false
    }]
  } catch (err) {
    if (browser) await browser.close()
    throw err
  }
}

async function fetchCloudPlaySummaries(daysAhead = 7) {
  const allSummaries = []

  for (const [courseId, courseConfig] of Object.entries(CLOUDPLAY_COURSES)) {
    console.log(`[${courseId}] Scraping CloudPlay data...`)

    try {
      const summaries = await scrapeCloudPlayCourse(courseId, courseConfig)

      summaries.forEach(item => {
        allSummaries.push({
          course_id: courseId,
          date: item.date,
          min_price: Math.round(item.minPrice),
          max_price: Math.round(item.maxPrice),
          available_count: item.availableCount,
          has_hot_deals: item.hasHotDeals,
        })
      })

      console.log(`  ✓ ${summaries.length} dates fetched`)
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`)
    }
  }

  return allSummaries
}

module.exports = { fetchCloudPlaySummaries }
