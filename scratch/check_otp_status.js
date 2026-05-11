import { createClient } from '@supabase/supabase-client'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY 

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOTP() {
  console.log('Checking recent OTP requests...')
  
  const { data, error } = await supabase
    .from('otp_verifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) {
    console.error('Error fetching OTPs:', error)
  } else {
    console.log('Recent otp_verifications:', data)
  }
}

checkOTP()
