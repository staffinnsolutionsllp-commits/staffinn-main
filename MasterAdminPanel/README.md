# Master Admin Panel - Staffinn

A comprehensive admin panel for managing Staffinn platform users, built with React and Vite.

## Features

### Authentication
- Secure admin login with Admin ID and Password
- Forgot password functionality with real-time database updates
- JWT-based authentication

### Staff Management
- **Dashboard**: View comprehensive dashboard data for all staff members
  - Total applications, profile views, application trends
  - Month-wise application analytics with charts
  - Recent applications and activity tracking
- **Users**: Complete staff user management
  - View all registered staff members in tabular format
  - Profile photo, contact information, and profile mode display
  - Contact history tracking
  - Actions: View, Hide/Show, Block/Unblock, Delete

### User Profile Management
- View complete staff profiles with all details:
  - Personal information (name, email, phone, address)
  - Professional information (skills, resume, availability)
  - Experience and education history
  - Certificates and achievements
  - Dashboard statistics and recent activity
  - Contact history and account information

### Real-time Operations
- Toggle profile visibility (public/private)
- Block/unblock user accounts
- Delete user accounts with confirmation
- All changes reflect immediately in the database

## Technology Stack

- **Frontend**: React 19, Vite
- **Routing**: React Router DOM
- **Charts**: Recharts for data visualization
- **HTTP Client**: Fetch API
- **Styling**: Custom CSS with modern design
- **Icons**: Font Awesome

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- Backend server running on http://localhost:5000

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Initialize Admin (Backend)**:
   ```bash
   # In the Backend directory
   node scripts/initializeAdmin.js
   ```
   This creates the default admin with:
   - Admin ID: `admin`
   - Password: `admin123`

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Access the admin panel**:
   - Open http://localhost:5173
   - Login with the default credentials
   - Change the password after first login

## Project Structure

```
src/
├── components/
│   ├── staff/
│   │   ├── StaffDashboard.jsx    # Staff dashboard overview
│   │   ├── StaffUsers.jsx        # Staff user management
│   │   ├── StaffProfileModal.jsx # Detailed profile view
│   │   └── *.css                 # Component styles
│   ├── AdminPanel.jsx            # Main admin panel layout
│   ├── Login.jsx                 # Authentication component
│   └── *.css                     # Component styles
├── services/
│   └── adminApi.js               # API service layer
├── App.jsx                       # Main application component
└── main.jsx                      # Application entry point
```

## API Endpoints

### Authentication
- `POST /api/v1/admin/login` - Admin login
- `POST /api/v1/admin/change-password` - Change admin password
- `POST /api/v1/admin/initialize` - Initialize default admin

### Staff Management
- `GET /api/v1/admin/staff/users` - Get all staff users
- `GET /api/v1/admin/staff/dashboard` - Get staff dashboard data
- `GET /api/v1/admin/staff/profile/:userId` - Get specific staff profile
- `PUT /api/v1/admin/staff/toggle-visibility/:userId` - Toggle profile visibility
- `PUT /api/v1/admin/staff/toggle-block/:userId` - Block/unblock user
- `DELETE /api/v1/admin/staff/delete/:userId` - Delete user

## Features in Detail

### Staff Dashboard
- Displays comprehensive analytics for all staff members
- Interactive charts showing application trends over time
- Expandable sections for detailed data viewing
- Real-time data updates

### Staff Users Management
- Complete user listing with profile photos and key information
- Contact history tracking for each user
- Bulk actions with confirmation dialogs
- Status indicators for visibility and account status

### Profile Modal
- Detailed view of complete staff profiles
- All registration information and professional details
- Education history, experience, and certificates
- Dashboard statistics and activity logs
- Account status and administrative information

## Security Features

- JWT-based authentication
- Admin-only access controls
- Confirmation dialogs for destructive actions
- Secure password handling
- Real-time token validation

## Responsive Design

- Mobile-first responsive design
- Collapsible sidebar navigation
- Optimized for tablets and mobile devices
- Touch-friendly interface elements

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

The frontend connects to the backend at `http://localhost:4000/api/v1` by default. Update the `API_BASE_URL` in `src/services/adminApi.js` if needed.

## Future Enhancements

- Institute management section
- Recruiter management section
- Advanced analytics and reporting
- Bulk operations for user management
- Export functionality for data
- Advanced search and filtering
- Email notifications for admin actions

## Support

For issues or questions, please refer to the main Staffinn documentation or contact the development team.