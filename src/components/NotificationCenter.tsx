import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, XCircle, Loader2, Calendar, FileText, Car, DollarSign, Settings } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import './NotificationCenter.css';

interface NotificationCenterProps {
  maxItems?: number;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ maxItems = 10 }) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isDismissing, setIsDismissing] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      refreshNotifications({ read: false, dismissed: false });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, refreshNotifications]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_warning':
      case 'budget_exceeded':
        return <DollarSign className="w-5 h-5 text-amber-600" />;
      case 'bill_reminder':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'soat_reminder':
        return <Car className="w-5 h-5 text-purple-600" />;
      case 'month_end_reminder':
        return <Calendar className="w-5 h-5 text-green-600" />;
      case 'custom_reminder':
        return <Bell className="w-5 h-5 text-indigo-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleDismiss = async (id: number) => {
    setIsDismissing(id);
    try {
      await dismiss(id);
    } catch (err) {
      console.error('Error dismissing:', err);
    } finally {
      setIsDismissing(null);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    navigate('/notifications');
  };

  const handleViewPreferences = () => {
    setIsOpen(false);
    navigate('/notifications?tab=preferences');
  };

  const unreadNotifications = notifications
    .filter((notif) => !notif.is_read && !notif.is_dismissed)
    .slice(0, maxItems);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Centro de notificaciones"
        aria-expanded={isOpen}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-center-dropdown">
          <div className="notification-center-header">
            <div className="notification-center-header-left">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="notification-center-title">Notificaciones</h3>
              {unreadCount > 0 && (
                <span className="notification-center-badge">
                  {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="notification-center-header-actions">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="notification-center-action-btn"
                  title="Marcar todas como leídas"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={handleViewPreferences}
                className="notification-center-action-btn"
                title="Preferencias"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="notification-center-action-btn"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="notification-center-content">
            {isLoading ? (
              <div className="notification-center-empty">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-gray-400" />
                <p className="text-sm text-gray-500">Cargando notificaciones...</p>
              </div>
            ) : unreadNotifications.length === 0 ? (
              <div className="notification-center-empty">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium text-gray-700">No hay notificaciones nuevas</p>
                <p className="text-xs mt-1 text-gray-500">Todas tus notificaciones están al día</p>
              </div>
            ) : (
              <div>
                {unreadNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="notification-item"
                  >
                    <div className="notification-item-content">
                      <div className="notification-item-icon">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="notification-item-text">
                        <p className="notification-item-title">{notification.title}</p>
                        <p className="notification-item-message">{notification.message}</p>
                        <p className="notification-item-time">{formatDate(notification.created_at)}</p>
                        <div className="notification-item-actions">
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="notification-action-btn"
                          >
                            <Check className="w-3 h-3" />
                            Leer
                          </button>
                          <button
                            onClick={() => handleDismiss(notification.id)}
                            disabled={isDismissing === notification.id}
                            className="notification-action-btn notification-action-btn-dismiss"
                          >
                            {isDismissing === notification.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            Descartar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {unreadNotifications.length > 0 && (
            <div className="notification-center-footer">
              <button
                onClick={handleViewAll}
                className="notification-center-view-all"
              >
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;

