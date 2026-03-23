import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Calendar, Plane, IndianRupee, CreditCard, ClipboardList, MessageSquare, Network, User, LogOut } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/leave', icon: Plane, label: 'Leave' },
    { path: '/payroll', icon: IndianRupee, label: 'Payroll' },
    { path: '/claims', icon: CreditCard, label: 'Claim Management' },
    { path: '/tasks', icon: ClipboardList, label: 'Tasks & Performance' },
    { path: '/grievances', icon: MessageSquare, label: 'Grievances' },
    { path: '/organogram', icon: Network, label: 'Organogram' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Sidebar - Fixed */}
      <div className="w-64 bg-white shadow-lg flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-gray-900">Employee Portal</h1>
          <p className="text-sm text-gray-500 mt-1">{user?.user?.email}</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header with Notification Bell */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Welcome, {user?.employee?.fullName || user?.user?.email}
            </h2>
            <p className="text-sm text-gray-500">
              {user?.employee?.designation} • {user?.employee?.department}
            </p>
          </div>
          <NotificationBell />
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
