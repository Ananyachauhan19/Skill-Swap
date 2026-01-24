# ⚡ Quick Start - Career System (5 Minutes)

## Prerequisites ✅
- Backend running
- Frontend running
- Admin account logged in

## Step 1: Supabase Setup (2 minutes)

### Option A: Create New Project
1. Go to https://supabase.com
2. Click "New Project"
3. Name: "skillswap-resumes" (or anything)
4. Wait for project creation (~2 min)

### Option B: Use Existing Project
1. Open your Supabase dashboard
2. Select your project

### Create Storage Bucket
1. Click **Storage** in left sidebar
2. Click **New Bucket**
3. **Bucket name:** `job-resume` (exact name!)
4. **Public bucket:** ✅ YES (toggle ON)
5. Click **Create bucket**

### Get API Credentials
1. Click **Project Settings** (gear icon)
2. Click **API**
3. Copy these two values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public:** `eyJhbGci...` (long string)

## Step 2: Configure Frontend (1 minute)

Create file: `frontend/.env`

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJ...your-key-here
```

**Important:** Paste YOUR actual values from Step 1!

## Step 3: Restart Frontend (30 seconds)

```bash
# In frontend terminal
Ctrl + C  # Stop the server
npm run dev  # Restart
```

## Step 4: Test It! (90 seconds)

### Create Test Job
1. Go to: `http://localhost:5173/admin/career`
2. Click **"Add New Job"** (blue button)
3. Fill minimum required fields:
   ```
   Job Title: Test Engineer
   Job Type: Full-Time
   Location: Remote
   Short Description: This is a test job posting
   Description: Just testing the system
   Requirements: No requirements for testing
   ```
4. Click **"Create Job"**
5. ✅ Should see job in table

### View on User Page
1. Open new tab: `http://localhost:5173/career`
2. ✅ Should see your test job card

### Submit Test Application
1. Click **"Apply Now"** on the job card
2. Fill Step 1 (Basic Details):
   ```
   First Name: Test
   Last Name: User
   Email: test@example.com
   Phone: 1234567890
   Address: Test Address
   ```
3. Click **"Next"**

4. Fill Step 2 (Education):
   ```
   School Name: Test School
   School Marks: 85%
   
   Intermediate Name: Test College
   Intermediate Marks: 90%
   
   Graduation College: Test University
   Graduation Degree: B.Tech
   Graduation Marks: 8.5 CGPA
   ```
5. Click **"Next"**

6. Upload Resume:
   - Find ANY PDF file on your computer
   - Make sure it's less than 1MB
   - Click **"Choose File"**
   - Select your PDF
   - ✅ Should see green checkmark with filename

7. Click **"Submit Application"**
8. ✅ Should see "Application submitted successfully!"

### Verify in Admin
1. Go back to: `http://localhost:5173/admin/career`
2. Click **"Applications"** tab
3. ✅ Should see your test application
4. Click **"View Resume"**
5. ✅ PDF should open in new tab

---

## 🎉 If You See This, It's Working!

- ✅ Job created in admin
- ✅ Job visible on user page
- ✅ Application submitted
- ✅ Resume uploaded to Supabase
- ✅ Application visible in admin
- ✅ Resume link works

---

## 🚀 You're Ready!

Now you can:
- Create real job postings
- Accept actual applications
- Manage candidates
- Review resumes

---

## ❌ Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"
```bash
cd frontend
npm install
```

### Error: Resume upload fails
- Check .env file has correct Supabase URL and key
- Verify bucket name is exactly `job-resume`
- Ensure bucket is PUBLIC

### Error: Jobs don't appear on user page
- Make sure job status is "Active" (green with eye icon)
- Check that you're on the correct page: `/career`

### Error: Can't access /admin/career
- Ensure you're logged in as admin
- Clear browser cache and login again

---

## 📚 Full Docs

- **Setup Guide:** See `CAREER_SYSTEM_SETUP.md`
- **Testing Guide:** See `CAREER_TESTING_GUIDE.md`
- **Complete Overview:** See `README_CAREER_IMPLEMENTATION.md`

---

**Time to Complete:** 5 minutes  
**Difficulty:** ⭐⭐☆☆☆ (Easy)  
**Status:** Production Ready 🚀
