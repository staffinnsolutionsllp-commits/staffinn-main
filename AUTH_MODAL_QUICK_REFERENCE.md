# Auth Modal - Quick Reference Guide

## 🚀 Quick Start

The authentication modal has been completely redesigned with three views:
1. **Login** (default)
2. **Register as Staff**
3. **Registration Request** (Institute/Recruiter)

## 📂 File Structure

```
Frontend/src/Components/Header/
├── Header.jsx          (Modified - added modal views)
├── Header.css          (Cleaned - header styles only)
└── AuthModal.css       (New - all modal styles)
```

## 🎨 Modal Views

### Switch Between Views

```javascript
// In Header.jsx state
const [modalView, setModalView] = useState('login');

// Switch views
setModalView('login');           // Login view
setModalView('registerStaff');   // Staff registration
setModalView('registerPartner'); // Partner registration
```

### View Triggers

**Login View:**
- Default when modal opens
- "Back to Login" links from other views

**Register Staff View:**
- "REGISTER" button from login left panel
- "REGISTER" button from mobile fallback (login view)

**Registration Request View:**
- "Register as Institute / Recruiter" button (green)
- Available from both login and staff views

## 🎯 Key CSS Classes

### Modal Structure
```css
.auth-modal-backdrop          /* Overlay with blur */
.auth-modal-container         /* Main modal card */
.auth-modal-left              /* Left branding panel */
.auth-modal-right             /* Right form panel */
```

### Gradients
```css
.blue-gradient                /* Login/Staff view */
.green-gradient               /* Partner view */
```

### Form Elements
```css
.auth-input                   /* All input fields */
.input-wrapper                /* Input container */
.input-icon-left              /* Left icons (mail, lock) */
.password-toggle              /* Eye icon button */
.submit-btn                   /* Primary buttons */
.submit-btn.dark              /* Dark variant */
```

### Special Components
```css
.custom-dropdown              /* Type selector */
.dropdown-menu                /* Dropdown options */
.progress-bar                 /* Registration progress */
.info-banner                  /* Info messages */
.mobile-only-actions          /* Mobile fallback buttons */
```

## 📱 Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 769px) {
  /* Two-panel layout */
  /* Left panel visible */
}

/* Mobile */
@media (max-width: 768px) {
  /* Single panel */
  /* Left panel hidden */
  /* Mobile buttons shown */
}

/* Small Mobile */
@media (max-width: 480px) {
  /* Optimized spacing */
  /* Smaller fonts */
}
```

## 🎭 Animations

### Modal Entrance
```css
Backdrop: backdropFadeIn (200ms)
Container: modalScaleIn (300ms spring)
Mobile: modalSlideUp (300ms)
```

### Floating Circles
```css
.circle-1 to .circle-4
Animation: float1 to float4 (6-9s infinite)
```

### Transitions
```css
All: 150-200ms ease
Buttons: translateY(-2px) on hover
Close: rotate(90deg) on hover
```

## 🔧 Customization Points

### Colors
```css
/* In AuthModal.css */
Primary Blue: #2563EB
Green: #10B981
Navy: #0F172A
Background: #F8FAFC
Border: #E2E8F0
```

### Spacing
```css
Modal padding: 48px (desktop), 24px (mobile)
Input height: 52px
Button height: 52px (desktop), 56px (mobile)
Gap: 1rem (16px)
```

### Typography
```css
Font: 'Inter', sans-serif
Title: 1.625rem (26px), weight 800
Subtitle: 0.875rem (14px)
Input: 0.9375rem (15px)
```

## 🎯 Common Tasks

### Add New Input Field
```jsx
<div className="input-wrapper">
  <Mail className="input-icon-left" size={20} />
  <input
    type="email"
    placeholder="Email"
    className="auth-input"
    required
  />
</div>
```

### Add New Button
```jsx
<button className="submit-btn">
  BUTTON TEXT
</button>

/* Dark variant */
<button className="submit-btn dark">
  BUTTON TEXT
</button>
```

### Add Phone Input with Prefix
```jsx
<div className="input-wrapper">
  <div className="phone-prefix">+91 🇮🇳</div>
  <input
    type="tel"
    placeholder="Phone Number *"
    className="auth-input phone-input"
    required
  />
</div>
```

### Add Custom Dropdown
```jsx
<div className="custom-dropdown" onClick={() => setShowDropdown(!showDropdown)}>
  <input
    type="text"
    placeholder="Select Type *"
    value={selectedValue}
    className="auth-input dropdown-input"
    readOnly
    required
  />
  <ChevronDown className={`dropdown-icon ${showDropdown ? 'rotate' : ''}`} size={20} />
  
  {showDropdown && (
    <div className="dropdown-menu">
      <div className="dropdown-header">Select Type *</div>
      <div className="dropdown-item" onClick={() => handleSelect('Option 1')}>
        <Icon size={18} />
        <span>Option 1</span>
      </div>
    </div>
  )}
</div>
```

## 🐛 Troubleshooting

### Modal Not Opening
- Check `showLoginModal` state
- Verify `setShowLoginModal(true)` is called
- Check z-index conflicts

### Styles Not Applied
- Ensure `AuthModal.css` is imported
- Check CSS file path
- Clear browser cache

### Icons Not Showing
- Verify lucide-react is installed
- Check import statements
- Ensure icon names are correct

### Mobile View Issues
- Check viewport meta tag
- Test on actual devices
- Verify media queries

### Animations Not Working
- Check browser support
- Verify CSS animations are enabled
- Test in different browsers

## 📋 Checklist for New Features

When adding new features to the modal:

- [ ] Add state management in Header.jsx
- [ ] Create UI in appropriate modal view
- [ ] Add styles in AuthModal.css
- [ ] Test on desktop
- [ ] Test on mobile
- [ ] Test view switching
- [ ] Test form submission
- [ ] Verify animations
- [ ] Check accessibility
- [ ] Update documentation

## 🔗 Related Files

- `Header.jsx` - Main component with modal logic
- `Header.css` - Header-specific styles
- `AuthModal.css` - All modal styles
- `AuthContext.jsx` - Authentication logic (unchanged)

## 💡 Tips

1. **Always test on mobile** - The mobile view is significantly different
2. **Use existing classes** - Reuse CSS classes for consistency
3. **Maintain animations** - Keep transition times consistent
4. **Follow spacing** - Use the established spacing system
5. **Test all views** - Ensure all three views work correctly
6. **Check responsiveness** - Test at various screen sizes
7. **Preserve functionality** - Never break existing features

## 🎨 Design Tokens

```css
/* Spacing Scale */
xs: 0.5rem (8px)
sm: 0.75rem (12px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
2xl: 3rem (48px)

/* Border Radius */
sm: 8px
md: 12px
lg: 16px
xl: 20px
full: 9999px

/* Shadows */
sm: 0 1px 2px rgba(0,0,0,0.05)
md: 0 4px 6px rgba(0,0,0,0.1)
lg: 0 10px 15px rgba(0,0,0,0.1)
xl: 0 20px 25px rgba(0,0,0,0.1)
```

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the main documentation
3. Test in isolation
4. Check browser console
5. Verify all dependencies

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
