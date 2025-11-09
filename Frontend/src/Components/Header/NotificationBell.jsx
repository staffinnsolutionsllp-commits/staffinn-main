/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import apiService from '../../services/api';
import './NotificationBell.css';

function NotificationBell({ isLoggedIn }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!isLoggedIn) return;
    
    try {
      setLoading(true);
      const response = await apiService.getUserNotifications();
      if (response.success) {
        setNotifications(response.data || []);
        setUnreadCount(response.count || 0);
      }
    } catch (error) {
      // Silently handle errors to avoid console spam
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await apiService.markNotificationAsRead(notificationId);
      if (response.success) {
        // Remove notification from list (mark as read removes it)
        setNotifications(prev => 
          prev.filter(notif => notif.notificationsId !== notificationId)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      // Mark each notification as read
      const markPromises = notifications.map(notif => 
        apiService.markNotificationAsRead(notif.notificationsId)
      );
      
      await Promise.all(markPromises);
      
      // Clear all notifications and reset count
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Fetch notifications on mount and set up real-time updates
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      
      // Set up Socket.IO for real-time notifications with error handling
      if (window.io) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4001';
            const socketUrl = API_URL.replace('/api/v1', '');
            const socket = window.io(socketUrl, {
              auth: { token },
              timeout: 5000,
              forceNew: true
            });
            
            // Handle connection errors silently
            socket.on('connect_error', () => {
              // Silently handle connection errors
            });
            
            // Listen for new notifications
            socket.on('new_notification', (notification) => {
              setNotifications(prev => [notification, ...prev]);
              setUnreadCount(prev => prev + 1);
            });
            
            return () => {
              socket.disconnect();
            };
          } catch (error) {
            // Fallback to polling if socket setup fails
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
          }
        }
      } else {
        // Fallback to polling if Socket.IO is not available
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
      }
    }
  }, [isLoggedIn]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.notification-bell')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  // Don't render if not logged in
  if (!isLoggedIn) return null;

  return (
    <div className="notification-bell">
      <button 
        className="notification-button"
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M13.73 21a2 2 0 0 1-3.46 0" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={markAllAsRead}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.notificationsId}
                  className="notification-item unread"
                >
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                  </div>
                  <div className="notification-actions">
                    <button 
                      className="mark-read-btn"
                      onClick={() => markAsRead(notification.notificationsId)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => setShowDropdown(false)}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;