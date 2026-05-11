import { createClient } from '@supabase/supabase-client'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY // Use service role for admin access

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLogs() {
  console.log('Checking recent email logs...')
  
  const { data: logs, error: logsError } = await supabase
    .from('email_usage_log')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(5)

  if (logsError) {
    console.error('Error fetching logs:', logsError)
  } else {
    console.log('Recent email_usage_log:', logs)
  }

  const { data: events, error: eventsError } = await supabase
    .from('platform_resend_email_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (eventsError) {
    console.error('Error fetching platform events:', eventsError)
  } else {
    console.log('Recent platform_resend_email_events:', events)
  }
}

checkLogs()
