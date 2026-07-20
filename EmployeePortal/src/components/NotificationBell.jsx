import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { io } from 'socket.io-client';
import { Bell, X, CheckCheck, Inbox, ClipboardList, PlaneTakeoff, Wallet, Megaphone, IndianRupee, Star, BellRing } from 'lucide-react';

export default function NotificationBell() {
  const { user }                           = useAuth();
  const [notifications, setNotifications]  = useState([]);
  const [unreadCount,   setUnreadCount]    = useState(0);
  const [showDropdown,  setShowDropdown]   = useState(false);
  const [loading,       setLoading]        = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications();
      setNotifications(response.data.data);
    } catch (error) { console.error('Error fetching notifications:', error); }
    finally { setLoading(false); }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.data.unreadCount);
    } catch {}
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  useEffect(() => {
    if (!user?.employeeId) return;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:4001', {
      transports: ['websocket', 'polling']
    });
    socket.on('connect', () => socket.emit('join-employee-room', user.employeeId));
    socket.on('employee-notification', (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      if (Notification.permission === 'granted') {
        new Notification(data.notification.title, { body: data.notification.message, icon: '/favicon.ico' });
      }
    });
    return () => socket.disconnect();
  }, [user?.employeeId]);

  useEffect(() => {
    if (user?.employeeId) { fetchNotifications(); fetchUnreadCount(); }
  }, [user?.employeeId]);

  useEffect(() => {
    if (Notification.permission === 'default') Notification.requestPermission();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'text-red-600 bg-red-50';
      case 'HIGH':   return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50';
      case 'LOW':    return 'text-blue-600 bg-blue-50';
      default:       return 'text-slate-500 bg-slate-100';
    }
  };

  const TYPE_ICON_MAP = {
    TASK_ASSIGNED:       { icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    TASK_UPDATED:        { icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    ATTENDANCE_ALERT:    { icon: BellRing,      color: 'text-red-600',    bg: 'bg-red-50' },
    LEAVE_APPROVED:      { icon: PlaneTakeoff,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
    LEAVE_REJECTED:      { icon: PlaneTakeoff,  color: 'text-red-500',    bg: 'bg-red-50' },
    CLAIM_APPROVED:      { icon: Wallet,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
    CLAIM_REJECTED:      { icon: Wallet,        color: 'text-red-500',    bg: 'bg-red-50' },
    GRIEVANCE_ASSIGNED:  { icon: Megaphone,     color: 'text-amber-600',  bg: 'bg-amber-50' },
    GRIEVANCE_UPDATE:    { icon: Megaphone,     color: 'text-amber-600',  bg: 'bg-amber-50' },
    GRIEVANCE_RESOLVED:  { icon: Megaphone,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
    PAYROLL_PROCESSED:   { icon: IndianRupee,   color: 'text-violet-600', bg: 'bg-violet-50' },
    PERFORMANCE_RATING:  { icon: Star,          color: 'text-amber-500',  bg: 'bg-amber-50' },
  };

  const getTypeIconConfig = (type) =>
    TYPE_ICON_MAP[type] || { icon: BellRing, color: 'text-slate-500', bg: 'bg-slate-100' };

  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp);
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (d < 7)  return `${d}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="relative">
      <button
        onClick={() => { setShowDropdown(!showDropdown); if (!showDropdown) fetchNotifications(); }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-black text-white bg-red-500 rounded-full leading-none badge-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
          <div className="fixed inset-x-3 top-14 sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 w-auto sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 z-20 flex flex-col max-h-[520px] overflow-hidden animate-scaleIn">

            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-slate-500" />
                <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-indigo-600 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <CheckCheck size={13} /> All read
                  </button>
                )}
                <button onClick={() => setShowDropdown(false)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
                  <Inbox size={36} className="text-slate-200" />
                  <div className="text-center">
                    <p className="font-semibold text-slate-600 text-sm">All caught up!</p>
                    <p className="text-xs text-slate-400 mt-0.5">No new notifications</p>
                  </div>
                </div>
              ) : (
                <div>
                  {notifications.map((n) => (
                    <div
                      key={n.notificationId}
                      onClick={() => { if (!n.isRead) markAsRead(n.notificationId); if (n.actionUrl) window.location.href = n.actionUrl; }}
                      className={`px-5 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0 ${!n.isRead ? 'bg-indigo-50/50' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        {(() => {
                          const cfg = getTypeIconConfig(n.type);
                          const Icon = cfg.icon;
                          return (
                            <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <Icon size={15} className={cfg.color} />
                            </div>
                          );
                        })()}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={`text-sm font-semibold leading-tight ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                              {n.title}
                            </p>
                            {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0 mt-1.5" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{n.message}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-xs text-slate-400">{formatTime(n.createdAt)}</span>
                            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${getPriorityColor(n.priority)}`}>
                              {n.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 flex-shrink-0">
                <button onClick={() => setShowDropdown(false)}
                  className="w-full py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
