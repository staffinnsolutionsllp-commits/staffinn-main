# News Page & Admin Panel Redesign - Installation Instructions

## Required Dependencies

Before running the redesigned application, you need to install the following dependencies:

### For Frontend (Main Application)
```bash
cd Frontend
npm install framer-motion sonner
```

### For NewsAdminPanel (if separate)
```bash
cd NewsAdminPanel
npm install framer-motion sonner
```

## What Has Been Redesigned

### 1. News Page (Public /news)
- Complete editorial magazine design
- Light theme with Playfair Display + DM Sans fonts
- Hero section with magazine-style layout
- Trending topics carousel
- Expert insights section
- Real-time updates via socket.io
- Fully responsive design
- Premium UI/UX with animations

### 2. News Admin Panel (/admin/news)
- Dark navy sidebar
- Clean content management interface
- Real-time preview of changes
- CRUD operations for all news sections
- Live card previews
- Drag-and-drop support
- Fully responsive

## Running the Application

After installing dependencies:

```bash
# Frontend
cd Frontend
npm run dev

# NewsAdminPanel (if separate)
cd NewsAdminPanel  
npm run dev
```

## Important Notes

- Backend APIs remain unchanged
- All existing functionality is preserved
- Real-time updates work via socket.io
- No database schema changes
- Fully backward compatible
