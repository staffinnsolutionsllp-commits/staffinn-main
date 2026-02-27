# 📱 MORX BioFace Device Configuration Guide

## 🎯 Current Device Settings (From Screenshots)

```
Device Model: BioFace-MSD1K
Device IP: 192.168.1.24
MAC Address: 00:23:79:bb:a1:ab
TCP Port: 5005
Server-Client Mode: LogClient ✓
```

---

## 🔧 Step-by-Step Configuration

### Step 1: Access Device Settings

**Option A: Using Device Screen**
```
1. Device screen pe touch karo
2. Admin password enter karo (default: 123456)
3. Menu → Communication
```

**Option B: Using Web Browser**
```
1. Browser open karo
2. URL: http://192.168.1.24
3. Login: admin / 123456
4. Go to Communication Settings
```

---

### Step 2: Configure Network (Already Done ✓)

```
Menu → Communication → TCP/IP Settings → TCP/IPv4

Current Settings (Keep as is):
├── DHCP: ON ✓
├── IP Address: 192.168.001.024
├── Subnet Mask: 255.255.255.000
├── Gateway: 192.168.001.001
└── DNS Server: Automatic
```

**✅ No changes needed here!**

---

### Step 3: Configure Server Connection (IMPORTANT!)

```
Menu → Communication → Communication Settings

CHANGE THESE:
┌─────────────────────────────────────────┐
│ Communication Password: No              │ ← Keep as is
│ Server-Client Mode: LogClient           │ ← Already set ✓
│ Event Transfer Mode: YES                │ ← CHANGE from No to YES
│ Host PC Addr: <Your-EC2-Public-IP>     │ ← ADD EC2 IP
│ Host PC Port: 4001                      │ ← CHANGE from 5005 to 4001
└─────────────────────────────────────────┘
```

**Detailed Steps:**

#### 3.1 Event Transfer Mode
```
1. Select "Event Transfer Mode"
2. Change: No → YES
3. Press OK/Save
```

#### 3.2 Host PC Address
```
1. Select "Host PC Addr"
2. Current: (Empty)
3. Enter: <Your-EC2-Public-IP>
   Example: 13.232.45.67
4. Press OK/Save
```

#### 3.3 Host PC Port
```
1. Select "Host PC Port"
2. Current: 5005
3. Change to: 4001
4. Press OK/Save
```

---

### Step 4: Save and Restart

```
1. Press "Save" button
2. Go to Main Menu
3. Select "System" → "Restart Device"
4. Wait 30 seconds for device to reboot
```

---

### Step 5: Verify Configuration

```
After restart:
1. Go to Communication Settings again
2. Verify:
   ├── Event Transfer Mode: YES ✓
   ├── Host PC Addr: <Your-EC2-IP> ✓
   └── Host PC Port: 4001 ✓
```

---

## 📋 Final Configuration Summary

```
┌─────────────────────────────────────────────────┐
│ MORX BioFace Device - Final Settings           │
├─────────────────────────────────────────────────┤
│ Network Settings:                               │
│   Device IP: 192.168.1.24                       │
│   Gateway: 192.168.1.1                          │
│   DHCP: ON                                      │
│                                                 │
│ Communication Settings:                         │
│   Server-Client Mode: LogClient                 │
│   Event Transfer Mode: YES ← Changed            │
│   Host PC Addr: <EC2-Public-IP> ← Added        │
│   Host PC Port: 4001 ← Changed                  │
│                                                 │
│ Device Info:                                    │
│   Model: BioFace-MSD1K                          │
│   MAC: 00:23:79:bb:a1:ab                        │
└─────────────────────────────────────────────────┘
```

---

## 🧪 Testing Device Connection

### Test 1: Network Connectivity

```bash
# From your office network, ping device
ping 192.168.1.24

# Expected: Reply from 192.168.1.24
```

### Test 2: Device Can Reach EC2

```bash
# From device network (any PC on same network)
curl http://<ec2-ip>:4001/api/v1/biometric/test

# Expected response:
{
  "success": true,
  "message": "Biometric webhook endpoint is working!"
}
```

### Test 3: Device Sends Data

```
1. Register test employee in device:
   - Employee ID: TEST001
   - Scan fingerprint

2. Do test punch

3. Check EC2 logs:
   ssh ec2-user@<ec2-ip>
   pm2 logs staffinn-backend --lines 20

4. Expected log:
   📥 Device webhook received: { employeeId: 'TEST001', ... }
```

---

## 🔍 Troubleshooting

### Issue 1: Can't Access Device Settings

**Solution:**
```
1. Try default passwords:
   - 123456
   - 000000
   - admin

2. If still locked, check device manual
3. Or contact MORX support
```

### Issue 2: Event Transfer Mode Option Not Visible

**Solution:**
```
1. Update device firmware (if available)
2. Check device manual for "Push Mode" or "Real-time Upload"
3. Alternative names:
   - Auto Upload
   - Real-time Sync
   - Push to Server
```

### Issue 3: Device Shows "Connection Failed"

**Check:**
```
1. EC2 IP correct hai?
   - Public IP use karo, not private
   - Example: 13.232.45.67

2. Port 4001 open hai?
   - AWS Security Group check karo

3. EC2 running hai?
   - curl http://<ec2-ip>:4001/health

4. Device internet access hai?
   - Router se connected hai?
   - Firewall block to nahi kar raha?
```

### Issue 4: Device Sends Data But EC2 Not Receiving

**Check:**
```
1. EC2 logs:
   pm2 logs staffinn-backend --lines 50

2. Port listening hai?
   sudo netstat -tlnp | grep 4001

3. Backend running hai?
   pm2 status

4. Restart backend:
   pm2 restart staffinn-backend
```

---

## 📊 Data Flow Verification

```
Step 1: Employee Punch
├── Employee: Fingerprint scan
├── Device: Verify ✓
└── Device Screen: "EMP001 - Verified"

Step 2: Device Sends Data
├── Device: HTTP POST to EC2
├── URL: http://<ec2-ip>:4001/api/v1/biometric/device-punch
└── Data: { employeeId: "EMP001", timestamp: "...", ... }

Step 3: EC2 Receives
├── Backend: Validates employee
├── DynamoDB: Saves attendance
└── Response: { success: true, ... }

Step 4: HRMS Shows
├── Frontend: Fetches attendance
├── Display: "EMP001 - Rahul Kumar - Present - 09:15"
└── Real-time: 2-3 seconds delay
```

---

## ✅ Configuration Checklist

Before proceeding, verify:

- [ ] Device IP accessible: `ping 192.168.1.24`
- [ ] Admin access working
- [ ] Network settings verified
- [ ] Event Transfer Mode = YES
- [ ] Host PC Addr = EC2 Public IP
- [ ] Host PC Port = 4001
- [ ] Device restarted
- [ ] Configuration saved
- [ ] Test punch successful
- [ ] EC2 logs showing data

---

## 📞 Device Support

**MORX Support:**
- Manual: Check device box or MORX website
- Email: support@morxsecurity.com (example)
- Phone: Check device manual

**Common Settings Locations:**
```
Main Menu
└── Communication
    ├── TCP/IP Settings
    │   ├── TCP/IPv4 (Network config)
    │   └── TCP/IPv6 (Not needed)
    └── Communication Settings
        ├── Server-Client Mode
        ├── Event Transfer Mode ← Important!
        ├── Host PC Addr ← Important!
        └── Host PC Port ← Important!
```

---

## 🎯 Next Steps

After device configuration:

1. ✅ Verify all settings saved
2. ✅ Test with one employee
3. ✅ Check EC2 logs
4. ✅ Verify DynamoDB entry
5. ✅ Register all employees
6. ✅ Start daily usage

**Device configuration complete! 🚀**
