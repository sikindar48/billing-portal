# OAuth Network Access Fix

## Issue: redirect_uri_mismatch Error

You're getting this error because you're accessing the app via your network IP (`192.168.2.1:8080`) but Google Cloud Console only has `localhost:8080` configured.

## Quick Fix Options

### Option 1: Access via localhost (Recommended)

Instead of `http://192.168.2.1:8080`, use:

```
http://localhost:8080
```

### Option 2: Add Network IP to Google Cloud Console

Add this URI to your Google Cloud Console:

```
http://192.168.2.1:8080/gmail-callback
```

### Option 3: Add All Local Network IPs

Add these common network URIs:

```
http://192.168.1.1:8080/gmail-callback
http://192.168.2.1:8080/gmail-callback
http://10.0.0.1:8080/gmail-callback
```

## Current Google Cloud Console Setup Should Include:

```
http://localhost:8080/gmail-callback
http://localhost:8080/branding
http://192.168.2.1:8080/gmail-callback  (ADD THIS)
https://www.invoiceport.live/gmail-callback
https://invoiceport.live/gmail-callback
```

## Test Steps:

1. Add the network IP to Google Cloud Console
2. Wait 5-10 minutes for propagation
3. Try Gmail OAuth again from `http://192.168.2.1:8080`

OR

1. Access your app via `http://localhost:8080` instead
2. Gmail OAuth should work immediately
