'use strict'
const Tesseract = require('tesseract.js')

async function extractTeeTimesFromScreenshot(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng')
    return text
  } catch (err) {
    console.error(`OCR Error: ${err.message}`)
    return ''
  }
}

function parseTeeTimes(ocrText) {
  const prices = []

  // Look for patterns like "6:30 AM" and "$61.90"
  const timePattern = /(\d{1,2}):(\d{2})\s*(AM|PM)/gi
  const pricePattern = /\$(\d+\.?\d{0,2})/g

  let match
  while ((match = pricePattern.exec(ocrText)) !== null) {
    const price = parseFloat(match[1])
    if (price > 10 && price < 500) {
      prices.push(price)
    }
  }

  return {
    teeTimes: (ocrText.match(timePattern) || []).length,
    prices: [...new Set(prices)],
    minPrice: prices.length > 0 ? Math.min(...prices) : 0,
    maxPrice: prices.length > 0 ? Math.max(...prices) : 0,
  }
}

module.exports = { extractTeeTimesFromScreenshot, parseTeeTimes }
