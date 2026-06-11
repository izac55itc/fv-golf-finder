'use strict'
const puppeteer = require('puppeteer')

const CHRONOGOLF_COURSES = {
  'gtc-westwood': {
    url: 'https://www.chronogolf.com/club/westwood-plateau-executive-12-hole-course/teetimes',
    id: 'gtc-westwood',
  }
}

function getDateString(daysFromNow) {
  // Get today's date in PDT (not UTC)
  const now = new Date()
  const pdtToday = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  const d = new Date(pdtToday)
  d.setDate(d.getDate() + daysFromNow)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

function getChronogolfDate(daysFromNow) {
  // Format for Chronogolf URL: YYYY-MM-DD
  return getDateString(daysFromNow)
}

async function extractPriceData(page) {
  const priceData = await page.evaluate(() => {
    const prices = []

    // Look for price patterns in page text (e.g., "$45", "$55.99")
    const pageText = document.body.innerText || ''
    const matches = pageText.match(/\$(\d+(?:\.\d{2})?)/g) || []

    matches.forEach(priceStr => {
      const price = parseFloat(priceStr.replace('$', ''))
      if (price > 20 && price < 200) prices.push(price)
    })

    // Also look in tee time elements
    const slots = document.querySelectorAll('[class*="tee"], [class*="slot"], button[class*="time"]')
    slots.forEach(slot => {
      const text = slot.textContent || ''
      const match = text.match(/\$(\d+(?:\.\d{2})?)/g)
      if (match) {
        match.forEach(priceStr => {
          const price = parseFloat(priceStr.replace('$', ''))
          if (price > 20 && price < 200) prices.push(price)
        })
      }
    })

    return {
      prices: [...new Set(prices)],
      slotCount: slots.length,
      pageLoaded: pageText.includes('$') && pageText.length > 200
    }
  })

  return priceData
}

async function scrapeChronogolfCourse(courseId, course, daysAhead = 7) {
  let browser
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setDefaultNavigationTimeout(30000)
    await page.setDefaultTimeout(30000)

    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    const results = []

    // Scrape each day by modifying URL date parameter
    for (let dayOffset = 0; dayOffset < daysAhead; dayOffset++) {
      const dateStr = getDateString(dayOffset)
      const chronogolfDate = getChronogolfDate(dayOffset)
      const url = `${course.url}?date=${chronogolfDate}`

      console.log(`      [Day ${dayOffset + 1}/${daysAhead}] Loading ${dateStr}...`)

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

        // Ensure only "Fine Course" is selected, uncheck others
        try {
          await page.evaluate(() => {
            const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'))
            checkboxes.forEach(cb => {
              const label = cb.closest('label')?.textContent || ''
              if (label.includes('Fine Course')) {
                cb.checked = true
              } else if (label.includes('Green Room') || label.includes('Tee Room')) {
                cb.checked = false
              }
            })
            // Trigger change events if needed
            checkboxes.forEach(cb => cb.dispatchEvent(new Event('change', { bubbles: true })))
          })
          await new Promise(resolve => setTimeout(resolve, 1500))
        } catch (err) {
          // Checkbox filtering might not be available
        }

        // Wait for content to load
        try {
          await page.waitForFunction(
            () => {
              const text = document.body.innerText
              return text.includes('$') && text.length > 200
            },
            { timeout: 10000 }
          )
        } catch (err) {
          // Try scrolling to trigger lazy loading
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight)
          })
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        const priceData = await extractPriceData(page)

        let minPrice = 0
        let maxPrice = 0
        let availableCount = 0

        if (priceData.prices.length > 0) {
          minPrice = Math.min(...priceData.prices)
          maxPrice = Math.max(...priceData.prices)
          availableCount = priceData.slotCount || priceData.prices.length
        }

        if (minPrice > 0) {
          // For GTC Westwood: use lowest price only (ignore higher prices from other courses)
          results.push({
            date: dateStr,
            minPrice,
            maxPrice: minPrice, // Use minimum as both min and max
            availableCount,
            hasHotDeals: false
          })
          console.log(`        ✓ Found lowest price: $${minPrice.toFixed(2)}`)
        } else {
          console.log(`        ✗ No prices found`)
        }
      } catch (err) {
        console.log(`        ✗ Error loading ${dateStr}: ${err.message}`)
      }
    }

    await browser.close()
    return results
  } catch (err) {
    if (browser) await browser.close()
    console.log(`      ✗ Error: ${err.message}`)
    return []
  }
}

async function fetchChronogolfSummaries(daysAhead = 7) {
  const allSummaries = []

  for (const [courseId, courseConfig] of Object.entries(CHRONOGOLF_COURSES)) {
    console.log(`[${courseId}] Scraping Chronogolf data...`)

    try {
      const summaries = await scrapeChronogolfCourse(courseId, courseConfig, daysAhead)

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

module.exports = { fetchChronogolfSummaries }
