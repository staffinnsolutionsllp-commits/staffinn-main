# 🎨 Authentication Modal - Visual Structure Guide

## 📐 Modal Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    auth-modal-backdrop                       │
│  (Fixed overlay with blur, rgba(15, 23, 42, 0.6))          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         auth-modal-container (900px max)            │    │
│  │  (White card, rounded-3xl, shadow-2xl)             │    │
│  │                                                      │    │
│  │  ┌──────────────────┬──────────────────────────┐  │    │
│  │  │                  │                           │  │    │
│  │  │  auth-modal-left │   auth-modal-right       │  │    │
│  │  │  (50% width)     │   (50% width)            │  │    │
│  │  │                  │                           │  │    │
│  │  │  [Gradient BG]   │   [White BG]             │  │    │
│  │  │  [Floating ●]    │   [Close Button ×]       │  │    │
│  │  │                  │                           │  │    │
│  │  │  Staffinn        │   Login                  │  │    │
│  │  │  Hello, Welcome! │   ─────────              │  │    │
│  │  │  ─────           │   Please enter details   │  │    │
│  │  │                  │                           │  │    │
│  │  │  Don't have      │   📧 Email               │  │    │
│  │  │  an account?     │   🔒 Password  👁        │  │    │
│  │  │                  │   Forgot password?       │  │    │
│  │  │  [REGISTER]      │                           │  │    │
│  │  │                  │   [LOGIN BUTTON]         │  │    │
│  │  │  or              │                           │  │    │
│  │  │                  │   or continue with       │  │    │
│  │  │  [Register as    │   [G Continue with       │  │    │
│  │  │   Institute/     │      Google]             │  │    │
│  │  │   Recruiter]     │                           │  │    │
│  │  │                  │   (Mobile only buttons)  │  │    │
│  │  └──────────────────┴──────────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Mobile Layout Structure

```
┌─────────────────────────────────┐
│   auth-modal-backdrop           │
│   (Full screen)                 │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  auth-modal-container       │ │
│ │  (Full width, slide up)     │ │
│ │  ┌───────────────────────┐  │ │
│ │  │                    × │  │ │
│ │  │                       │  │ │
│ │  │  auth-modal-right     │  │ │
│ │  │  (100% width)         │  │ │
│ │  │                       │  │ │
│ │  │  Login                │  │ │
│ │  │  ─────────            │  │ │
│ │  │  Please enter details │  │ │
│ │  │                       │  │ │
│ │  │  📧 Email             │  │ │
│ │  │  🔒 Password  👁      │  │ │
│ │  │  Forgot password?     │  │ │
│ │  │                       │  │ │
│ │  │  [LOGIN BUTTON]       │  │ │
│ │  │                       │  │ │
│ │  │  or continue with     │  │ │
│ │  │  [G Continue with     │  │ │
│ │  │     Google]           │  │ │
│ │  │                       │  │ │
│ │  │  new to staffinn?     │  │ │
│ │  │  [REGISTER]           │  │ │
│ │  │  [Register as         │  │ │
│ │  │   Institute/Recruiter]│  │ │
│ │  └───────────────────────┘  │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## 🎨 Component Hierarchy

```
Header.jsx
└── auth-modal-backdrop (Portal to document.body)
    └── auth-modal-container
        ├── auth-modal-left (Hidden on mobile)
        │   ├── floating-circle (×4)
        │   └── auth-modal-left-content
        │       ├── brand-name
        │       ├── welcome-title
        │       ├── title-divider
        │       ├── welcome-subtitle
        │       ├── outline-btn (REGISTER / SIGN IN)
        │       ├── or-text
        │       └── outline-btn-green (Partner registration)
        │
        └── auth-modal-right
            ├── modal-close-btn
            └── auth-form-content
                ├── progress-bar (Staff registration only)
                ├── form-title
                ├── title-divider-line (Login only)
                ├── form-subtitle
                ├── info-banner (Partner registration only)
                ├── auth-form
                │   ├── input-wrapper (×multiple)
                │   │   ├── input-icon-left
                │   │   ├── auth-input
                │   │   └── password-toggle
                │   ├── forgot-password (Login only)
                │   ├── submit-btn
                │   └── back-link (Partner registration only)
                ├── divider-with-text (Login only)
                ├── google-btn (Login only)
                └── mobile-only-actions (Login only, mobile only)
                    ├── mobile-divider
                    ├── mobile-outline-btn
                    └── mobile-outline-btn-green
```

## 🎯 View States

### State 1: Login (modalView === 'login')
```
Left Panel:                Right Panel:
┌──────────────┐          ┌──────────────┐
│ Staffinn     │          │ Login    × │
│ Hello,       │          │ ──────────── │
│ Welcome!     │          │ Enter details│
│ ────         │          │              │
│ Don't have   │          │ 📧 Email     │
│ account?     │          │ 🔒 Pass  👁  │
│              │          │ Forgot pwd?  │
│ [REGISTER]   │          │              │
│              │          │ [LOGIN]      │
│ or           │          │              │
│              │          │ or continue  │
│ [Register as │          │ [G Google]   │
│  Institute/  │          │              │
│  Recruiter]  │          │ (Mobile btns)│
└──────────────┘          └──────────────┘
```

### State 2: Register Staff (modalView === 'registerStaff')
```
Left Panel:                Right Panel:
┌──────────────┐          ┌──────────────┐
│ Staffinn     │          │ ▓▓▓░░░░░ 33% │
│ Welcome      │          │ Register as  │
│ Back!        │          │ Staff        │
│ ────         │          │ Start filling│
│ Already have │          │              │
│ account?     │          │ Full Name    │
│              │          │ Email [OTP]  │
│ [SIGN IN]    │          │ 🔒 Pass  👁  │
│              │          │ 🔒 Confirm   │
│ or           │          │ +91 Phone    │
│              │          │              │
│ [Register as │          │ [Register]   │
│  Institute/  │          │              │
│  Recruiter]  │          │              │
└──────────────┘          └──────────────┘
```

### State 3: Partner Registration (modalView === 'registerPartner')
```
Left Panel:                Right Panel:
┌──────────────┐          ┌──────────────┐
│ 🏢           │          │ Registration │
│ Join as a    │          │ Request  × │
│ Partner      │          │              │
│              │          │ ℹ️ Info box  │
│ Institutes & │          │              │
│ Recruiters   │          │ Select Type ▼│
│ get verified │          │ Name         │
│              │          │ Email        │
│ ℹ️ Review in │          │ +91 Phone    │
│ 24-48 hours  │          │              │
│              │          │ [Submit      │
│ Back to Login│          │  Request]    │
│              │          │              │
│              │          │ Back to Login│
└──────────────┘          └──────────────┘
```

## 🎨 Color Coding

```
┌─────────────────────────────────────────┐
│ Blue Gradient (Login/Staff)             │
│ linear-gradient(145deg,                 │
│   #1E40AF → #2563EB → #3B82F6)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Green Gradient (Partner)                │
│ linear-gradient(145deg,                 │
│   #065F46 → #10B981 → #34D399)         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Button Gradient (Primary)               │
│ linear-gradient(135deg,                 │
│   #2563EB → #1D4ED8)                    │
└─────────────────────────────────────────┘
```

## 📏 Spacing System

```
┌─────────────────────────────────────────┐
│ Modal Container                         │
│ ┌─────────────────────────────────────┐ │
│ │ 48px padding (desktop)              │ │
│ │ 24px padding (mobile)               │ │
│ │                                     │ │
│ │ ┌─────────────────────────────┐   │ │
│ │ │ 16px gap between elements   │   │ │
│ │ │                             │   │ │
│ │ │ Input: 52px height          │   │ │
│ │ │ Button: 52px height         │   │ │
│ │ │ Border radius: 12px         │   │ │
│ │ └─────────────────────────────┘   │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🎭 Animation Flow

```
Modal Open:
1. Backdrop fades in (200ms)
   opacity: 0 → 1

2. Container scales in (300ms spring)
   scale: 0.85 → 1
   opacity: 0 → 1

3. Floating circles start animating
   translateY: 0 → -20px → 0 (loop)

View Switch:
1. Current view slides left + fades (250ms)
   translateX: 0 → -100%
   opacity: 1 → 0

2. New view slides in from right (250ms)
   translateX: 100% → 0
   opacity: 0 → 1

Modal Close:
1. Container scales down (200ms)
   scale: 1 → 0.85
   opacity: 1 → 0

2. Backdrop fades out (200ms)
   opacity: 1 → 0
```

## 🔄 State Flow Diagram

```
                    ┌─────────┐
                    │  Login  │ (Default)
                    └────┬────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    [REGISTER]    [Partner Btn]    [SIGN IN]
         │               │               │
         ▼               ▼               │
  ┌──────────┐    ┌──────────┐         │
  │ Register │    │ Partner  │         │
  │  Staff   │    │ Request  │         │
  └────┬─────┘    └────┬─────┘         │
       │               │               │
       │          [Back to Login]      │
       │               │               │
       └───────────────┴───────────────┘
                       │
                       ▼
                  ┌─────────┐
                  │  Login  │
                  └─────────┘
```

## 📱 Responsive Breakpoints

```
Desktop (>768px):
┌─────────────────────────────────┐
│ ┌─────────┬─────────────────┐  │
│ │  Left   │     Right       │  │
│ │ Panel   │     Panel       │  │
│ │ (50%)   │     (50%)       │  │
│ └─────────┴─────────────────┘  │
└─────────────────────────────────┘

Mobile (≤768px):
┌─────────────────────────────────┐
│ ┌───────────────────────────┐  │
│ │                           │  │
│ │      Right Panel          │  │
│ │      (100% width)         │  │
│ │      (Full screen)        │  │
│ │                           │  │
│ │   + Mobile buttons        │  │
│ └───────────────────────────┘  │
└─────────────────────────────────┘
```

## 🎯 Z-Index Layers

```
Layer 5: Close Button (z-index: 10)
Layer 4: Dropdown Menu (z-index: 50)
Layer 3: Modal Container (z-index: 10000)
Layer 2: Modal Backdrop (z-index: 10000)
Layer 1: Page Content (z-index: auto)
```

---

This visual guide helps understand the structure and layout of the authentication modal system.
