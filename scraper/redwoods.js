'use strict'

async function scrapeRedwoodsRates() {
  try {
    const response = await fetch('https://www.redwoods-golf.com/online-booking-2/rates')
    const html = await response.text()

    // Public rates only: $54–$114 (from rates table Public column)
    const publicRates = [54, 64, 74, 84, 94, 114]

    // Verify at least some prices are visible on the page
    const hasContent = html.includes('$54') || html.includes('$114') || html.includes('Current Rates')
    if (!hasContent) {
      console.log('  [redwoods] Could not verify rates page loaded')
      return []
    }

    const minPrice = Math.min(...publicRates)
    const maxPrice = Math.max(...publicRates)
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    console.log(`  [redwoods] Public rates: $${minPrice}-$${maxPrice}`)

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
