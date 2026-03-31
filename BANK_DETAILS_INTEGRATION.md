# 🔧 BankDetailsForm Integration Guide

## Quick Integration (5 Minutes)

### Step 1: Import Component
Add this import at the top of `InstituteDashboard.jsx` (around line 20):

```jsx
import BankDetailsForm from './BankDetailsForm';
```

### Step 2: Add Sidebar Menu Item
Find the sidebar menu section (around line 200-300) and add:

```jsx
<li className={activeTab === 'bank-details' ? 'active' : ''} onClick={() => handleTabChange('bank-details')}>
    💳 Bank Details
</li>
```

**Recommended Position**: After "My Profile" or before "My Courses"

### Step 3: Add Tab Content
Find the tab content sections (around line 800-1000) and add:

```jsx
{activeTab === 'bank-details' && (
    <div className="institute-bank-details-tab">
        <div className="institute-tab-header">
            <h1>Bank Account Details</h1>
            <p>Add your bank account details to receive course payments</p>
        </div>
        <BankDetailsForm />
    </div>
)}
```

**Recommended Position**: After the profile tab content

### Step 4: Test
1. Open Institute Dashboard
2. Click "Bank Details" in sidebar
3. Fill form and submit
4. Check verification status

## Alternative: Add to Existing Tab

If you want to add it to an existing tab (e.g., Profile), just add:

```jsx
{activeTab === 'profile' && (
    <div className="institute-profile-tab">
        {/* Existing profile content */}
        
        {/* Add Bank Details Section */}
        <div className="institute-bank-details-section" style={{marginTop: '40px'}}>
            <h2>Bank Account Details</h2>
            <p>Add your bank account details to receive course payments</p>
            <BankDetailsForm />
        </div>
    </div>
)}
```

## Verification Status Badges

The form automatically shows:
- 🟡 **Pending Verification** - Yellow badge
- 🟢 **Verified** - Green badge  
- 🔴 **Rejected** - Red badge with reason

## Form Fields

- Account Holder Name *
- Account Number *
- IFSC Code *
- Bank Name *
- Branch Name *
- Account Type * (Savings/Current)
- PAN Number *
- GST Number (Optional)

## API Endpoints Used

- `POST /api/v1/institute/bank-details` - Save details
- `GET /api/v1/institute/bank-details` - Get details
- `DELETE /api/v1/institute/bank-details` - Delete details

## Admin Verification

Admins can verify bank details via:
- `PUT /api/v1/institute/bank-details/:id/verify`
- `GET /api/v1/institute/bank-details/pending` - View pending
- `GET /api/v1/institute/bank-details/verified` - View verified

## Testing Checklist

- [ ] Form loads correctly
- [ ] All fields are editable
- [ ] Form validation works
- [ ] Submit button shows loading state
- [ ] Success message appears after save
- [ ] Existing details load on page refresh
- [ ] Verification status badge displays correctly
- [ ] Rejection reason shows if rejected

## Troubleshooting

### Form not showing?
- Check import path: `./BankDetailsForm`
- Verify component is in same directory
- Check console for errors

### API errors?
- Verify backend is running
- Check token in localStorage
- Verify API endpoint: `/api/v1/institute/bank-details`

### Styling issues?
- BankDetailsForm has built-in styles
- Uses Tailwind CSS classes
- Should work with existing dashboard styles

## Done! 🎉

Your institute dashboard now has bank details management!
