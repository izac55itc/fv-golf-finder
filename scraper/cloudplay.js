'use strict'
const puppeteer = require('puppeteer')

const CLOUDPLAY_COURSES = {
  'fort-langley': {
    url: 'https://fortlangley.cps.golf/onlineresweb/search-teetime',
    id: 'fort-langley',
    multiDay: true
  },
  'redwoods': {
    url: 'https://www.redwoods-golf.com/online-booking',
    id: 'redwoods',
    multiDay: false  // Only scrape today until we figure out date navigation
  }
}

function getDateString(daysFromNow) {
  // Get today's date in PDT (not UTC, which GitHub Actions uses)
  const now = new Date()
  const pdtToday = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  const d = new Date(pdtToday)
  d.setDate(d.getDate() + daysFromNow)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function extractPriceData(page) {
  const priceData = await page.evaluate(() => {
    const prices = []

    // Look for tee time buttons/slots
    const slots = document.querySelectorAll('button, div[class*="slot"], div[class*="time"]')

    // Try to extract prices from visible slots
    slots.forEach(slot => {
      const text = slot.textContent || slot.innerText || ''
      const match = text.match(/\$(\d+(?:\.\d{2})?)/g)
      if (match) {
        match.forEach(priceStr => {
          const price = parseFloat(priceStr.replace('$', ''))
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
        if (price > 0 && price < 500) prices.push(price)
      })
    }

    return {
      prices: [...new Set(prices.filter(p => p >= 15))],
      slotCount: slots.length,
      pageLoaded: document.body.textContent.length > 100
    }
  })

  return priceData
}

async function scrapeCloudPlayCourse(courseId, course, daysAhead = 7) {
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

    const results = []

    // Limit days based on course config (some courses we only scrape today until we solve date nav)
    const daysToScrape = course.multiDay ? daysAhead : 1

    // Scrape data (1 or 7 days depending on course)
    for (let dayOffset = 0; dayOffset < daysToScrape; dayOffset++) {
      const dateStr = getDateString(dayOffset)
      const targetDate = parseInt(dateStr.split('-')[2]) // Extract day (e.g., "09" → 9)

      console.log(`    [Day ${dayOffset + 1}/${daysToScrape}] Loading ${dateStr} (day ${targetDate})...`)

      try {
        // Load base page on first iteration
        if (dayOffset === 0) {
          await page.goto(course.url, { waitUntil: 'networkidle2', timeout: 30000 })

          // Close any popups/modals that might be blocking content
          try {
            await page.evaluate(() => {
              // Look for close buttons (X, close, dismiss, etc)
              const closeButtons = Array.from(document.querySelectorAll('button, [role="button"]'))
                .filter(b => b.textContent.includes('×') || b.textContent.includes('X') ||
                            b.getAttribute('aria-label')?.includes('close') ||
                            b.getAttribute('class')?.includes('close'))

              // Click the first close button found
              if (closeButtons.length > 0) {
                closeButtons[0].click()
              }
            })
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (err) {
            // Popup might not exist, that's ok
          }
        } else {
          // Navigate to next date (different methods for different courses)
          try {
            // Try Fort Langley method: click calendar date number
            let clicked = await page.evaluate((day) => {
              const allElements = document.querySelectorAll('*')
              for (let el of allElements) {
                if (el.textContent.trim() === String(day) &&
                    (el.tagName === 'TD' || el.tagName === 'BUTTON' ||
                     el.getAttribute('role') === 'button' ||
                     el.className.includes('date') || el.className.includes('day'))) {
                  el.click()
                  return true
                }
              }
              return false
            }, targetDate)

            // If that didn't work, try Redwoods method: click next arrow button (>)
            if (!clicked) {
              const nextArrowClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, [role="button"]'))
                const nextBtn = buttons.find(b => b.textContent.trim() === '>' || b.textContent.includes('next'))
                if (nextBtn) {
                  nextBtn.click()
                  return true
                }
                return false
              })
              clicked = nextArrowClicked
            }

            if (!clicked) {
              console.log(`      Could not navigate to date ${targetDate}, skipping day ${dayOffset + 1}`)
              continue
            }

            // Wait for page to update with new date's tee times
            await new Promise(resolve => setTimeout(resolve, 2500))
          } catch (err) {
            console.log(`      Error navigating to date ${targetDate}: ${err.message}`)
            continue
          }
        }

        // Wait for prices to load
        await page.waitForFunction(
          () => {
            const text = document.body.innerText
            return text.includes('$') && text.length > 500
          },
          { timeout: 10000 }
        ).catch(() => null)

        await new Promise(resolve => setTimeout(resolve, 1000))

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
          results.push({
            date: dateStr,
            minPrice,
            maxPrice,
            availableCount,
            hasHotDeals: false
          })
          console.log(`      ✓ Found prices: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`)
        }
      } catch (err) {
        console.log(`      ✗ Could not fetch ${dateStr}: ${err.message}`)
      }
    }

    await browser.close()
    return results
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
      const summaries = await scrapeCloudPlayCourse(courseId, courseConfig, daysAhead)

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
