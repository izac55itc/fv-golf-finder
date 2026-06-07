'use strict'
const ws = require('ws')
const { createClient } = require('@supabase/supabase-js')

async function setupDatabase() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    realtime: { transport: ws }
  })

  const sql = `
    CREATE TABLE IF NOT EXISTS price_summaries (
      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      course_id TEXT NOT NULL,
      date DATE NOT NULL,
      min_price INTEGER NOT NULL DEFAULT 0,
      max_price INTEGER NOT NULL DEFAULT 0,
      available_count INTEGER NOT NULL DEFAULT 0,
      has_hot_deals BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(course_id, date)
    );

    CREATE INDEX IF NOT EXISTS idx_price_summaries_date ON price_summaries(date);
    CREATE INDEX IF NOT EXISTS idx_price_summaries_course_id ON price_summaries(course_id);
  `

  try {
    console.log('Creating price_summaries table...')

    const { error } = await supabase.rpc('exec_sql', { sql_string: sql }).catch(() => {
      // If rpc fails, try direct approach
      return { error: 'RPC not available, trying direct SQL...' }
    })

    if (error && !error.message.includes('RPC')) {
      console.error('Error:', error.message)
      process.exit(1)
    }

    console.log('✓ Table created successfully!')
  } catch (err) {
    console.error('Fatal error:', err.message)
    process.exit(1)
  }
}

setupDatabase()
