'use strict'

async function scrapeRedwoodsRates() {
  try {
    // Public rates from Redwoods rates page: https://www.redwoods-golf.com/online-booking-2/rates
    // Monday-Thursday: $94, Friday-Sunday: $114, Pre-Twilight: $84, Twilight: $74
    // 2nd Twilight: $64, Sunset: $54, Junior: $54
    const publicRates = [54, 64, 74, 84, 94, 114]

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
