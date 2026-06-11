'use strict'
const ws = require('ws')
const { createClient } = require('@supabase/supabase-js')
const { fetchCloudPlaySummaries } = require('./cloudplay')
const { scrapeRedwoodsRates } = require('./redwoods')
const { fetchTeeOnSummaries } = require('./tee-on')
const { fetchChronogolfSummaries } = require('./chronogolf')

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
    const redwoodsSummaries = await scrapeRedwoodsRates(DAYS_AHEAD)
    allSummaries.push(...redwoodsSummaries)

    // Fetch Tee-On summaries (Poppy Estate, etc.)
    console.log('\nFetching Tee-On courses...')
    const teeOnSummaries = await fetchTeeOnSummaries()
    allSummaries.push(...teeOnSummaries)

    // Fetch Chronogolf summaries (GTC Westwood, etc.)
    console.log('\nFetching Chronogolf courses...')
    const chronogolfSummaries = await fetchChronogolfSummaries(DAYS_AHEAD)
    allSummaries.push(...chronogolfSummaries)

    console.log(`\n✓ Collected ${allSummaries.length} price summaries`)

    // Fallback: If a course has 0 results, use last known good data
    console.log('\nApplying fallback for courses with no data...')
    const courseIds = ['fort-langley', 'poppy-estate'] // Courses prone to scraping issues
    const summariesByDate = new Map()
    allSummaries.forEach(s => {
      const key = `${s.course_id}|${s.date}`
      summariesByDate.set(key, s)
    })

    for (const courseId of courseIds) {
      const courseSummaries = allSummaries.filter(s => s.course_id === courseId)
      if (courseSummaries.length === 0) {
        console.log(`  [${courseId}] No data found, fetching last known good pricing...`)
        const { data: lastData, error } = await supabase
          .from('price_summaries')
          .select('min_price, max_price, available_count, has_hot_deals')
          .eq('course_id', courseId)
          .order('date', { ascending: false })
          .limit(1)

        if (!error && lastData && lastData.length > 0) {
          const lastEntry = lastData[0]
          // Generate 7 days of data using last known prices
          for (let i = 0; i < DAYS_AHEAD; i++) {
            const d = new Date(pdtToday)
            d.setDate(d.getDate() + i)
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            allSummaries.push({
              course_id: courseId,
              date: dateStr,
              min_price: lastEntry.min_price,
              max_price: lastEntry.max_price,
              available_count: lastEntry.available_count,
              has_hot_deals: lastEntry.has_hot_deals,
            })
          }
          console.log(`  ✓ Using fallback: $${lastEntry.min_price}-$${lastEntry.max_price}`)
        }
      }
    }

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

// Hard timeout: 4 minutes
setTimeout(() => {
  console.error('Hard timeout: force killing process')
  process.kill(process.pid, 'SIGKILL')
}, 240_000)

main()
  .then(() => { process.exit(0) })
  .catch(err => { console.error('Fatal:', err.message); process.exit(1) })
