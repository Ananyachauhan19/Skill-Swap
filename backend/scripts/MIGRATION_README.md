# Running the Action Timestamp Migration

## Prerequisites
- Ensure you have the updated models deployed with the new timestamp fields
- Have access to your MongoDB database
- Node.js environment set up

## Steps

### 1. Navigate to the backend directory
```bash
cd backend
```

### 2. Set your MongoDB connection string (if not in .env)
```bash
export MONGODB_URI="mongodb://localhost:27017/skillswap"
# or on Windows:
set MONGODB_URI=mongodb://localhost:27017/skillswap
```

### 3. Run the migration script
```bash
node scripts/migrateActionTimestamps.js
```

## What the Script Does

The migration script populates the new `approvedActionTimestamp` and `rejectedActionTimestamp` fields for existing records:

- **Approved Tutor Applications**: Uses `approvedAt` field as the action timestamp
- **Rejected Tutor Applications**: Uses `submittedAt` field as the action timestamp (fallback)
- **Approved Interviewer Applications**: Uses `createdAt` field as the action timestamp
- **Rejected Interviewer Applications**: Uses `createdAt` field as the action timestamp

## Expected Output

```
Starting action timestamp migration...
📦 Connected to MongoDB
✅ Migrated X approved tutor applications
✅ Migrated X rejected tutor applications
✅ Migrated X approved interviewer applications
✅ Migrated X rejected interviewer applications

🎉 Migration completed successfully!

Summary:
- Tutor Applications (Approved): X
- Tutor Applications (Rejected): X
- Interview Applications (Approved): X
- Interview Applications (Rejected): X
Total Records Updated: X

✨ Closing database connection...
👋 Done!
```

## Safety

- The script uses `updateMany` with filters to only update records that:
  - Have the appropriate status (approved/rejected)
  - Have an employee reference (approvedByEmployee/rejectedByEmployee)
  - Don't already have action timestamps populated
- The script will NOT modify records that already have action timestamps
- Safe to run multiple times (idempotent)

## Rollback

If you need to rollback the action timestamps:

```javascript
// Connect to your MongoDB
use skillswap;

// Remove action timestamps from TutorApplication
db.tutorapplications.updateMany(
  {},
  { $unset: { approvedActionTimestamp: "", rejectedActionTimestamp: "" } }
);

// Remove action timestamps from InterviewerApplication
db.interviewerapplications.updateMany(
  {},
  { $unset: { approvedActionTimestamp: "", rejectedActionTimestamp: "" } }
);
```

## Verification

After migration, verify the data:

```javascript
// Check TutorApplication
db.tutorapplications.findOne({
  status: "approved",
  approvedActionTimestamp: { $exists: true }
});

// Check InterviewerApplication
db.interviewerapplications.findOne({
  status: "approved",
  approvedActionTimestamp: { $exists: true }
});
```

## Notes

- New approvals/rejections made after deploying the code changes will automatically have action timestamps
- This migration is for backfilling historical data only
- The timestamps may not be 100% accurate for historical data (best approximation based on available fields)
