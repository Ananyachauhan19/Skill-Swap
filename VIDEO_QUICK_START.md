# Quick Start Guide - Video Upload Feature

## Setup Steps

### 1. Supabase Setup (Required)

1. **Create Storage Bucket**
   - Go to Supabase Dashboard → Storage
   - Create new bucket named `videos`
   - Set to **Public**

2. **Set Environment Variables**
   Add to `backend/.env`:
   ```env
   SUPABASE_URL=your_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Configure Bucket Policies** (Optional - improves security)
   Run these SQL commands in Supabase SQL Editor:
   ```sql
   -- Allow public read
   CREATE POLICY "Public Access"
   ON storage.objects FOR SELECT
   USING ( bucket_id = 'videos' );

   -- Allow authenticated upload
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   WITH CHECK (
     bucket_id = 'videos' 
     AND auth.role() = 'authenticated'
   );
   ```

### 2. Start the Application

```powershell
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 3. Test the Feature

1. **Login** to your account
2. **Navigate** to Profile → Videos section
3. **Click** "Upload Session" button
4. **Fill in** title and description
5. **Upload** video file (max 100MB) and thumbnail
6. **Click** "Upload" or "Save as Draft"
7. **View** your video in the list

### 4. View on Public Profile

1. Navigate to your public profile: `/public-profile/videos`
2. All published (non-draft) videos will be visible
3. Other users can see your videos at `/profile/username`

## Features Available

### Private Profile
- ✅ Upload videos with thumbnails
- ✅ Edit video metadata (title, description)
- ✅ Save as draft
- ✅ Delete videos
- ✅ Archive videos
- ✅ Share video links
- ✅ Filter by status (all/draft/published/archived)

### Public Profile
- ✅ View published videos
- ✅ Watch videos
- ✅ Like/dislike videos
- ✅ Share videos
- ✅ Report videos

## Storage Details

- **Video Files**: Stored in Supabase at `videos/videos/`
- **Thumbnails**: Stored in Supabase at `videos/thumbnails/`
- **Metadata**: Stored in MongoDB Atlas
- **Max File Size**: 100 MB
- **Supported Formats**: All standard video and image formats

## API Endpoints

All endpoints are prefixed with `/api/videos`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/upload` | Upload new video |
| GET | `/` | Get user's videos |
| GET | `/user/:userId` | Get public videos |
| GET | `/:id` | Get single video |
| PUT | `/:id` | Update video |
| DELETE | `/:id` | Delete video |
| POST | `/:id/archive` | Archive video |
| POST | `/:id/like` | Like video |
| POST | `/:id/dislike` | Dislike video |

## Troubleshooting

### Issue: "Failed to upload video"
**Solution**: Check Supabase bucket exists and environment variables are set

### Issue: Videos not showing on public profile
**Solution**: Ensure video is not marked as draft and is published

### Issue: "File too large" error
**Solution**: Video files must be under 100MB (can be increased in code)

### Issue: CORS errors
**Solution**: Add your frontend URL to Supabase CORS settings

## Next Steps

1. ✅ Setup complete - start uploading videos!
2. Consider adding video compression for larger files
3. Set up CDN for better video delivery
4. Implement video analytics
5. Add video thumbnails auto-generation

For detailed documentation, see `VIDEO_UPLOAD_SETUP.md`
