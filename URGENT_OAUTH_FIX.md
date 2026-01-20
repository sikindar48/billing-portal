# 🚨 URGENT: Gmail OAuth Fix Required

## The Problem

You're accessing from `http://192.168.2.1:8080` but Google Cloud Console only has `localhost:8080` configured.

## ⚡ IMMEDIATE ACTION REQUIRED

### Add These URIs to Google Cloud Console NOW:

```
http://192.168.2.1:8080/gmail-callback
http://192.168.2.1:8080/branding
```

## 📋 Step-by-Step Fix:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/apis/credentials
2. **Find your OAuth Client**: `22562132278-g25nrkac9nnp7omg16glcpuui9v6r7t4.apps.googleusercontent.com`
3. **Click Edit**
4. **In "Authorized redirect URIs" section, click "+ ADD URI"**
5. **Add**: `http://192.168.2.1:8080/gmail-callback`
6. **Click "+ ADD URI" again**
7. **Add**: `http://192.168.2.1:8080/branding`
8. **Click SAVE**
9. **Wait 5-10 minutes** for Google to propagate changes

## ✅ Your Complete URI List Should Be:

```
http://localhost:8080/gmail-callback
http://localhost:8080/branding
http://192.168.2.1:8080/gmail-callback  ← NEW
http://192.168.2.1:8080/branding        ← NEW
https://www.invoiceport.live/gmail-callback
https://invoiceport.live/gmail-callback
```

## 🔧 Code Changes Made:

✅ Updated OAuth services to use dynamic origin detection
✅ Will now work with both localhost and network IP

## 🧪 Test After Adding URIs:

1. Wait 5-10 minutes after saving
2. Refresh your browser page
3. Click "Connect Gmail"
4. Should work perfectly now!

## 🚀 Alternative Quick Test:

If you want to test immediately, access via: `http://localhost:8080/branding`
