# Supabase Storage Bucket Setup Guide

## Issue: "Failed to upload logo. Check if the 'icon' bucket exists"

This error occurs when the required storage bucket doesn't exist in your Supabase project. Here's how to fix it:

## Option 1: Create Bucket Manually (Recommended)

### Step 1: Access Supabase Storage

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. You'll see the Storage overview page

### Step 2: Create the "icon" Bucket

1. Click **"New bucket"** button
2. Fill in the bucket details:
   - **Name**: `icon`
   - **Public bucket**: ✅ **Enable** (checked)
   - **File size limit**: `1 MB` (1048576 bytes)
   - **Allowed MIME types**:
     ```
     image/png
     image/jpeg
     image/jpg
     image/webp
     ```

### Step 3: Set Bucket Policies

After creating the bucket, you need to set up policies for public access:

1. Go to **Storage** → **Policies**
2. Click **"New Policy"** for the `icon` bucket
3. Create these policies:

#### Policy 1: Public Read Access

```sql
-- Allow public read access to icon bucket
CREATE POLICY "Public read access for icon bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'icon');
```

#### Policy 2: Authenticated Upload Access

```sql
-- Allow authenticated users to upload to icon bucket
CREATE POLICY "Authenticated users can upload to icon bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'icon'
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Users can update their own files

```sql
-- Allow users to update their own uploaded files
CREATE POLICY "Users can update their own files in icon bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'icon'
  AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'icon'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Option 2: Alternative Bucket Names

If you can't create the "icon" bucket, the code will automatically try these alternatives:

- `logos`
- `images`
- `uploads`

Create any of these buckets with the same settings as above.

## Option 3: SQL Commands (Advanced)

If you prefer using SQL, run these commands in the Supabase SQL Editor:

```sql
-- Create the icon bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'icon',
  'icon',
  true,
  1048576,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
);

-- Create policies
CREATE POLICY "Public read access for icon bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'icon');

CREATE POLICY "Authenticated users can upload to icon bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'icon'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own files in icon bucket" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'icon'
  AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'icon'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

## Verification

After setting up the bucket:

1. Go to **Storage** → **icon** bucket
2. Try uploading a test image
3. Verify you can see the uploaded file
4. Test the logo upload in your application

## Troubleshooting

### Error: "Permission denied"

- Check that the bucket policies are correctly set up
- Ensure the user is authenticated when uploading

### Error: "File too large"

- Check the file size limit in bucket settings
- Ensure images are under 200KB as required by the app

### Error: "Invalid MIME type"

- Ensure only PNG, JPG, JPEG, or WebP files are uploaded
- Check the allowed MIME types in bucket settings

## Code Features Added

The updated logo upload code now:

- ✅ Automatically tries to create the bucket if it doesn't exist
- ✅ Falls back to alternative bucket names (`logos`, `images`, `uploads`)
- ✅ Provides detailed error messages for different failure scenarios
- ✅ Better error handling for permissions and file size issues
- ✅ Console logging for debugging bucket creation attempts

After following this guide, logo uploads should work properly in your branding settings page.
