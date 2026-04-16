# 🔍 Backend Location Check

## 📍 Production Backend Location

### Based on deployment scripts:

**Main Backend Folder:**
```
/home/ec2-user/staffinn-backend/
```

**Process Name (PM2):**
```
staffinn-backend
```

**Main File:**
```
/home/ec2-user/staffinn-backend/server.js
```

---

## 🔍 How to Check Which Folder is Active

### SSH to EC2 and run these commands:

```bash
# 1. Check PM2 process
pm2 list

# Output will show:
# ┌─────┬──────────────────┬─────────┬─────────┬──────────┐
# │ id  │ name             │ status  │ restart │ uptime   │
# ├─────┼──────────────────┼─────────┼─────────┼──────────┤
# │ 0   │ staffinn-backend │ online  │ 15      │ 2D       │
# └─────┴──────────────────┴─────────┴─────────┴──────────┘

# 2. Check process details
pm2 info staffinn-backend

# Output will show:
# script path: /home/ec2-user/staffinn-backend/server.js
# ^^^ This is your active folder!

# 3. Check working directory
pm2 describe staffinn-backend | grep "exec cwd"

# 4. Alternative: Check process
ps aux | grep "server.js"

# Output will show full path like:
# /home/ec2-user/staffinn-backend/server.js
```

---

## 📂 Possible Backend Folders on EC2

You might have multiple folders:

```
/home/ec2-user/
├── staffinn-backend/          ← Main (likely active)
├── staffinn-backend-old/      ← Backup
├── staffinn-backend-v2/       ← Old version
├── Backend/                   ← Direct copy
└── deployment-archive/        ← Old deployments
```

---

## ✅ How to Confirm Active Folder

### Method 1: PM2 Info (Best)
```bash
pm2 info staffinn-backend
```
Look for: **"script path"** or **"exec cwd"**

### Method 2: Check Process
```bash
ps aux | grep node | grep server.js
```

### Method 3: Check Logs
```bash
pm2 logs staffinn-backend --lines 5
```
First line usually shows: `Starting in /home/ec2-user/[folder-name]`

### Method 4: Check Port
```bash
sudo netstat -tlnp | grep :4001
```
Shows which process is using port 4001

---

## 🎯 What You Need to Update

Once you find the active folder, update this file:
```
/home/ec2-user/[active-folder]/config/socket.js
```

---

## 📝 Quick Commands to Run on EC2

```bash
# Connect to EC2
ssh ec2-user@your-ec2-ip

# Find active backend
pm2 info staffinn-backend

# Go to that folder
cd /home/ec2-user/staffinn-backend  # (or whatever pm2 shows)

# Check if socket.js has room joining
grep "join-room" config/socket.js

# If not found, update is needed
# If found, already updated!

# Check logs
pm2 logs staffinn-backend --lines 20
```

---

## 🚀 After Finding Active Folder

### If socket.js NOT updated:

**Option 1: Git Pull (if using Git)**
```bash
cd /home/ec2-user/staffinn-backend
git pull origin main
pm2 restart staffinn-backend
```

**Option 2: Manual Update**
```bash
cd /home/ec2-user/staffinn-backend
nano config/socket.js

# Add this code inside io.on('connection', ...) block:
# socket.on('join-room', (room) => {
#   socket.join(room);
#   console.log(`✅ User ${socket.user.userId} joined room: ${room}`);
#   socket.emit('room-joined', { room, success: true });
# });

# Save: Ctrl+X, Y, Enter
pm2 restart staffinn-backend
```

**Option 3: Copy from Local**
```bash
# On your local machine:
scp "d:\Staffinn-main\Backend\config\socket.js" ec2-user@your-ec2-ip:/home/ec2-user/staffinn-backend/config/

# Then SSH and restart:
ssh ec2-user@your-ec2-ip
pm2 restart staffinn-backend
```

---

## ✅ Verification After Update

```bash
# Check logs for WebSocket messages
pm2 logs staffinn-backend --lines 50

# Should see:
# ✅ User xyz joined room: recruiter-abc
# (when someone connects from HRMS)

# Check if server restarted
pm2 status

# Check if no errors
pm2 logs staffinn-backend --err --lines 20
```

---

## 🎯 Summary

**To find active backend:**
1. SSH to EC2
2. Run: `pm2 info staffinn-backend`
3. Look for "script path" or "exec cwd"
4. That's your active folder!

**Most likely location:**
```
/home/ec2-user/staffinn-backend/
```

**File to update:**
```
/home/ec2-user/staffinn-backend/config/socket.js
```

**After update:**
```bash
pm2 restart staffinn-backend
pm2 logs staffinn-backend
```

---

**Next Step:** SSH to EC2 and run `pm2 info staffinn-backend` to confirm exact location!
