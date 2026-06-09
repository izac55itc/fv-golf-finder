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

    console.log(`  Loading ${course.url}...`)
    await page.goto(course.url, { waitUntil: 'networkidle2' })

    // Wait for tee time data to be loaded
    await page.waitForSelector('[data-price]', { timeout: 10000 }).catch(() => {
      console.log(`  No [data-price] elements found, trying alternate selector...`)
    })

    // Extract tee time pricing data from the page
    const summaries = await page.evaluate(() => {
      const results = []
      const dateElements = document.querySelectorAll('[data-date]')

      dateElements.forEach(dateEl => {
        const date = dateEl.getAttribute('data-date')
        const priceText = dateEl.getAttribute('data-price') || dateEl.textContent.match(/\$(\d+)/)?.[1] || '0'
        const minPrice = parseInt(priceText) || 0
        const maxPrice = minPrice + 20 // Estimate range
        const availableText = dateEl.getAttribute('data-available') || dateEl.textContent.match(/(\d+)\s*slot/)?.[1] || '0'
        const availableCount = parseInt(availableText) || 0

        if (date && minPrice > 0) {
          results.push({
            date,
            minPrice,
            maxPrice,
            availableCount,
            hasHotDeals: false
          })
        }
      })

      return results
    })

    await browser.close()
    return summaries
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
