'use strict'

async function scrapeRedwoodsRates() {
  try {
    const response = await fetch('https://www.redwoods-golf.com/online-booking-2/rates')
    const html = await response.text()

    // Extract all dollar amounts from the rates page
    const priceMatches = html.match(/\$(\d+)/g) || []
    const prices = priceMatches
      .map(p => parseInt(p.replace('$', '')))
      .filter(p => p > 30 && p < 200)
      .filter((v, i, a) => a.indexOf(v) === i) // unique

    if (prices.length === 0) {
      console.log('  [redwoods] No prices found on rates page')
      return []
    }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    console.log(`  [redwoods] Found rates: $${minPrice}-$${maxPrice}`)

    // Return one entry per day (Redwoods doesn't have multi-day scraping)
    return [{
      course_id: 'redwoods',
      date: dateStr,
      min_price: minPrice,
      max_price: maxPrice,
      available_count: 7, // 7 tee time slots throughout the day
      has_hot_deals: false,
    }]
  } catch (err) {
    console.error(`  [redwoods] Error: ${err.message}`)
    return []
  }
}

module.exports = { scrapeRedwoodsRates }
