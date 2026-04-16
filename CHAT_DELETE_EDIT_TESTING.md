# Chat Delete & Edit - Quick Testing Guide

## 🎯 Quick Test Scenarios (5 minutes)

### Test 1: Edit Message (Before Read) ✅

**Steps:**
1. Send text message: "Hello"
2. Click dropdown arrow (▼) on message
3. Click "Edit"
4. Change to: "Hello there!"
5. Click "Save"

**Expected Result:**
```
┌─────────────────────────────────┐
│  Hello there!                   │
│  (edited) 02:05 PM              │
└─────────────────────────────────┘
```
✅ Message updated
✅ Shows "(edited)" indicator
✅ Other user sees edited message

---

### Test 2: Edit Not Available (After Read) ✅

**Steps:**
1. Send text message
2. Wait for other user to read it (double check mark turns blue)
3. Click dropdown arrow (▼)

**Expected Result:**
```
┌──────────────┐
│ 🗑️ Delete    │  ← Only delete option
└──────────────┘
```
❌ Edit option NOT shown
✅ Only Delete option available

---

### Test 3: Delete for Me ✅

**Steps:**
1. Send message: "Test message"
2. Click dropdown arrow (▼)
3. Click "Delete"
4. Select "Delete for Me"

**Expected Result:**
- ✅ Message disappears from YOUR chat
- ✅ Other user STILL sees message
- ✅ No notification to other user

**Your View:**
```
┌─────────────────────────────────┐
│  (message gone)                 │
└─────────────────────────────────┘
```

**Other User's View:**
```
┌─────────────────────────────────┐
│  Test message        02:05 PM   │
└─────────────────────────────────┘
```

---

### Test 4: Delete for Everyone (Before Read) ✅

**Steps:**
1. Send message: "Oops wrong message"
2. BEFORE other user reads it
3. Click dropdown arrow (▼)
4. Click "Delete"
5. Select "Delete for Everyone"

**Expected Result:**

**Your View:**
```
┌─────────────────────────────────┐
│  🚫 Message Deleted  02:05 PM   │
└─────────────────────────────────┘
```

**Other User's View:**
```
┌─────────────────────────────────┐
│  🚫 Message Deleted  02:05 PM   │
└─────────────────────────────────┘
```
✅ Both users see "Message Deleted"
✅ Original content hidden

---

### Test 5: Delete for Everyone NOT Available (After Read) ✅

**Steps:**
1. Send message
2. Wait for other user to read it
3. Click dropdown arrow (▼)
4. Click "Delete"

**Expected Result:**
```
┌─────────────────────────────────┐
│ Delete Message?                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 Delete for Me            │ │
│ └─────────────────────────────┘ │
│                                 │
│ (No "Delete for Everyone")      │
│                                 │
│ [Cancel]                        │
└─────────────────────────────────┘
```
❌ "Delete for Everyone" NOT shown
✅ Only "Delete for Me" available

---

### Test 6: Multiple Selection ✅

**Steps:**
1. Click checkbox icon (☑️) in header
2. Select 3 messages by clicking checkboxes
3. Click "Delete" button in header
4. Choose "Delete for Me"

**Expected Result:**

**Selection Mode:**
```
┌─────────────────────────────────┐
│ [X] 3 selected      [🗑️ Delete] │
├─────────────────────────────────┤
│ ☑️ Message 1         02:05 PM   │
│ ☑️ Message 2         02:06 PM   │
│ ☑️ Message 3         02:07 PM   │
│ ☐ Message 4         02:08 PM   │
└─────────────────────────────────┘
```

**After Delete:**
```
┌─────────────────────────────────┐
│  Message 4          02:08 PM    │
└─────────────────────────────────┘
```
✅ All 3 selected messages deleted
✅ Selection mode exits
✅ Unselected messages remain

---

### Test 7: File Message (No Edit) ✅

**Steps:**
1. Send a photo
2. Click dropdown arrow (▼)

**Expected Result:**
```
┌──────────────┐
│ 🗑️ Delete    │  ← Only delete option
└──────────────┘
```
❌ Edit option NOT shown (files can't be edited)
✅ Delete options available

---

## 🔍 Visual Inspection Points

### Message Dropdown Menu
**Location:** Top-right of sent messages
**Icon:** ▼ (chevron down)
**Hover:** Gray background
**Click:** Opens menu

### Edit Option
**When Shown:**
- ✅ Sender's message
- ✅ Text message (not file)
- ✅ Message unread
- ✅ Not deleted

**When Hidden:**
- ❌ Message read
- ❌ File message
- ❌ Receiver's message

### Delete for Everyone Option
**When Shown:**
- ✅ Sender's message
- ✅ Message unread

**When Hidden:**
- ❌ Message read
- ❌ Receiver's message

### Selection Mode
**Activate:** Click ☑️ icon in header
**Shows:**
- Checkboxes on all messages
- Selection count in header
- Delete button in header
- Cancel (X) button

---

## ✅ Success Criteria Checklist

### Edit Functionality
- [ ] Edit option appears for unread text messages
- [ ] Edit option hidden for read messages
- [ ] Edit option hidden for file messages
- [ ] Edit modal opens with current text
- [ ] Message updates after editing
- [ ] "(edited)" indicator shows
- [ ] Other user sees edited message

### Delete for Me
- [ ] Option always available
- [ ] Message disappears from own chat
- [ ] Other user still sees message
- [ ] Works for all message types
- [ ] Works for read/unread messages

### Delete for Everyone
- [ ] Option available for unread messages
- [ ] Option hidden for read messages
- [ ] Shows "Message Deleted" for both users
- [ ] Only sender can use this option
- [ ] Works for all message types

### Multiple Selection
- [ ] Selection mode activates
- [ ] Checkboxes appear on messages
- [ ] Can select/deselect messages
- [ ] Count shows in header
- [ ] Bulk delete works
- [ ] Selection mode exits after delete

### UI/UX
- [ ] Dropdown menu appears on click
- [ ] Modals are centered
- [ ] Buttons are responsive
- [ ] Hover effects work
- [ ] Icons display correctly
- [ ] Mobile responsive

---

## 🐛 Common Issues to Check

### Issue 1: Dropdown Not Opening
**Check:**
- Click on arrow icon (▼)
- Check console for errors
- Verify message is sent by current user

### Issue 2: Edit Not Available
**Check:**
- Is message read? (blue double check)
- Is it a text message? (not file)
- Are you the sender?

### Issue 3: Delete for Everyone Not Available
**Check:**
- Is message read?
- Are you the sender?
- Check message status field

### Issue 4: Selection Mode Not Working
**Check:**
- Click checkbox icon in header
- Verify checkboxes appear
- Check console for errors

---

## 📊 Test Matrix

| Message Type | Sender (Unread) | Sender (Read) | Receiver |
|--------------|----------------|---------------|----------|
| **Text - Edit** | ✅ Yes | ❌ No | ❌ No |
| **Text - Delete Me** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Text - Delete All** | ✅ Yes | ❌ No | ❌ No |
| **Photo - Edit** | ❌ No | ❌ No | ❌ No |
| **Photo - Delete Me** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Photo - Delete All** | ✅ Yes | ❌ No | ❌ No |
| **Video - Edit** | ❌ No | ❌ No | ❌ No |
| **Video - Delete Me** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Video - Delete All** | ✅ Yes | ❌ No | ❌ No |
| **Document - Edit** | ❌ No | ❌ No | ❌ No |
| **Document - Delete Me** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Document - Delete All** | ✅ Yes | ❌ No | ❌ No |

---

## 🎯 Quick 2-Minute Test

1. **Send text message** (10 sec)
   - ✅ Dropdown appears

2. **Click Edit** (20 sec)
   - ✅ Modal opens
   - ✅ Can edit text
   - ✅ Shows "(edited)"

3. **Send another message** (10 sec)
   - ✅ Dropdown appears

4. **Delete for Me** (20 sec)
   - ✅ Message disappears
   - ✅ Other user still sees it

5. **Send third message** (10 sec)
   - ✅ Dropdown appears

6. **Delete for Everyone** (20 sec)
   - ✅ Shows "Message Deleted"
   - ✅ Both users see it

7. **Enable selection mode** (10 sec)
   - ✅ Checkboxes appear

8. **Select 2 messages** (10 sec)
   - ✅ Count shows "2 selected"

9. **Bulk delete** (20 sec)
   - ✅ Both messages deleted
   - ✅ Selection mode exits

**Total Time:** ~2 minutes
**Result:** All features working ✅

---

## 📸 Screenshot Checklist

### Screenshots to Verify

1. **Message with dropdown arrow**
   - [ ] Arrow visible on sent messages
   - [ ] Hover effect works

2. **Dropdown menu open**
   - [ ] Edit option (if unread)
   - [ ] Delete option
   - [ ] Proper styling

3. **Edit modal**
   - [ ] Text area with current message
   - [ ] Cancel and Save buttons
   - [ ] Centered on screen

4. **Delete modal**
   - [ ] Two options shown (if unread)
   - [ ] One option shown (if read)
   - [ ] Clear descriptions

5. **Deleted message**
   - [ ] Shows "Message Deleted"
   - [ ] Gray styling
   - [ ] Ban icon visible

6. **Edited message**
   - [ ] Shows "(edited)" label
   - [ ] Updated text
   - [ ] Proper formatting

7. **Selection mode**
   - [ ] Checkboxes on messages
   - [ ] Count in header
   - [ ] Delete button visible

---

## 📝 Test Report Template

```
Date: _______________
Tester: _______________
Browser: _______________

Feature Tests:
[ ] Edit message (unread)
[ ] Edit not available (read)
[ ] Delete for me
[ ] Delete for everyone (unread)
[ ] Delete for everyone not available (read)
[ ] Multiple selection
[ ] Bulk delete
[ ] File message (no edit)

UI Tests:
[ ] Dropdown menu appears
[ ] Modals centered
[ ] Buttons responsive
[ ] Icons display
[ ] Mobile responsive

Issues Found:
_______________________________
_______________________________

Status: ✅ PASS / ❌ FAIL

Notes:
_______________________________
_______________________________
```

---

**Last Updated:** April 8, 2026
**Version:** 2.0.0
**Status:** ✅ Ready for Testing
