'use strict'
const ws = require('ws')
const { createClient } = require('@supabase/supabase-js')

const FACILITIES = {
  'newlands-cc':            3525,
  'newlands-executive':     11039,
  'westfield':              6629,
  'eighteen-pastures':      3530,
  'golden-eagle-north':     3515,
  'golden-eagle-south':     15899,
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

  const today = new Date()
  console.log(`\nFV Golf Finder price summaries scraper — ${today.toISOString().split('T')[0]} (${DAYS_AHEAD} days)\n`)

  // Generate date range
  const dates = []
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  const allSummaries = []

  try {
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
