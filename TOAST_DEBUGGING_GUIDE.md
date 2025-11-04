# 🐛 Toast Notification Debugging Guide

## Current Status
✅ Toast notification system has been enhanced with extensive debugging

## What to Check

### 1. **Check Browser Console**
Open browser console (F12) and look for these messages:

**When page loads:**
```
🔌 ToastContainer: Setting up socket listeners for user: [userId]
✅ Socket register and join emitted for user: [userId]
✅ ToastContainer: Socket listeners registered
```

**When request is sent (Student side):**
```
[Session Request] Request sent from [Student] to tutor [tutorId]
```

**When request is received (Teacher side):**
```
🔔 Toast: Received session-request-received event {requesterName, requestId, subject, topic}
🎯 Adding toast: {...}
✅ Toast added: {...}
🎨 Rendering 1 toast(s)
```

**When request is approved (Student side):**
```
✅ Toast: Received session-request-approved event {...}
🎯 Adding toast: {...}
✅ Toast added: {...}
```

### 2. **Visual Debugging**
Look at the **top-right corner** of the screen. You should see:
- A small gray debug box showing: `Socket: 🟢 Connected | Toasts: 0`
- When notification arrives, it changes to `Toasts: 1`

### 3. **Toast Position**
Toasts now appear at:
- **Position**: Fixed top-right
- **From top**: 24 units (below navbar)
- **From right**: 4 units
- **Z-index**: 9999 (very high, should be on top of everything)

## Testing Steps

### Test 1: Send Request
1. **Student**: Go to StartSkillSwap, send a request
2. **Teacher**: Open browser console
3. **Look for**: `🔔 Toast: Received session-request-received event`
4. **Expected**: Blue toast appears in top-right

### Test 2: Approve Request
1. **Teacher**: Click "Approve" on a request
2. **Student**: Open browser console  
3. **Look for**: `✅ Toast: Received session-request-approved event`
4. **Expected**: Green toast appears

### Test 3: Reject Request
1. **Teacher**: Click "Ignore" on toast OR "Reject" on request
2. **Student**: Open browser console
3. **Look for**: `❌ Toast: Received session-request-rejected event`
4. **Expected**: Red toast appears

## Common Issues & Solutions

### Issue 1: "Socket: 🔴 Disconnected"
**Problem**: Socket is not connected

**Solutions**:
1. Check if backend is running: `npm start` in backend folder
2. Check backend console for: `New client connected: [socketId]`
3. Verify BACKEND_URL in frontend/src/config.js
4. Check browser console for socket errors

### Issue 2: No console logs at all
**Problem**: ToastContainer not mounted

**Solutions**:
1. Check if user is logged in
2. Verify App.jsx has: `{user && <ToastContainer />}`
3. Check if AuthContext is providing user correctly

### Issue 3: Console logs appear but no toast visible
**Problem**: Toast is rendering but not visible

**Solutions**:
1. Check z-index conflicts (toast is at z-9999)
2. Verify no CSS hiding the toast
3. Check if "Toasts: 1" appears in debug box
4. Inspect element to see if toast div exists

### Issue 4: "Duplicate toast prevented"
**Problem**: Same request triggering multiple times

**This is normal!** It means the system is preventing duplicates correctly.

### Issue 5: Socket connected but events not received
**Problem**: Socket listeners not registered

**Solutions**:
1. Check console for: `✅ ToastContainer: Socket listeners registered`
2. Verify user._id is correct
3. Check if socket.emit('register', userId) is called
4. Check backend socket.js for event emission

## Backend Debugging

### Check Backend Console

**When request is sent:**
```
[Session Request] Request sent from [Student] to tutor [tutorId]
[Session Request] Emitted to tutor socket: [socketId]
[Session Request] Emitted to tutor room: [tutorId]
```

**When request is approved:**
```
[Session Request] Emitted approval to requester socket: [socketId]
[Session Request] Emitted approval to requester room: [userId]
```

### Verify Socket Events
Backend now emits to BOTH:
1. **Socket ID**: `io.to(socketId).emit(...)`
2. **User Room**: `io.to(userId.toString()).emit(...)`

This provides redundancy - if one fails, the other should work.

## Manual Test via Console

You can manually trigger a toast for testing:

```javascript
// In browser console (must be on a page where ToastContainer is mounted)
const event = new CustomEvent('test-toast');
window.dispatchEvent(event);

// Or manually emit socket event
socket.emit('session-request-received', {
  requesterName: 'Test User',
  requestId: '123',
  subject: 'Math',
  topic: 'Algebra',
  message: 'Test message'
});
```

## Success Checklist

- [ ] Debug box shows "Socket: 🟢 Connected"
- [ ] Console shows "✅ ToastContainer: Socket listeners registered"
- [ ] When request sent, backend logs appear
- [ ] When request sent, teacher sees console log: "🔔 Toast: Received..."
- [ ] Toast appears visually in top-right corner
- [ ] Toast has correct color (blue/green/red)
- [ ] Toast shows correct message
- [ ] Buttons work ("Check Details", "Ignore", etc.)
- [ ] Toast auto-dismisses after 30 seconds
- [ ] Clicking X closes toast immediately

## If Still Not Working

1. **Clear browser cache** and reload
2. **Restart both frontend and backend** servers
3. **Check Network tab** for WebSocket connection
4. **Try incognito/private window**
5. **Check if user has required permissions**
6. Share the **exact console logs** for further debugging

## Remove Debug Code (Production)

Once working, remove these lines:

**In ToastContainer.jsx:**
- Remove the debug status box (lines showing Socket/Toasts count)
- Remove console.log statements

**In socket.js:**
- Remove excessive console.log statements (keep only errors)

---

**Current Version**: Enhanced with dual socket emission (socketId + user room)
**Last Updated**: Now with visual debugging aids
