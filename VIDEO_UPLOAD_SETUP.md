# Video Upload System - Supabase Setup Guide

## Overview
The video upload system stores video files and thumbnails in Supabase Storage while keeping metadata in MongoDB Atlas. This hybrid approach provides:
- Scalable file storage with Supabase
- Flexible metadata management with MongoDB
- Efficient queries and relationships

## Supabase Configuration

### 1. Create a Supabase Bucket

1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**
4. Name the bucket: `videos`
5. Set bucket to **Public** (so video URLs are publicly accessible)
6. Click **Create bucket**

### 2. Set Up Storage Policies

After creating the bucket, you need to set up proper access policies:

#### Allow Public Read Access
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'videos' );
```

#### Allow Authenticated Users to Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);
```

#### Allow Users to Delete Their Own Files
```sql
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Environment Variables

Add these to your `.env` file in the backend directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_KEY=your_anon_public_key

# MongoDB Configuration (existing)
MONGO_URI=your_mongodb_connection_string
```

**Finding your Supabase credentials:**
1. Go to your Supabase project
2. Click **Settings** > **API**
3. Copy the **Project URL** for `SUPABASE_URL`
4. Copy the **service_role** key for `SUPABASE_SERVICE_ROLE_KEY`
5. Copy the **anon public** key for `SUPABASE_KEY`

## File Structure

```
videos/
├── videos/           # Video files
│   └── userId_timestamp.mp4
└── thumbnails/       # Thumbnail images
    └── userId_timestamp.jpg
```

## API Endpoints

### Upload Video
```
POST /api/videos/upload
Content-Type: multipart/form-data

Fields:
- title: string (required)
- description: string (required)
- video: file (required, max 100MB)
- thumbnail: file (required)
- isDraft: boolean (optional, default: false)
```

### Get User's Videos
```
GET /api/videos
Authorization: Required

Query params:
- status: 'all' | 'draft' | 'published' | 'archived'
```

### Get Public Videos for a User
```
GET /api/videos/user/:userId
Authorization: Not required
```

### Get Single Video
```
GET /api/videos/:id
Authorization: Not required
```

### Update Video
```
PUT /api/videos/:id
Content-Type: multipart/form-data
Authorization: Required

Fields (all optional):
- title: string
- description: string
- video: file
- thumbnail: file
- isDraft: boolean
```

### Delete Video
```
DELETE /api/videos/:id
Authorization: Required
```

### Archive Video
```
POST /api/videos/:id/archive
Authorization: Required
```

### Like/Unlike Video
```
POST /api/videos/:id/like
Authorization: Required
```

### Dislike/Undislike Video
```
POST /api/videos/:id/dislike
Authorization: Required
```

## MongoDB Schema

```javascript
{
  userId: ObjectId,          // Reference to User
  title: String,             // Video title
  description: String,       // Video description
  videoUrl: String,          // Supabase public URL
  thumbnailUrl: String,      // Supabase public URL
  videoPath: String,         // Supabase storage path
  thumbnailPath: String,     // Supabase storage path
  duration: Number,          // In seconds
  views: Number,             // View count
  likes: [ObjectId],         // Array of user IDs who liked
  dislikes: [ObjectId],      // Array of user IDs who disliked
  isDraft: Boolean,          // Draft status
  isArchived: Boolean,       // Archived status
  isLive: Boolean,           // Live streaming flag
  scheduledTime: Date,       // Scheduled publish time
  uploadDate: Date,          // Upload timestamp
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

## Frontend Integration

### Private Profile (Upload)
Location: `frontend/src/user/privateProfile/Videos.jsx`

Features:
- Upload video with thumbnail
- Edit video metadata
- Delete videos
- Archive videos
- Save as draft
- View upload history

### Public Profile (View)
Location: `frontend/src/user/publicProfile/PublicVideos.jsx`

Features:
- View published videos
- Like/dislike videos
- Share video links
- Report videos

## Storage Limits

### Supabase Free Tier
- 1 GB storage
- 2 GB bandwidth per month
- 50 MB max file upload size (can be increased in paid plans)

### Current Configuration
- Max video file size: 100 MB
- Max thumbnail size: Inherited from multer default
- Supported video formats: All standard video/* MIME types
- Supported image formats: All standard image/* MIME types

## Security Considerations

1. **Authentication**: All upload/edit/delete operations require authentication
2. **Authorization**: Users can only modify their own videos
3. **File Validation**: Server validates file types before upload
4. **Public Access**: Video URLs are public to allow sharing, but edit/delete is protected
5. **Service Role Key**: Use SUPABASE_SERVICE_ROLE_KEY for server-side operations (bypasses RLS)

## Troubleshooting

### Videos not uploading
1. Check Supabase bucket is created and set to public
2. Verify environment variables are set correctly
3. Check file size limits (100MB max)
4. Ensure bucket policies allow authenticated uploads

### Videos not visible on public profile
1. Verify video is not marked as draft (`isDraft: false`)
2. Verify video is not archived (`isArchived: false`)
3. Check userId matches in the URL
4. Ensure video was uploaded successfully to Supabase

### CORS errors
1. Add your frontend URL to Supabase allowed origins
2. Go to Settings > API > CORS in Supabase dashboard
3. Add your frontend URL (e.g., http://localhost:5173)

### Storage quota exceeded
1. Delete unused videos from Supabase Storage
2. Upgrade to paid plan if needed
3. Implement video compression before upload

## Testing

### Test Video Upload
```bash
# Using curl
curl -X POST http://localhost:5000/api/videos/upload \
  -H "Cookie: your-session-cookie" \
  -F "title=Test Video" \
  -F "description=Test Description" \
  -F "video=@/path/to/video.mp4" \
  -F "thumbnail=@/path/to/thumbnail.jpg"
```

### Test Video Retrieval
```bash
# Get user's videos
curl http://localhost:5000/api/videos \
  -H "Cookie: your-session-cookie"

# Get public videos
curl http://localhost:5000/api/videos/user/USER_ID
```

## Future Enhancements

- [ ] Video transcoding for multiple qualities
- [ ] Progress bar for upload
- [ ] Video preview before upload
- [ ] Batch upload support
- [ ] Video analytics (watch time, completion rate)
- [ ] Comments and discussions
- [ ] Playlist creation
- [ ] Video recommendations
- [ ] HLS streaming for large videos
- [ ] Automatic thumbnail generation from video

## Support

For issues or questions:
1. Check Supabase logs in dashboard
2. Check backend console for errors
3. Verify MongoDB connection
4. Review browser console for frontend errors
