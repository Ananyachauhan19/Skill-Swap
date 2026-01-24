# Dynamic Career Management System - Complete Setup Guide

## Overview
This system allows the admin to dynamically create job postings from the admin panel. All job cards on the user Career page are fetched from the database - **no static content**.

## What Was Implemented

### Backend Components

1. **Models** (`backend/models/`)
   - `JobPosting.js` - Schema for job postings with fields:
     * jobTitle, jobType (Internship/Full-Time/Part-Time/Contract/Freelance)
     * shortDescription (max 200 chars for cards)
     * description, requirements
     * location, department, salary
     * releaseDate, expiryDate
     * isActive (for toggling visibility)
     * applicationCount (auto-incremented)
   
   - `JobApplication.js` - Schema for applications with:
     * Basic details: firstName, lastName, email, phone, address
     * Education: school, intermediate, graduation, optional post-graduation
     * resumeUrl (uploaded to Supabase)
     * status (pending/reviewed/shortlisted/rejected/accepted)

2. **Controller** (`backend/controllers/careerController.js`)
   - Admin functions:
     * createJobPosting - Create new jobs
     * getAllJobPostingsAdmin - Get all jobs (including inactive)
     * updateJobPosting - Edit existing jobs
     * deleteJobPosting - Remove jobs
     * toggleJobStatus - Activate/deactivate jobs
     * getJobApplications - View applications for a specific job
     * getAllApplications - View all applications
     * updateApplicationStatus - Change application status
     * getCareerStats - Dashboard statistics
   
   - Public functions:
     * getActiveJobPostings - Fetch only active jobs for users
     * getJobPostingById - View single job details
     * submitJobApplication - Submit application with resume

3. **Routes** (`backend/routes/careerRoutes.js`)
   - Public endpoints (no auth required):
     * GET `/api/career/public/jobs` - Fetch active jobs
     * GET `/api/career/public/jobs/:id` - Get job details
     * POST `/api/career/applications` - Submit application
   
   - Admin endpoints (requireAuth + requireAdmin):
     * POST `/api/career/admin/jobs` - Create job
     * GET `/api/career/admin/jobs` - Get all jobs
     * PUT `/api/career/admin/jobs/:id` - Update job
     * DELETE `/api/career/admin/jobs/:id` - Delete job
     * PATCH `/api/career/admin/jobs/:id/toggle` - Toggle status
     * GET `/api/career/admin/jobs/:id/applications` - Get job applications
     * GET `/api/career/admin/applications/all` - Get all applications
     * PATCH `/api/career/admin/applications/:id/status` - Update application status
     * GET `/api/career/admin/stats` - Get career statistics

4. **Server Integration** (`backend/server.js`)
   - Added: `app.use('/api/career', careerRoutes)`
   - Enhanced MongoDB connection error handling with ECONNRESET recovery

### Frontend Components

1. **Admin Panel** (`frontend/src/admin/AdminCareer.jsx`)
   - **Features:**
     * Stats dashboard: Total Jobs, Active Jobs, Total Applications, Pending Review
     * Two tabs: Job Postings & Applications
     * Search by title/department
     * Filter by job type
     * Create/Edit/Delete job postings
     * Toggle job active status with eye icon
     * View and update application statuses
     * Modal form for job creation/editing
     * Responsive table view
   
   - **Job Form Fields:**
     * Job Title, Job Type, Department, Location
     * Salary Range, Release Date, Expiry Date
     * Short Description (200 chars max)
     * Full Description, Requirements

2. **User Career Page** (`frontend/src/components/footer/Career.jsx`)
   - **Completely redesigned - NO STATIC CONTENT**
   - **Features:**
     * Hero section with search bar
     * Job type filter dropdown
     * Results count display
     * Grid layout (2 columns on large screens)
     * Job cards show:
       - Job title, department, type badge
       - Short description
       - Location, salary, posted date, applicants count
       - Expiry date warning
       - Truncated description and requirements
       - "Apply Now" button
     * Loading state with spinner
     * Empty state messages
     * Real-time filtering

3. **Job Application Form** (`frontend/src/components/footer/JobApplicationForm.jsx`)
   - **Multi-step wizard with 3 steps:**
     1. **Basic Details:**
        - First Name, Last Name
        - Email (validated)
        - Phone (minimum 10 digits)
        - Address
     
     2. **Education Details:**
        - School (10th): Name, Board, Year, Marks (required)
        - Intermediate (12th): Name, Board, Year, Marks (required)
        - Graduation: College, Degree, University, Year, Marks (required)
        - Post Graduation: All fields optional
     
     3. **Resume Upload:**
        - PDF only
        - Maximum 1MB file size
        - Upload to Supabase "job-resume" bucket
        - File validation
   
   - **Features:**
     * Progress indicator
     * Step validation
     * Back/Next navigation
     * Success/Error handling
     * Loading states during upload

4. **Admin Sidebar** (`frontend/src/admin/AdminSidebar.jsx`)
   - Added "Career" menu item with briefcase icon in Management section

5. **App Routing** (`frontend/src/App.jsx`)
   - Added AdminCareer component import
   - Added route: `/admin/career` -> AdminCareer component

### Environment Configuration

**Created Files:**
- `frontend/.env.example` - Template for Supabase configuration
- Needs actual `.env` file with:
  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```

## Setup Instructions

### 1. Supabase Setup (Resume Storage)

1. Go to [supabase.com](https://supabase.com) and create/login to your account
2. Create a new project or use existing
3. Navigate to **Storage** in the left sidebar
4. Click **New Bucket**
5. Create bucket with name: `job-resume`
6. Set bucket to **Public** (so resume URLs are accessible)
7. Go to **Project Settings** > **API**
8. Copy:
   - Project URL → `VITE_SUPABASE_URL`
   - anon/public key → `VITE_SUPABASE_ANON_KEY`
9. Create `frontend/.env` file and add these values

### 2. Backend Setup

No additional npm packages needed - all dependencies already installed.

The backend routes are already integrated into `server.js`.

### 3. Frontend Setup

**Required package** (already installed):
```json
"@supabase/supabase-js": "^2.45.4"
```

Create the `.env` file in `frontend/` directory:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Testing the System

1. **Start backend:**
   ```bash
   cd backend
   npm start
   ```

2. **Start frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access admin panel:**
   - Navigate to `http://localhost:5173/admin/career`
   - Create a test job posting
   - Fill all required fields
   - Set job as "Active"

4. **View user page:**
   - Navigate to `http://localhost:5173/career`
   - Should see the job card you just created
   - Click "Apply Now"
   - Fill the 3-step application form
   - Upload a test PDF resume (< 1MB)
   - Submit application

5. **Review application:**
   - Go back to admin panel
   - Click "Applications" tab
   - See the submitted application
   - Update status using dropdown

## API Endpoints Reference

### Public (No Authentication)
```
GET    /api/career/public/jobs              - Get all active jobs
GET    /api/career/public/jobs/:id          - Get job by ID
POST   /api/career/applications             - Submit application
```

### Admin Only (Requires Auth + Admin)
```
POST   /api/career/admin/jobs               - Create job
GET    /api/career/admin/jobs               - Get all jobs (including inactive)
PUT    /api/career/admin/jobs/:id           - Update job
DELETE /api/career/admin/jobs/:id           - Delete job
PATCH  /api/career/admin/jobs/:id/toggle    - Toggle active status
GET    /api/career/admin/jobs/:id/applications - Get job's applications
GET    /api/career/admin/applications/all   - Get all applications
PATCH  /api/career/admin/applications/:id/status - Update app status
GET    /api/career/admin/stats              - Get dashboard stats
```

## Key Features

✅ **Fully Dynamic** - No hardcoded job content
✅ **Admin CRUD** - Complete job management interface
✅ **Search & Filter** - User-friendly job discovery
✅ **Multi-step Form** - Organized application process
✅ **Resume Upload** - Secure storage via Supabase
✅ **Education Tracking** - Comprehensive candidate information
✅ **Status Management** - Track application lifecycle
✅ **Real-time Stats** - Dashboard metrics
✅ **Responsive Design** - Mobile-friendly UI
✅ **Date-based Filtering** - Release and expiry dates
✅ **Application Counter** - Track interest per job

## File Structure

```
backend/
├── models/
│   ├── JobPosting.js
│   └── JobApplication.js
├── controllers/
│   └── careerController.js
├── routes/
│   └── careerRoutes.js
└── server.js (modified)

frontend/
├── .env (create this)
├── .env.example (created)
├── src/
│   ├── admin/
│   │   ├── AdminCareer.jsx (created)
│   │   └── AdminSidebar.jsx (modified)
│   ├── components/footer/
│   │   ├── Career.jsx (completely redesigned)
│   │   └── JobApplicationForm.jsx (created)
│   └── App.jsx (modified)
```

## Important Notes

1. **Supabase Bucket:** Must be named exactly `job-resume`
2. **Resume Format:** Only PDF files accepted, max 1MB
3. **Education Fields:** School, Intermediate, and Graduation are mandatory
4. **Job Status:** Inactive jobs won't appear on user Career page
5. **Short Description:** Limited to 200 characters for card display
6. **Application Status:** Can be: pending, reviewed, shortlisted, accepted, rejected

## Troubleshooting

**Issue:** Resume upload fails
- **Solution:** Check Supabase URL and anon key in `.env`
- Verify bucket exists and is public
- Check file is PDF and under 1MB

**Issue:** Jobs not showing on user page
- **Solution:** Ensure job is marked as "Active" in admin panel
- Check that releaseDate is in the past (if set)
- Verify expiryDate hasn't passed (if set)

**Issue:** Can't access admin panel
- **Solution:** Ensure you're logged in as admin
- Check requireAdmin middleware is working
- Verify token in localStorage

## Next Steps (Optional Enhancements)

1. Add job categories/tags for better filtering
2. Implement email notifications for new applications
3. Add bulk actions for managing multiple jobs
4. Create application analytics dashboard
5. Add candidate shortlisting and interview scheduling
6. Implement application form autosave
7. Add resume preview before submission
8. Create PDF export for applications

---

**System Status:** ✅ Fully Implemented and Ready for Testing
**Database:** MongoDB with Mongoose schemas
**File Storage:** Supabase Storage (job-resume bucket)
**Authentication:** JWT with admin middleware
**Frontend:** React with Tailwind CSS
**State Management:** React Hooks (useState, useEffect)
