'use strict'
const puppeteer = require('puppeteer')

const TEE_ON_COURSES = {
  'poppy-estate': {
    url: 'https://www.tee-on.com/PubGolf/servlet/com.teeon.teesheet.servlets.golfersection.WebBookingAllTimesLanding?CourseGroupID=11134&CourseCode=PEGC&LoginType=5&BackTarget=com.teeon.teesheet.servlets.golfersection.ComboLanding&Referrer=',
    id: 'poppy-estate',
  }
}

function getDateString(daysFromNow) {
  // Get today's date in PDT (not UTC)
  const now = new Date()
  const pdtToday = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  const d = new Date(pdtToday)
  d.setDate(d.getDate() + daysFromNow)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function extractPriceData(page) {
  const priceData = await page.evaluate(() => {
    const prices = []

    // Look for price patterns in page text (e.g., "$58.99", "$39.99")
    const pageText = document.body.innerText || ''
    const matches = pageText.match(/\$(\d+(?:\.\d{2})?)/g) || []

    matches.forEach(priceStr => {
      const price = parseFloat(priceStr.replace('$', ''))
      if (price > 20 && price < 200) prices.push(price)
    })

    // Also look in tee time slot elements
    const slots = document.querySelectorAll('[class*="slot"], [class*="time"], button[class*="tee"]')
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
      pageLoaded: pageText.length > 500
    }
  })

  return priceData
}

async function scrapeTeeOnCourse(courseId, course) {
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

    console.log(`    Loading ${courseId}...`)
    await page.goto(course.url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Wait for content to load
    try {
      await page.waitForFunction(
        () => {
          const text = document.body.innerText
          return text.includes('$') && text.length > 500
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

    const dateStr = getDateString(0)

    const result = minPrice > 0 ? [{
      date: dateStr,
      minPrice,
      maxPrice,
      availableCount,
      hasHotDeals: false
    }] : []

    if (minPrice > 0) {
      console.log(`      ✓ Found prices: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`)
    } else {
      console.log(`      ✗ No prices found`)
    }

    await browser.close()
    return result
  } catch (err) {
    if (browser) await browser.close()
    console.log(`      ✗ Error: ${err.message}`)
    return []
  }
}

async function fetchTeeOnSummaries() {
  const allSummaries = []

  for (const [courseId, courseConfig] of Object.entries(TEE_ON_COURSES)) {
    console.log(`[${courseId}] Scraping Tee-On data...`)

    try {
      const summaries = await scrapeTeeOnCourse(courseId, courseConfig)

      summaries.forEach(item => {
        allSummaries.push({
          course_id: courseId,
          date: item.date,
          min_price: Math.round(item.minPrice * 100) / 100,
          max_price: Math.round(item.maxPrice * 100) / 100,
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

module.exports = { fetchTeeOnSummaries }
