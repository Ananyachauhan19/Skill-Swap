# 🔔 SIMPLE Popup Notification Testing Guide

## What You Want (Simplified)

### When LEARNER sends request to TEACHER:

**TEACHER sees:**
1. ✅ **Popup message** appears on current page (anywhere they are)
2. ✅ Shows: "[Learner Name] sent you a session request"
3. ✅ Two buttons:
   - **"Check Details"** → Navigate to Session Request page
   - **"Ignore"** → Reject request + send notification to learner "Your request was denied, send again if needed"

### When TEACHER approves request:

**LEARNER sees:**
1. ✅ **Popup message** appears on current page  
2. ✅ Shows: "[Teacher Name] approved your session request!"
3. ✅ One button:
   - **"Join Session"** → Navigate to Session Request page

### When TEACHER rejects/ignores request:

**LEARNER sees:**
1. ✅ **Popup message** appears on current page
2. ✅ Shows: "[Teacher Name] denied your request. You can send again if needed."
3. ✅ One button:
   - **"View Details"** → Navigate to Session Request page

---

## How to Test

### Step 1: Start Both Servers

**Terminal 1 (Backend):**
```bash
cd backend
node server.js
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Step 2: Open Two Browser Windows

**Browser 1:** Login as STUDENT (learner)
**Browser 2:** Login as TEACHER

### Step 3: Send Request

1. **In Browser 1 (Student):**
   - Go to "Start Skill Swap" page
   - Fill in Class, Subject, Topic
   - Click "Find Tutors"
   - Click "Request Session" on any teacher

2. **In Browser 2 (Teacher):**
   - **Popup should appear immediately!** (blue color)
   - Shows: "Student Name sent you a session request for [Subject] ([Topic])"
   - Two buttons: "Check Details" | "Ignore"

### Step 4: Test "Check Details"

1. Click "Check Details" button
2. Should navigate to Session Requests page
3. Should show the request in "Received" tab

### Step 5: Test "Ignore"

1. Click "Ignore" button
2. Popup disappears
3. **In Browser 1 (Student):**
   - Popup should appear (red color)
   - Shows: "Teacher Name denied your request. You can send again if needed."

### Step 6: Test "Approve"

1. **In Browser 2 (Teacher):**
   - Go to Session Requests page
   - Click "Approve" on a request

2. **In Browser 1 (Student):**
   - **Popup should appear immediately!** (green color)
   - Shows: "Teacher Name approved your session request!"
   - Button: "Join Session"

---

## Debugging

### If popup doesn't appear:

**Check Browser Console (F12):**

Look for these messages:
```
🔌 Setting up socket listeners for user: [userId]
✅ Socket listeners registered
🔔 Toast: Received session-requested notification
```

If you don't see these:
1. User might not be logged in
2. Socket connection might be broken
3. Backend might not be running

### Check Socket Connection:

**In Browser Console, type:**
```javascript
socket.connected
```
Should return: `true`

**If false, type:**
```javascript
socket.connect()
```

### Check User ID:

**In Browser Console, type:**
```javascript
localStorage.getItem('user')
```
Should show user data with `_id`

---

## Files Changed

### Frontend:
- ✅ `src/components/ToastContainer.jsx` - Listens to socket events + shows popups
- ✅ `src/components/ToastNotification.jsx` - Popup UI component
- ✅ `src/App.jsx` - Renders ToastContainer globally
- ✅ `src/user/SessionRequests.jsx` - Handles navigation from popups

### Backend:
- ✅ `socket.js` - Emits `session-request-received` event
- ✅ `routes/sessionRequestRoutes.js` - Emits events when approve/reject

---

## What Should Happen

### ✅ Correct Flow:

1. Student sends request → **Teacher sees popup instantly**
2. Teacher clicks "Check Details" → **Navigate to Session Requests page**
3. Teacher clicks "Ignore" → **Student sees "denied" popup**
4. Teacher clicks "Approve" → **Student sees "approved" popup**
5. Student clicks "Join Session" → **Navigate to Session Requests page**

### ❌ If popup doesn't show:

**Most Common Reasons:**
1. Backend server not running
2. Socket not connected
3. User not registered with socket
4. Browser console has errors

**Quick Fix:**
1. Refresh page
2. Check both servers are running
3. Check browser console for errors

---

## Console Logs to Watch

### When everything works correctly:

**Teacher Browser:**
```
🔌 Setting up socket listeners for user: 673abc123...
✅ Socket listeners registered
🔔 Toast: Received session-requested notification {requesterName: "John Doe", ...}
🔔 Adding toast: {type: "session-requested", ...}
```

**Student Browser:**
```
🔌 Setting up socket listeners for user: 673def456...
✅ Socket listeners registered
✅ Toast: Received session-approved notification {teacherName: "Jane Smith", ...}
🔔 Adding toast: {type: "session-approved", ...}
```

---

## Simple Test Checklist

- [ ] Backend server running (check Terminal 1)
- [ ] Frontend server running (check Terminal 2)
- [ ] Two browsers open with different users
- [ ] Student sends request
- [ ] **Teacher sees blue popup**
- [ ] Click "Check Details" - navigates to Session Requests
- [ ] Go back, send another request
- [ ] Click "Ignore" on popup
- [ ] **Student sees red popup** saying "denied"
- [ ] Teacher approves a request from Session Requests page
- [ ] **Student sees green popup** saying "approved"
- [ ] Click "Join Session" - navigates to Session Requests

If all checkboxes are ✅, system is working perfectly! 🎉

---

## Need Help?

**Open browser console (F12) and check for errors.**

Common errors:
- `socket is not defined` → Socket import issue
- `user is null` → User not logged in
- `Cannot read property '_id' of undefined` → User data missing

**Solution:** Logout and login again, then try.
