import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();

    console.log('=== Gmail Token Exchange Request ===');
    console.log('Code received:', code ? 'Yes' : 'No');
    console.log('Redirect URI:', redirect_uri);

    if (!code || !redirect_uri) {
      console.error('Missing parameters');
      return new Response(
        JSON.stringify({ 
          error: 'missing_params', 
          error_description: 'code and redirect_uri are required' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const clientId = Deno.env.get('GMAIL_CLIENT_ID');
    const clientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');

    console.log('Client ID configured:', clientId ? 'Yes' : 'No');
    console.log('Client Secret configured:', clientSecret ? 'Yes' : 'No');

    if (!clientId || !clientSecret) {
      console.error('Gmail credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'server_config_error', 
          error_description: 'Gmail credentials (GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET) not configured in Supabase secrets. Please set them using: supabase secrets set GMAIL_CLIENT_ID=xxx GMAIL_CLIENT_SECRET=xxx' 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Exchanging code with Google...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();
    console.log('Google response status:', tokenResponse.status);
    console.log('Google response:', tokenData);

    if (!tokenResponse.ok) {
      console.error('Google OAuth error:', tokenData);
      return new Response(
        JSON.stringify(tokenData),
        { status: tokenResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token exchange successful');
    return new Response(
      JSON.stringify(tokenData),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Exception in token exchange:', err);
    return new Response(
      JSON.stringify({ error: 'internal_error', error_description: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
