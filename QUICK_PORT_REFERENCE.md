# 🎯 Staffinn - Quick Port Reference

## Port Assignments

```
┌─────────────────────────────────────────────────────────┐
│                  STAFFINN PORT MAP                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔧 Backend API          →  Port 4001                  │
│  🌐 Frontend             →  Port 5173                  │
│  📰 News Admin Panel     →  Port 5174                  │
│  👔 HRMS (HR Manager)    →  Port 5175                  │
│  ⚙️  Master Admin Panel  →  Port 5176                  │
│  👤 Employee Portal      →  Port 5177                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Quick Start Commands

```bash
# Backend (Port 4001)
cd Backend && npm start

# Frontend (Port 5173)
cd Frontend && npm run dev

# News Admin (Port 5174)
cd NewsAdminPanel && npm run dev

# HRMS (Port 5175)
cd "HRMS Staffinn/Staffinn HR Manager_files" && npm run dev

# Master Admin (Port 5176)
cd MasterAdminPanel && npm run dev

# Employee Portal (Port 5177)
cd EmployeePortal && npm run dev
```

## Access URLs

| Service | URL |
|---------|-----|
| Backend API | http://localhost:4001 |
| Frontend | http://localhost:5173 |
| News Admin | http://localhost:5174 |
| HRMS | http://localhost:5175 |
| Master Admin | http://localhost:5176 |
| Employee Portal | http://localhost:5177 |

## Configuration Files

| Component | Config File |
|-----------|-------------|
| Backend | `Backend/.env` |
| Frontend | `Frontend/vite.config.js` |
| News Admin | `NewsAdminPanel/vite.config.ts` |
| HRMS | `HRMS Staffinn/Staffinn HR Manager_files/vite.config.ts` |
| Master Admin | `MasterAdminPanel/vite.config.js` |
| Employee Portal | `EmployeePortal/vite.config.js` |

---

**Status:** ✅ All ports configured and verified
**No Conflicts:** All ports are unique and properly assigned
