import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  XCircle,
  Trash2,
  Filter,
  Calendar,
  Settings,
  Plus,
  Loader2,
  DollarSign,
  FileText,
  Car,
  Clock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import {
  Notification,
  NotificationType,
  CustomReminder,
} from '../../services/notificationService';
import CustomReminderModal from '../../components/CustomReminderModal';
import NotificationPreferences from '../../components/NotificationPreferences';
import './notifications.css';

const Notifications: React.FC = () => {
  const {
    notifications,
    customReminders,
    summary,
    unreadCount,
    isLoading,
    refreshNotifications,
    refreshCustomReminders,
    markAsRead,
    markAllAsRead,
    dismiss,
    createCustomReminder,
    updateCustomReminder,
    deleteCustomReminder,
    markCustomReminderAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'notifications' | 'reminders' | 'preferences'>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    return tab === 'preferences' ? 'preferences' : 'notifications';
  });
  const [filterType, setFilterType] = useState<NotificationType | 'all'>('all');
  const [filterRead, setFilterRead] = useState<'all' | 'read' | 'unread'>('all');
  const [filterDismissed, setFilterDismissed] = useState<boolean>(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<CustomReminder | null>(null);
  const [showPreferences, setShowPreferences] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('tab') === 'preferences';
  });

  useEffect(() => {
    refreshNotifications();
    refreshCustomReminders();
  }, [refreshNotifications, refreshCustomReminders]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getNotificationIcon = (type: NotificationType) => {
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

  const filteredNotifications = notifications.filter((notif) => {
    if (filterType !== 'all' && notif.notification_type !== filterType) return false;
    if (filterRead === 'read' && !notif.is_read) return false;
    if (filterRead === 'unread' && notif.is_read) return false;
    if (!filterDismissed && notif.is_dismissed) return false;
    return true;
  });

  const unreadNotifications = filteredNotifications.filter((n) => !n.is_read && !n.is_dismissed);
  const readNotifications = filteredNotifications.filter((n) => n.is_read && !n.is_dismissed);
  const dismissedNotifications = filteredNotifications.filter((n) => n.is_dismissed);

  const handleCreateReminder = async (data: {
    title: string;
    message: string;
    reminder_date: string;
    reminder_time: string;
  }) => {
    try {
      await createCustomReminder(data);
      setShowReminderModal(false);
    } catch (error) {
      console.error('Error creating reminder:', error);
    }
  };

  const handleUpdateReminder = async (id: number, data: Partial<CustomReminder>) => {
    try {
      await updateCustomReminder(id, data);
      setEditingReminder(null);
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const pendingReminders = customReminders.filter((r) => !r.is_sent);
  const sentReminders = customReminders.filter((r) => r.is_sent);

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="notifications-header-left">
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="notifications-title">Notificaciones</h1>
            <p className="notifications-subtitle">
              Gestiona tus alertas, recordatorios y preferencias
            </p>
          </div>
        </div>
        {summary && (
          <div className="notifications-stats">
            <div className="stat-item">
              <span className="stat-label">Total</span>
              <span className="stat-value">{summary.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">No leídas</span>
              <span className="stat-value stat-value-unread">{summary.unread}</span>
            </div>
          </div>
        )}
      </div>

      <div className="notifications-tabs">
        <button
          className={`tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell className="w-4 h-4" />
          Notificaciones
          {unreadCount > 0 && (
            <span className="tab-badge">{unreadCount}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Calendar className="w-4 h-4" />
          Recordatorios
        </button>
        <button
          className={`tab-button ${activeTab === 'preferences' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('preferences');
            setShowPreferences(true);
          }}
        >
          <Settings className="w-4 h-4" />
          Preferencias
        </button>
      </div>

      {activeTab === 'notifications' && (
        <div className="notifications-content">
          <div className="notifications-filters">
            <div className="filter-group">
              <Filter className="w-4 h-4" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as NotificationType | 'all')}
                className="filter-select"
              >
                <option value="all">Todos los tipos</option>
                <option value="budget_warning">Alerta de presupuesto (80%)</option>
                <option value="budget_exceeded">Presupuesto excedido</option>
                <option value="bill_reminder">Recordatorio de factura</option>
                <option value="soat_reminder">Recordatorio de SOAT</option>
                <option value="month_end_reminder">Fin de mes</option>
                <option value="custom_reminder">Recordatorio personalizado</option>
              </select>
            </div>
            <div className="filter-group">
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value as 'all' | 'read' | 'unread')}
                className="filter-select"
              >
                <option value="all">Todas</option>
                <option value="unread">No leídas</option>
                <option value="read">Leídas</option>
              </select>
            </div>
            <div className="filter-group">
              <label className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={filterDismissed}
                  onChange={(e) => setFilterDismissed(e.target.checked)}
                />
                Mostrar descartadas
              </label>
            </div>
            <div className="filter-actions">
              {unreadNotifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="action-button action-button-secondary"
                  disabled={isLoading}
                >
                  <CheckCheck className="w-4 h-4" />
                  Marcar todas como leídas
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="notifications-loading">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p>Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notifications-empty">
              <Bell className="w-16 h-16 text-gray-300" />
              <p className="notifications-empty-title">No hay notificaciones</p>
              <p className="notifications-empty-text">
                {filterDismissed
                  ? 'No hay notificaciones descartadas'
                  : 'No hay notificaciones que coincidan con los filtros seleccionados'}
              </p>
            </div>
          ) : (
            <div className="notifications-list">
              {unreadNotifications.length > 0 && (
                <div className="notifications-section">
                  <h3 className="notifications-section-title">
                    No leídas ({unreadNotifications.length})
                  </h3>
                  {unreadNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismiss}
                      getIcon={getNotificationIcon}
                      formatDate={formatDate}
                    />
                  ))}
                </div>
              )}

              {readNotifications.length > 0 && (
                <div className="notifications-section">
                  <h3 className="notifications-section-title">
                    Leídas ({readNotifications.length})
                  </h3>
                  {readNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismiss}
                      getIcon={getNotificationIcon}
                      formatDate={formatDate}
                      isRead
                    />
                  ))}
                </div>
              )}

              {filterDismissed && dismissedNotifications.length > 0 && (
                <div className="notifications-section">
                  <h3 className="notifications-section-title">
                    Descartadas ({dismissedNotifications.length})
                  </h3>
                  {dismissedNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDismiss={dismiss}
                      getIcon={getNotificationIcon}
                      formatDate={formatDate}
                      isDismissed
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reminders' && (
        <div className="notifications-content">
          <div className="reminders-header">
            <h2 className="reminders-title">Recordatorios Personalizados</h2>
            <button
              onClick={() => {
                setEditingReminder(null);
                setShowReminderModal(true);
              }}
              className="action-button action-button-primary"
            >
              <Plus className="w-4 h-4" />
              Nuevo Recordatorio
            </button>
          </div>

          {pendingReminders.length > 0 && (
            <div className="reminders-section">
              <h3 className="reminders-section-title">Pendientes ({pendingReminders.length})</h3>
              <div className="reminders-grid">
                {pendingReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onEdit={setEditingReminder}
                    onDelete={deleteCustomReminder}
                    onMarkAsRead={markCustomReminderAsRead}
                    formatDate={formatDate}
                  />
                ))}
              </div>
            </div>
          )}

          {sentReminders.length > 0 && (
            <div className="reminders-section">
              <h3 className="reminders-section-title">Enviados ({sentReminders.length})</h3>
              <div className="reminders-grid">
                {sentReminders.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    onEdit={setEditingReminder}
                    onDelete={deleteCustomReminder}
                    onMarkAsRead={markCustomReminderAsRead}
                    formatDate={formatDate}
                    isSent
                  />
                ))}
              </div>
            </div>
          )}

          {customReminders.length === 0 && (
            <div className="notifications-empty">
              <Calendar className="w-16 h-16 text-gray-300" />
              <p className="notifications-empty-title">No hay recordatorios</p>
              <p className="notifications-empty-text">
                Crea recordatorios personalizados para no olvidar eventos importantes
              </p>
              <button
                onClick={() => {
                  setEditingReminder(null);
                  setShowReminderModal(true);
                }}
                className="action-button action-button-primary mt-4"
              >
                <Plus className="w-4 h-4" />
                Crear Primer Recordatorio
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'preferences' && showPreferences && (
        <div className="notifications-content">
          <NotificationPreferences />
        </div>
      )}

      {showReminderModal && (
        <CustomReminderModal
          reminder={editingReminder}
          onClose={() => {
            setShowReminderModal(false);
            setEditingReminder(null);
          }}
          onSave={editingReminder
            ? (data) => handleUpdateReminder(editingReminder.id, data)
            : handleCreateReminder}
        />
      )}
    </div>
  );
};

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: number) => Promise<void>;
  onDismiss: (id: number) => Promise<void>;
  getIcon: (type: NotificationType) => React.ReactNode;
  formatDate: (date: string) => string;
  isRead?: boolean;
  isDismissed?: boolean;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDismiss,
  getIcon,
  formatDate,
  isRead = false,
  isDismissed = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleMarkAsRead = async () => {
    setIsProcessing(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    setIsProcessing(true);
    try {
      await onDismiss(notification.id);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`notification-card ${isRead ? 'read' : ''} ${isDismissed ? 'dismissed' : ''}`}>
      <div className="notification-card-content">
        <div className="notification-card-icon">{getIcon(notification.notification_type)}</div>
        <div className="notification-card-body">
          <div className="notification-card-header">
            <h4 className="notification-card-title">{notification.title}</h4>
            <span className="notification-card-type">
              {notification.notification_type_display}
            </span>
          </div>
          <p className="notification-card-message">{notification.message}</p>
          <div className="notification-card-footer">
            <span className="notification-card-time">{formatDate(notification.created_at)}</span>
            <div className="notification-card-actions">
              {!isRead && !isDismissed && (
                <button
                  onClick={handleMarkAsRead}
                  disabled={isProcessing}
                  className="notification-action-btn"
                  title="Marcar como leída"
                >
                  <Check className="w-4 h-4" />
                  Leer
                </button>
              )}
              {!isDismissed && (
                <button
                  onClick={handleDismiss}
                  disabled={isProcessing}
                  className="notification-action-btn notification-action-btn-dismiss"
                  title="Descartar"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Descartar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ReminderCardProps {
  reminder: CustomReminder;
  onEdit: (reminder: CustomReminder) => void;
  onDelete: (id: number) => Promise<void>;
  onMarkAsRead: (id: number) => Promise<void>;
  formatDate: (date: string) => string;
  isSent?: boolean;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
  onMarkAsRead,
  formatDate,
  isSent = false,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este recordatorio?')) return;
    setIsProcessing(true);
    try {
      await onDelete(reminder.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsRead = async () => {
    setIsProcessing(true);
    try {
      await onMarkAsRead(reminder.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const reminderDateTime = new Date(`${reminder.reminder_date}T${reminder.reminder_time}`);
  const isPastDue = reminderDateTime < new Date();

  return (
    <div className={`reminder-card ${isSent ? 'sent' : ''} ${isPastDue && !isSent ? 'past-due' : ''}`}>
      <div className="reminder-card-header">
        <h4 className="reminder-card-title">{reminder.title}</h4>
        {reminder.is_read ? (
          <Eye className="w-4 h-4 text-green-600" />
        ) : (
          <EyeOff className="w-4 h-4 text-gray-400" />
        )}
      </div>
      <p className="reminder-card-message">{reminder.message}</p>
      <div className="reminder-card-datetime">
        <Clock className="w-4 h-4" />
        <span>
          {formatDate(reminder.reminder_date)} a las {reminder.reminder_time.slice(0, 5)}
        </span>
      </div>
      {isPastDue && !isSent && (
        <span className="reminder-badge reminder-badge-past">Vencido</span>
      )}
      {isSent && (
        <span className="reminder-badge reminder-badge-sent">Enviado</span>
      )}
      <div className="reminder-card-actions">
        {!reminder.is_read && (
          <button
            onClick={handleMarkAsRead}
            disabled={isProcessing}
            className="reminder-action-btn"
          >
            <Check className="w-4 h-4" />
            Leer
          </button>
        )}
        <button
          onClick={() => onEdit(reminder)}
          className="reminder-action-btn"
        >
          Editar
        </button>
        <button
          onClick={handleDelete}
          disabled={isProcessing}
          className="reminder-action-btn reminder-action-btn-delete"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};

export default Notifications;

