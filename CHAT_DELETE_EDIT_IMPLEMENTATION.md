# Chat Delete & Edit Functionality - Implementation Guide

## ✅ All Features Implemented Successfully

### Overview
Successfully implemented comprehensive delete and edit functionality for chat messages with read status awareness, including single and bulk operations.

---

## 🎯 Features Implemented

### 1. ✅ Message Dropdown Menu
- **Arrow icon** on every sent message
- Opens dropdown with available options
- Options change based on message status (read/unread)

### 2. ✅ Delete Options
**Two Delete Types:**
- **Delete for Me** - Removes message only from current user's view
- **Delete for Everyone** - Removes message from both users' chats

**Conditions:**
- Delete for Me: Always available
- Delete for Everyone: Only available if message is unread

### 3. ✅ Delete for Me
- Message deleted only from current user's chat
- Other user still sees the message
- No indication to other user

### 4. ✅ Delete for Everyone
- Message deleted from both users' chats
- Shows "Message Deleted" placeholder
- Only available before message is read
- Only sender can delete for everyone

### 5. ✅ Edit Message
- Edit text messages only (not files)
- Shows "(edited)" indicator after editing
- Only available before message is read
- Only sender can edit their messages

### 6. ✅ Multiple Selection
- Select multiple messages with checkboxes
- Bulk delete selected messages
- Selection mode toggle in header
- Shows count of selected messages

### 7. ✅ Read Status Awareness
**Before Message is Read:**
- ✅ Delete for Everyone available
- ✅ Edit available
- ✅ Delete for Me available

**After Message is Read:**
- ❌ Delete for Everyone NOT available
- ❌ Edit NOT available
- ✅ Delete for Me still available

---

## 📋 Implementation Details

### Backend Changes

#### 1. Message Controller (`messageController.js`)

**New Methods:**
```javascript
// Edit message (only if unread)
static async editMessage(req, res)

// Delete message with type
static async deleteMessage(req, res)

// Bulk delete messages
static async deleteMultipleMessages(req, res)
```

**Key Features:**
- Read status validation
- Sender verification
- Delete type handling (forMe/forEveryone)
- Bulk operation support

#### 2. Message Model (`messageModel.js`)

**New Methods:**
```javascript
// Delete for everyone (shows "Message Deleted")
static async deleteForEveryone(messageId, createdAt)

// Delete for specific user only
static async deleteForUser(messageId, createdAt, userId)

// Edit message text
static async editMessage(messageId, createdAt, newMessage)
```

**Updated Methods:**
```javascript
// Filter deleted messages per user
static async getConversation(userId1, userId2, limit)
```

**New Fields in Messages:**
- `deletedForEveryone` - Boolean
- `deletedForSender` - Boolean
- `deletedForReceiver` - Boolean
- `edited` - Boolean

#### 3. Routes (`messageRoutes.js`)

**New Endpoints:**
```javascript
// Edit message
PUT /api/v1/messages/:messageId/:createdAt/edit

// Delete message (with type in body)
DELETE /api/v1/messages/:messageId/:createdAt

// Bulk delete
POST /api/v1/messages/delete-multiple
```

---

### Frontend Changes

#### 1. ChatWindow Component (`ChatWindow.jsx`)

**New State Variables:**
```javascript
const [selectedMessages, setSelectedMessages] = useState(new Set());
const [selectionMode, setSelectionMode] = useState(false);
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [messageToDelete, setMessageToDelete] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
const [messageToEdit, setMessageToEdit] = useState(null);
const [editText, setEditText] = useState('');
const [showMessageMenu, setShowMessageMenu] = useState(null);
```

**New Functions:**
```javascript
// Message selection
handleMessageSelect(messageId)
toggleSelectionMode()

// Delete operations
handleDeleteClick(message)
handleDeleteConfirm(deleteType)
handleBulkDelete()

// Edit operations
handleEditClick(message)
handleEditConfirm()

// Permission checks
canDeleteForEveryone(message)
canEdit(message)
```

**UI Components Added:**
- Message dropdown menu (arrow icon)
- Selection mode header
- Message checkboxes
- Delete confirmation modal
- Edit message modal
- Deleted message placeholder
- Edited indicator

#### 2. Message API (`messageApi.js`)

**New Methods:**
```javascript
// Edit message
editMessage: async (messageId, createdAt, newMessage)

// Delete with type
deleteMessageWithType: async (messageId, createdAt, deleteType)

// Bulk delete
deleteMultipleMessages: async (messages, deleteType)
```

#### 3. Styles (`ChatWindow.css`)

**New CSS Classes:**
```css
/* Selection Mode */
.selection-header
.select-messages-btn
.selection-count
.bulk-delete-btn
.message-checkbox

/* Message Menu */
.message-menu-trigger
.message-menu-btn
.message-dropdown-menu

/* Delete Modal */
.delete-modal-overlay
.delete-modal-content
.delete-options
.delete-option-btn

/* Edit Modal */
.edit-modal-overlay
.edit-modal-content
.edit-textarea
.edit-modal-actions
```

---

## 🎨 User Interface

### Message Dropdown Menu
```
┌─────────────────────────────────┐
│  Hello!              02:05 PM   │
│                          [▼]    │
│                     ┌─────────┐ │
│                     │ ✏️ Edit  │ │
│                     │ 🗑️ Delete│ │
│                     └─────────┘ │
└─────────────────────────────────┘
```

### Selection Mode
```
┌─────────────────────────────────┐
│ [X] 3 selected      [🗑️ Delete] │
├─────────────────────────────────┤
│ ☑️ Hello!            02:05 PM   │
│ ☑️ How are you?      02:06 PM   │
│ ☑️ Good morning      02:07 PM   │
│ ☐ See you later      02:08 PM   │
└─────────────────────────────────┘
```

### Delete Modal
```
┌─────────────────────────────────┐
│ Delete Message?                 │
│                                 │
│ Are you sure you want to        │
│ delete this message?            │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👤 Delete for Me            │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 👥 Delete for Everyone      │ │
│ └─────────────────────────────┘ │
│                                 │
│ [Cancel]                        │
└─────────────────────────────────┘
```

### Edit Modal
```
┌─────────────────────────────────┐
│ Edit Message                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Hello! How are you doing?   │ │
│ │                             │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                 │
│         [Cancel]  [Save]        │
└─────────────────────────────────┘
```

### Deleted Message
```
┌─────────────────────────────────┐
│  🚫 Message Deleted  02:05 PM   │
└─────────────────────────────────┘
```

### Edited Message
```
┌─────────────────────────────────┐
│  Hello! How are you?            │
│  (edited) 02:05 PM              │
└─────────────────────────────────┘
```

---

## 🔐 Security & Permissions

### Permission Matrix

| Action | Sender (Unread) | Sender (Read) | Receiver |
|--------|----------------|---------------|----------|
| **Edit** | ✅ Yes | ❌ No | ❌ No |
| **Delete for Me** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Delete for Everyone** | ✅ Yes | ❌ No | ❌ No |

### Validation Rules

**Edit Message:**
- ✅ Must be sender
- ✅ Message must be unread
- ✅ Message must be text (not file)
- ✅ New text cannot be empty

**Delete for Everyone:**
- ✅ Must be sender
- ✅ Message must be unread
- ✅ Applies to all message types

**Delete for Me:**
- ✅ Can be sender or receiver
- ✅ Works for any message status
- ✅ Applies to all message types

---

## 📊 Database Schema Updates

### Messages Table (DynamoDB)

**New Fields:**
```javascript
{
  messageId: string,
  createdAt: string,
  senderId: string,
  receiverId: string,
  message: string,
  messageType: string,
  status: string,              // 'unread' | 'read'
  
  // NEW FIELDS
  deletedForEveryone: boolean, // If true, shows "Message Deleted"
  deletedForSender: boolean,   // If true, hidden for sender
  deletedForReceiver: boolean, // If true, hidden for receiver
  edited: boolean,             // If true, shows "(edited)"
  
  attachments: array,
  updatedAt: string
}
```

---

## 🧪 Testing Guide

### Test 1: Edit Message (Unread)
**Steps:**
1. Send a text message
2. Click dropdown arrow on message
3. Click "Edit"
4. Modify text
5. Click "Save"

**Expected:**
- ✅ Message text updates
- ✅ Shows "(edited)" indicator
- ✅ Other user sees edited message

### Test 2: Edit Message (Read)
**Steps:**
1. Send a text message
2. Wait for other user to read it
3. Try to edit

**Expected:**
- ❌ Edit option not available in dropdown
- ✅ Only Delete option shown

### Test 3: Delete for Me
**Steps:**
1. Send a message
2. Click dropdown arrow
3. Click "Delete"
4. Select "Delete for Me"

**Expected:**
- ✅ Message disappears from your chat
- ✅ Other user still sees message
- ✅ Works for read/unread messages

### Test 4: Delete for Everyone (Unread)
**Steps:**
1. Send a message
2. Before other user reads it
3. Click dropdown arrow
4. Click "Delete"
5. Select "Delete for Everyone"

**Expected:**
- ✅ Message shows "Message Deleted" for both users
- ✅ Original content hidden

### Test 5: Delete for Everyone (Read)
**Steps:**
1. Send a message
2. Wait for other user to read it
3. Try to delete for everyone

**Expected:**
- ❌ "Delete for Everyone" option not available
- ✅ Only "Delete for Me" available

### Test 6: Multiple Selection
**Steps:**
1. Click checkbox icon in header
2. Select multiple messages
3. Click "Delete" button
4. Choose delete type

**Expected:**
- ✅ All selected messages deleted
- ✅ Selection mode exits
- ✅ Checkboxes disappear

### Test 7: File Message Delete
**Steps:**
1. Send a photo/video/document
2. Click dropdown arrow
3. Try to edit

**Expected:**
- ❌ Edit option not available
- ✅ Delete options available

---

## 🎯 Feature Comparison

### Before vs After

| Feature | Before ❌ | After ✅ |
|---------|----------|---------|
| **Edit Messages** | Not available | Available (if unread) |
| **Delete Options** | Permanent delete | Delete for Me/Everyone |
| **Bulk Delete** | Not available | Select multiple |
| **Read Awareness** | Not considered | Fully implemented |
| **Deleted Indicator** | Message disappears | Shows "Message Deleted" |
| **Edited Indicator** | Not shown | Shows "(edited)" |

---

## 🚀 API Reference

### Edit Message
```javascript
PUT /api/v1/messages/:messageId/:createdAt/edit

Headers:
  Authorization: Bearer {token}

Body:
{
  "newMessage": "Updated message text"
}

Response:
{
  "success": true,
  "message": "Message edited successfully",
  "data": {
    "messageId": "...",
    "createdAt": "...",
    "newMessage": "Updated message text"
  }
}
```

### Delete Message
```javascript
DELETE /api/v1/messages/:messageId/:createdAt

Headers:
  Authorization: Bearer {token}

Body:
{
  "deleteType": "forMe" | "forEveryone"
}

Response:
{
  "success": true,
  "message": "Message deleted successfully"
}
```

### Bulk Delete
```javascript
POST /api/v1/messages/delete-multiple

Headers:
  Authorization: Bearer {token}

Body:
{
  "messages": [
    { "messageId": "...", "createdAt": "..." },
    { "messageId": "...", "createdAt": "..." }
  ],
  "deleteType": "forMe" | "forEveryone"
}

Response:
{
  "success": true,
  "message": "Bulk delete completed",
  "data": [
    { "messageId": "...", "success": true },
    { "messageId": "...", "success": false, "reason": "..." }
  ]
}
```

---

## 💡 Usage Examples

### Frontend - Edit Message
```javascript
const handleEdit = async (messageId, createdAt, newText) => {
  const response = await messageApi.editMessage(
    messageId,
    createdAt,
    newText
  );
  
  if (response.success) {
    // Refresh conversation
    fetchConversation();
  }
};
```

### Frontend - Delete Message
```javascript
const handleDelete = async (messageId, createdAt, type) => {
  const response = await messageApi.deleteMessageWithType(
    messageId,
    createdAt,
    type // 'forMe' or 'forEveryone'
  );
  
  if (response.success) {
    // Refresh conversation
    fetchConversation();
  }
};
```

### Frontend - Bulk Delete
```javascript
const handleBulkDelete = async (selectedIds, type) => {
  const messages = Array.from(selectedIds).map(id => {
    const msg = messages.find(m => m.messageId === id);
    return {
      messageId: msg.messageId,
      createdAt: msg.createdAt
    };
  });
  
  const response = await messageApi.deleteMultipleMessages(
    messages,
    type
  );
  
  if (response.success) {
    // Refresh conversation
    fetchConversation();
  }
};
```

---

## 🐛 Error Handling

### Common Errors

**Error: "Cannot edit message after it has been read"**
- **Cause:** Trying to edit a read message
- **Solution:** Edit option automatically hidden for read messages

**Error: "Cannot delete for everyone after message has been read"**
- **Cause:** Trying to delete for everyone after message is read
- **Solution:** Delete for everyone option automatically hidden

**Error: "Only sender can edit message"**
- **Cause:** Receiver trying to edit sender's message
- **Solution:** Edit option only shown to sender

**Error: "Only sender can delete for everyone"**
- **Cause:** Receiver trying to delete for everyone
- **Solution:** Delete for everyone option only shown to sender

---

## 📝 Summary

### What Was Implemented

✅ **Message Dropdown Menu** - Arrow icon with edit/delete options
✅ **Delete for Me** - Remove message from own view only
✅ **Delete for Everyone** - Remove message from both users (if unread)
✅ **Edit Messages** - Edit text messages (if unread)
✅ **Multiple Selection** - Select and delete multiple messages
✅ **Read Status Awareness** - Options change based on read status
✅ **Deleted Indicator** - Shows "Message Deleted" placeholder
✅ **Edited Indicator** - Shows "(edited)" label
✅ **Bulk Operations** - Delete multiple messages at once

### Key Features

- **Smart Permissions** - Options based on sender/receiver and read status
- **User-Friendly UI** - Clear modals and confirmations
- **Data Isolation** - Proper delete handling per user
- **No Breaking Changes** - All existing features work perfectly

---

**Implementation Date:** April 8, 2026
**Version:** 2.0.0
**Status:** ✅ COMPLETE
**Developer:** Amazon Q
