'use strict'
const ws = require('ws')
const { createClient } = require('@supabase/supabase-js')
const { fetchCloudPlaySummaries } = require('./cloudplay')
const { scrapeRedwoodsRates } = require('./redwoods')

const FACILITIES = {
  'newlands-cc':            3525,
  'newlands-executive':     11039,
  'westfield':              6629,
  'eighteen-pastures':      3530,
  'golden-eagle-north':     3515,
  'golden-eagle-south':     15899,
  'belmont':                358,
  'swaneset-links':         301,
  'swaneset-resort':        19887,
}

const DAYS_AHEAD = 7

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: { transport: ws }
  })

  // Get today's date in PDT (not UTC, which GitHub Actions uses)
  const now = new Date()
  const pdtToday = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  const today = new Date(pdtToday)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  console.log(`\nFV Golf Finder price summaries scraper — ${todayStr} (${DAYS_AHEAD} days)\n`)

  // Generate date range in PDT
  const dates = []
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(pdtToday)
    d.setDate(d.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dates.push(dateStr)
  }

  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  const allSummaries = []

  try {
    // Fetch GolfNow summaries
    for (const [courseId, facilityId] of Object.entries(FACILITIES)) {
      console.log(`[${courseId}] Fetching ${startDate} to ${endDate}...`)

      const url = `https://www.golfnow.com/api/tee-times/tee-times/facility/${facilityId}/summaries/from/${startDate}/to/${endDate}`

      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`${res.status}`)

        const data = await res.json()

        data.forEach(item => {
          const minVal = item.minPrice?.value || 0
          const maxVal = item.maxPrice?.value || 0
          allSummaries.push({
            course_id: courseId,
            date: item.playDateUtc.split('T')[0],
            min_price: Math.round(parseFloat(minVal)),
            max_price: Math.round(parseFloat(maxVal)),
            available_count: item.numberOfTeeTimesAvailable || 0,
            has_hot_deals: item.areHotDealsAvailable || false,
          })
        })

        console.log(`  ✓ ${data.length} dates fetched`)
      } catch (err) {
        console.error(`  ✗ Error: ${err.message}`)
      }
    }

    // Fetch CloudPlay summaries (Fort Langley, etc.)
    console.log('\nFetching CloudPlay courses...')
    const cloudplaySummaries = await fetchCloudPlaySummaries(DAYS_AHEAD)
    allSummaries.push(...cloudplaySummaries)

    // Fetch Redwoods rates (static table)
    console.log('\nFetching Redwoods rates...')
    const redwoodsSummaries = await scrapeRedwoodsRates()
    allSummaries.push(...redwoodsSummaries)

    console.log(`\n✓ Collected ${allSummaries.length} price summaries`)

    // Delete old summaries and upsert new ones
    const { error: deleteErr } = await supabase
      .from('price_summaries')
      .delete()
      .not('id', 'is', null)

    if (deleteErr) {
      console.error('Error deleting old summaries:', deleteErr.message)
    } else {
      console.log('✓ Deleted old summaries')
    }

    // Insert new summaries
    const { data, error } = await supabase
      .from('price_summaries')
      .insert(allSummaries)

    if (error) {
      console.error('Error inserting summaries:', error.message)
      process.exit(1)
    }

    console.log(`✓ Upserted ${allSummaries.length} price summaries → Supabase\n`)
  } catch (err) {
    console.error('Fatal error:', err.message)
    process.exit(1)
  }
}

// Hard timeout: 2 minutes
setTimeout(() => {
  console.error('Hard timeout: force killing process')
  process.kill(process.pid, 'SIGKILL')
}, 120_000)

main()
  .then(() => { process.exit(0) })
  .catch(err => { console.error('Fatal:', err.message); process.exit(1) })
