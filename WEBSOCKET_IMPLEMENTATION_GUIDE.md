# 🚀 WebSocket Implementation Guide - HRMS Frontend

## ✅ Files Created

1. **WebSocket Service:** `src/services/websocket.ts` ✅
2. **Backend Update:** `Backend/config/socket.js` ✅

---

## 📦 Step 1: Install Dependencies

```bash
cd "d:\Staffinn-main\HRMS Staffinn\Staffinn HR Manager_files"
npm install socket.io-client
```

---

## 🔧 Step 2: Update Attendance Component

### Find Attendance Component
Look for file that displays attendance (likely `src/pages/Attendance.tsx` or `src/components/AttendanceTable.tsx`)

### Add WebSocket Integration

```typescript
import { useEffect, useState } from 'react';
import { websocketService } from '../services/websocket';

function AttendancePage() {
  const [attendanceData, setAttendanceData] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);

  // Fetch attendance data function
  const fetchAttendanceData = async () => {
    try {
      const response = await apiService.getAttendanceByDate(selectedDate);
      if (response.success) {
        setAttendanceData(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  useEffect(() => {
    // Get user info from localStorage
    const token = localStorage.getItem('hrms_token');
    const userStr = localStorage.getItem('hrms_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const recruiterId = user.recruiterId;

        if (recruiterId) {
          // Connect WebSocket
          websocketService.connect(token, recruiterId);
          setWsConnected(true);

          // Listen for real-time attendance updates
          websocketService.onAttendanceUpdate((data) => {
            console.log('📡 Real-time attendance update received:', data);
            
            // Refresh attendance data
            fetchAttendanceData();
            
            // Optional: Show toast notification
            // toast.success('Attendance updated!');
          });

          console.log('✅ WebSocket initialized for attendance updates');
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Cleanup on unmount
    return () => {
      websocketService.offAttendanceUpdate();
      websocketService.disconnect();
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate]);

  return (
    <div>
      {/* Connection indicator */}
      <div className=\"flex items-center gap-2 mb-4\">
        <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className=\"text-sm text-gray-600\">
          {wsConnected ? 'Live Updates Active' : 'Connecting...'}
        </span>
      </div>

      {/* Your existing attendance table */}
      <AttendanceTable data={attendanceData} />
    </div>
  );
}
```

---

## 🎯 Step 3: Update Dashboard Stats Component

If you have a dashboard showing attendance stats:

```typescript
import { useEffect } from 'react';
import { websocketService } from '../services/websocket';

function Dashboard() {
  const [stats, setStats] = useState(null);

  const fetchStats = async () => {
    const response = await apiService.getAttendanceStats();
    if (response.success) {
      setStats(response.data);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('hrms_token');
    const user = JSON.parse(localStorage.getItem('hrms_user') || '{}');

    if (token && user.recruiterId) {
      websocketService.connect(token, user.recruiterId);
      
      websocketService.onAttendanceUpdate(() => {
        // Refresh stats when attendance updates
        fetchStats();
      });
    }

    return () => {
      websocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div>
      {/* Stats display */}
      <div className=\"grid grid-cols-3 gap-4\">
        <StatCard title=\"Present Today\" value={stats?.presentToday} />
        <StatCard title=\"Absent Today\" value={stats?.absentToday} />
        <StatCard title=\"Late Arrivals\" value={stats?.lateArrivals} />
      </div>
    </div>
  );
}
```

---

## 🔄 Step 4: Build and Deploy

### Build Frontend
```bash
cd "d:\Staffinn-main\HRMS Staffinn\Staffinn HR Manager_files"
npm run build
```

### Deploy to Production
```bash
# Upload dist folder to S3 or your hosting
# Example for S3:
aws s3 sync dist/ s3://your-hrms-bucket/ --delete
```

### Restart Backend (if needed)
```bash
cd d:\Staffinn-main\Backend
pm2 restart staffinn-backend
```

---

## 🧪 Testing

### 1. Check WebSocket Connection

Open browser console on HRMS page:

```javascript
// Should see these logs:
🔌 Connecting to WebSocket: https://api.staffinn.com
✅ WebSocket connected
📡 Joined room: recruiter-{your-recruiter-id}
```

### 2. Test Real-Time Update

1. Open HRMS attendance page
2. Mark attendance from device
3. Check console for:
   ```
   📡 Received attendance update: {...}
   ```
4. Attendance should appear instantly

### 3. Test Reconnection

1. Stop backend server
2. Should see: `❌ WebSocket disconnected`
3. Start backend server
4. Should see: `🔄 WebSocket reconnected`

---

## 🐛 Troubleshooting

### Issue: WebSocket not connecting

**Check:**
```javascript
// In browser console
console.log(websocketService.isConnected());
// Should return true
```

**Solutions:**
1. Check backend is running
2. Check CORS settings in backend
3. Check firewall/proxy not blocking WebSocket
4. Try polling transport only:
   ```typescript
   this.socket = io(API_URL, {
     transports: ['polling'] // Remove websocket
   });
   ```

### Issue: Not receiving updates

**Check:**
1. recruiterId is correct
2. Room joined successfully
3. Backend emitting to correct room
4. Event name matches ('attendance-update')

**Debug:**
```typescript
// Add more logging
websocketService.socket?.on('*', (event, data) => {
  console.log('WebSocket event:', event, data);
});
```

### Issue: Multiple connections

**Solution:**
```typescript
// Make sure to disconnect on unmount
useEffect(() => {
  // ... connection code
  
  return () => {
    websocketService.disconnect(); // Important!
  };
}, []);
```

---

## 📊 Expected Behavior

### Before Fix
```
Employee punches → Backend saves → Frontend polls (30s delay) → Data appears
```

### After Fix
```
Employee punches → Backend saves → WebSocket emit → Frontend receives → Data appears (instant!)
```

---

## 🎯 Quick Verification Commands

### Check if socket.io-client installed
```bash
cd "d:\Staffinn-main\HRMS Staffinn\Staffinn HR Manager_files"
npm list socket.io-client
```

### Check WebSocket service exists
```bash
dir "src\services\websocket.ts"
```

### Check backend socket.js updated
```bash
type "d:\Staffinn-main\Backend\config\socket.js" | findstr "join-room"
```

---

## 🚀 Deployment Checklist

- [ ] socket.io-client installed
- [ ] websocket.ts service created
- [ ] Attendance component updated
- [ ] Dashboard component updated (if applicable)
- [ ] Backend socket.js updated
- [ ] Frontend built successfully
- [ ] Deployed to production
- [ ] Backend restarted
- [ ] WebSocket connection verified
- [ ] Real-time updates working

---

## 📝 Files to Update

### Frontend Files
1. ✅ `src/services/websocket.ts` (created)
2. ⏳ `src/pages/Attendance.tsx` (update needed)
3. ⏳ `src/pages/Dashboard.tsx` (update needed)
4. ⏳ `package.json` (add socket.io-client)

### Backend Files
1. ✅ `Backend/config/socket.js` (updated)

---

## 🎉 Success Indicators

After implementation:
- ✅ Green dot showing "Live Updates Active"
- ✅ Console shows WebSocket connected
- ✅ Attendance appears within 1-2 seconds
- ✅ No page refresh needed
- ✅ Stats update automatically

---

**Status:** ✅ READY TO IMPLEMENT
**Estimated Time:** 30 minutes
**Priority:** 🔴 HIGH
