# Employee Activity Profile Enhancement - Implementation Summary

## Overview
Enhanced the Employee Activity Profile in SkillSwap Hub with access-aware filters, dynamic stats, and dynamic table schemas based on application type.

## Changes Implemented

### 1. MongoDB Schema Updates

#### TutorApplication Model
**File:** `backend/models/TutorApplication.js`

Added timestamp fields to track exact approval/rejection times:
```javascript
approvedActionTimestamp: { type: Date }
rejectedActionTimestamp: { type: Date }
```

#### InterviewerApplication Model
**File:** `backend/models/InterviewerApplication.js`

Added timestamp fields to track exact approval/rejection times:
```javascript
approvedActionTimestamp: { type: Date }
rejectedActionTimestamp: { type: Date }
```

### 2. Backend Controller Updates

#### Employee Activity Controller
**File:** `backend/controllers/employeeActivityController.js`

**Key Changes:**

1. **Added 'today' time filter support**
   - Extended `getDateRange()` function to support 'today' and '1d' filters
   - Provides granular time filtering for daily activity tracking

2. **New `buildStatsByApplicationType()` function**
   - Builds separate stats for tutor and interview applications
   - Respects employee access permissions
   - Filters by time range using action timestamps
   - Returns:
     - `tutorStats`: { total, approved, rejected, pending }
     - `interviewStats`: { total, approved, rejected, pending }
     - `combinedStats`: aggregated totals

3. **Enhanced `buildDetailedListsForEmployee()` function**
   - Accepts optional `applicationType` filter ('tutor', 'interview', or null)
   - Uses action timestamps for time-based filtering
   - Returns enriched data with:
     - `applicantName`: Full name from user object
     - `class` and `subjects`: For tutor applications
     - `company` and `position`: For interview applications
     - `reviewedAt`: Exact timestamp when approved/rejected

4. **Updated API endpoints**
   - `GET /api/employee/me/activity` - Employee's own activity
   - `GET /api/admin/employees/:id/activity` - Admin view of employee activity
   
   **Query Parameters:**
   - `range`: 'today', '7d', '30d', '90d', '365d', 'all'
   - `applicationType`: 'tutor', 'interview', or null (both)

   **Response Structure:**
   ```json
   {
     "employee": { "id", "name", "email", "accessPermissions" },
     "access": {
       "canTutor": boolean,
       "canInterviewer": boolean,
       "hasBothAccess": boolean
     },
     "stats": {
       "tutorStats": { "total", "approved", "rejected", "pending" },
       "interviewStats": { "total", "approved", "rejected", "pending" },
       "combinedStats": { "total", "approved", "rejected", "pending" }
     },
     "lists": {
       "approved": [...],
       "rejected": [...],
       "pending": [...]
     }
   }
   ```

#### Tutor Controller
**File:** `backend/controllers/tutorController.js`

**Changes in `approve()` function:**
```javascript
app.approvedByEmployee = req.employee._id;
app.approvedActionTimestamp = new Date();
app.rejectedByEmployee = undefined;
app.rejectedActionTimestamp = undefined;
```

**Changes in `reject()` function:**
```javascript
app.rejectedByEmployee = req.employee._id;
app.rejectedActionTimestamp = new Date();
app.approvedByEmployee = undefined;
app.approvedActionTimestamp = undefined;
```

#### Interview Controller
**File:** `backend/controllers/interviewController.js`

**Changes in `approveApplication()` function:**
```javascript
app.approvedByEmployee = req.employee._id;
app.approvedActionTimestamp = new Date();
app.rejectedByEmployee = undefined;
app.rejectedActionTimestamp = undefined;
```

**Changes in `rejectApplication()` function:**
```javascript
app.rejectedByEmployee = req.employee._id;
app.rejectedActionTimestamp = new Date();
app.approvedByEmployee = undefined;
app.approvedActionTimestamp = undefined;
```

### 3. Frontend Updates

#### Employee Activity Component
**File:** `frontend/src/employee/EmployeeActivity.jsx`

**Key Changes:**

1. **Added application type filter**
   ```javascript
   const applicationTypeOptions = [
     { id: 'tutor', label: 'Tutor Applications' },
     { id: 'interview', label: 'Interview Applications' },
   ];
   ```

2. **Added 'today' to time range options**
   ```javascript
   { id: 'today', label: 'Today' }
   ```

3. **Enhanced StatCard component**
   - Now supports `subStats` prop for showing breakdown
   - Displays tutor/interview counts when showing combined stats

4. **Dynamic stats calculation in `ActivityProfileView`**
   - Shows application type filter ONLY if employee has both access types
   - Dynamically calculates displayed stats based on:
     - Employee access permissions
     - Selected application type filter
     - Selected time range
   
   **Logic:**
   - **If employee has both access + no filter**: Show combined total (large) with tutor/interview breakdown (small)
   - **If employee has both access + filter selected**: Show only that type's total (large)
   - **If employee has single access**: Show only that access count (large), hide filters

5. **Dynamic table rendering**
   - `renderTableHeaders()`: Changes columns based on application type
   - `renderTableRow()`: Renders appropriate data for each type
   
   **Tutor Applications Table:**
   - Applicant Name
   - Class
   - Subject(s)
   - Status
   - Reviewed At

   **Interview Applications Table:**
   - Applicant Name
   - Company
   - Position
   - Status
   - Reviewed At

   **Mixed View (when showing both):**
   - Type (badge)
   - Applicant Name
   - Details (class/subjects OR company/position)
   - Status
   - Reviewed At

6. **Filter UI rendering**
   - Application type filter shown only when `hasBothAccess === true`
   - Clean, accessible dropdown with FiFilter icon
   - Automatically hides when employee has single access

#### Admin Employee Detail Component
**File:** `frontend/src/admin/EmployeeDetail.jsx`

**Changes:**

1. **Added state for application type filter**
   ```javascript
   const [activityApplicationType, setActivityApplicationType] = useState(null);
   ```

2. **Updated `loadActivity()` function**
   - Accepts both `range` and `applicationType` parameters
   - Passes `applicationType` in query params when set

3. **Updated ActivityProfileView props**
   ```jsx
   <ActivityProfileView
     title="Employee Activity"
     loading={activityLoading}
     error={activityError}
     stats={activityData?.stats}
     access={activityData?.access}
     lists={activityData?.lists}
     range={activityRange}
     applicationType={activityApplicationType}
     onRangeChange={(value) => loadActivity(value, activityApplicationType)}
     onApplicationTypeChange={(value) => loadActivity(activityRange, value)}
   />
   ```

## Access Control Implementation

### Permission Logic

1. **Filter Visibility:**
   - Application type filter shown ONLY if `accessPermissions === 'both'`
   - If employee has single access ('tutor' OR 'interviewer'), no filters shown

2. **Stats Display:**
   - **Both access + no filter**: Combined total + breakdown
   - **Both access + filter**: Only selected type's stats
   - **Single access**: Only that type's stats

3. **Backend Enforcement:**
   - `buildStatsByApplicationType()` checks access before querying
   - Never returns data employee isn't allowed to see
   - Uses employee._id for all queries (access-scoped)

## Time Filtering

### Supported Ranges:
- **today**: Current day (00:00:00 to now)
- **7d**: Last 7 days
- **30d**: Last 30 days
- **90d**: Last 90 days
- **365d**: Last year
- **all**: All time

### Timestamp Tracking:
- Uses `approvedActionTimestamp` and `rejectedActionTimestamp` for approved/rejected records
- Falls back to `submittedAt` (tutor) or `createdAt` (interview) for pending records
- Ensures accurate time-based filtering regardless of status

## MongoDB Aggregation Strategy

Instead of using EmployeeActivity collection, the implementation directly queries:
- `TutorApplication` collection with `approvedByEmployee` or `rejectedByEmployee` filters
- `InterviewerApplication` collection with `approvedByEmployee` or `rejectedByEmployee` filters

This approach:
- Provides real-time accuracy
- Eliminates sync issues
- Simplifies maintenance
- Uses action timestamps for precise filtering

## Key Features

✅ Access-aware filtering (only shows what employee can access)  
✅ Dynamic stats that update based on filters  
✅ Application type filter (shown only for dual-access employees)  
✅ Time range filter with 'today' support  
✅ Exact action timestamps for approved/rejected actions  
✅ Dynamic table schemas that switch based on filter  
✅ Separate columns for tutor vs interview applications  
✅ Proper access control enforced at backend  
✅ Clean, intuitive UI with conditional rendering  
✅ Optimized MongoDB queries with proper indexing support  

## Testing Recommendations

1. **Test with different access permissions:**
   - Employee with only tutor access
   - Employee with only interview access
   - Employee with both access types

2. **Test time filters:**
   - Verify 'today' shows only current day actions
   - Verify other ranges work correctly
   - Test with applications spanning multiple time periods

3. **Test application type filter:**
   - Verify filter appears only for dual-access employees
   - Verify stats update correctly when filter changes
   - Verify table switches between tutor/interview schemas

4. **Test stats accuracy:**
   - Compare combined vs filtered stats
   - Verify breakdown numbers add up correctly
   - Test with approved, rejected, and pending applications

## Migration Notes

For existing data without action timestamps:
- Approved applications: `approvedActionTimestamp` will be null initially
- Rejected applications: `rejectedActionTimestamp` will be null initially
- New approvals/rejections will have timestamps
- Consider running a migration script to populate timestamps from `approvedAt` or `createdAt` for historical data

## Files Modified

### Backend
1. `backend/models/TutorApplication.js`
2. `backend/models/InterviewerApplication.js`
3. `backend/controllers/employeeActivityController.js`
4. `backend/controllers/tutorController.js`
5. `backend/controllers/interviewController.js`

### Frontend
1. `frontend/src/employee/EmployeeActivity.jsx`
2. `frontend/src/admin/EmployeeDetail.jsx`

## API Endpoints

### GET /api/employee/me/activity
**Query Parameters:**
- `range`: Time range filter
- `applicationType`: Application type filter (optional)

**Response:** Activity data with stats, access permissions, and filtered lists

### GET /api/admin/employees/:id/activity
**Query Parameters:**
- `range`: Time range filter
- `applicationType`: Application type filter (optional)

**Response:** Employee activity data with stats, access permissions, and filtered lists

---

**Implementation Date:** December 27, 2025  
**Status:** ✅ Complete
