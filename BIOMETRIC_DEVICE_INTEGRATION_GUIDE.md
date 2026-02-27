# Biometric Device Integration Guide - StaffInn HRMS

## Current Issue
Jab aap "Device Setup" pe click karte ho, to "No biometric device detected" message aa raha hai. Yeh normal hai kyunki abhi tak koi biometric device connect nahi hai.

## Solution Steps

### Option 1: Mantra MFS100 Device (Recommended)

#### Step 1: Device Purchase
- **Device Name**: Mantra MFS100 Fingerprint Scanner
- **Price**: ₹2,000 - ₹3,500
- **Where to Buy**: Amazon, Flipkart, ya local biometric device dealers
- **Link**: https://www.amazon.in/s?k=mantra+mfs100

#### Step 2: SDK Installation
1. Mantra website se SDK download karo:
   - Visit: https://www.mantratec.com/downloads
   - Download: "MFS100 Windows SDK"
   - File size: ~50 MB

2. SDK install karo:
   - Downloaded file ko run karo
   - Installation wizard follow karo
   - Default settings use karo

3. Device drivers install honge automatically

#### Step 3: Device Connection
1. USB cable se device ko computer se connect karo
2. Windows device ko automatically detect karega
3. Device Manager mein check karo ki device properly installed hai

#### Step 4: Testing
1. Mantra SDK ke saath aane wala test application run karo
2. Fingerprint scan karke test karo
3. Agar scan successful hai, to device ready hai

### Option 2: Any Generic Biometric Device

Agar aapke paas koi aur biometric device hai (like Startek, Morpho, etc.):

1. Device ke manufacturer ki website se SDK download karo
2. SDK install karo
3. Device ko USB se connect karo
4. Test application se verify karo

## Bridge Software (Coming Soon)

Abhi ke liye, StaffInn Bridge Software development mein hai. Jab tak yeh ready nahi hota, aap:

### Temporary Solution:
1. Manual attendance marking use karo (Mark Attendance button)
2. Biometric device se fingerprint scan karo
3. Employee ID manually enter karo
4. Check-in/Check-out time record karo

### Future Bridge Software Features:
- Automatic device detection
- Real-time attendance sync
- Multiple device support
- Face recognition support
- Network-based device support

## Current Workaround

Abhi aap yeh kar sakte ho:

1. **Attendance Page** pe jao
2. **"Mark Attendance"** button click karo
3. Employee select karo
4. Check-in time enter karo
5. Save karo

Yeh manual process hai, lekin kaam karega jab tak automatic biometric integration ready nahi hota.

## API Integration (For Developers)

Agar aap khud Bridge software develop karna chahte ho:

### Required Endpoints:
```javascript
// Device Registration
POST /api/v1/hrms/devices/register
Body: {
  deviceId: "DEVICE_001",
  deviceType: "fingerprint",
  companyId: "COMP-6AFF34A1"
}

// Attendance Sync
POST /api/v1/hrms/attendance/sync
Body: {
  employeeId: "EMP001",
  deviceId: "DEVICE_001",
  timestamp: "2026-02-20T10:30:00Z",
  biometricData: "..."
}
```

### SDK Integration:
```javascript
// Example: Mantra MFS100 Integration
const MantraSDK = require('mantra-mfs100-sdk');

const device = new MantraSDK.Device();
device.connect();

device.on('fingerprint', (data) => {
  // Send to StaffInn API
  fetch('http://localhost:4001/api/v1/hrms/attendance/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      employeeId: data.employeeId,
      timestamp: new Date().toISOString(),
      biometricData: data.fingerprint
    })
  });
});
```

## Troubleshooting

### Device Not Detected
1. USB cable properly connected hai?
2. Device drivers installed hain?
3. Device Manager mein device visible hai?
4. Device ka power LED on hai?

### SDK Installation Failed
1. Windows version compatible hai? (Windows 10/11 required)
2. Administrator rights se install karo
3. Antivirus temporarily disable karo
4. Previous SDK version uninstall karo

### Fingerprint Not Scanning
1. Finger clean aur dry hai?
2. Scanner surface clean hai?
3. Proper pressure apply kar rahe ho?
4. Different finger try karo

## Support

Agar koi problem aa rahi hai:
1. Device manufacturer ka support contact karo
2. SDK documentation padho
3. StaffInn support team ko contact karo

## Next Steps

1. **Immediate**: Manual attendance marking use karo
2. **Short-term**: Biometric device purchase karo aur SDK install karo
3. **Long-term**: Bridge software release hone ka wait karo

---

**Note**: Yeh guide temporary solution hai. Full automated biometric integration jald hi available hoga.
