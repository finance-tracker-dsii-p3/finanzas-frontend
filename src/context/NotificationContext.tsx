import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  notificationService,
  Notification,
  NotificationFilters,
  CustomReminder,
  NotificationPreferences,
  NotificationSummary,
} from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextValue {
  notifications: Notification[];
  customReminders: CustomReminder[];
  preferences: NotificationPreferences | null;
  summary: NotificationSummary | null;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshNotifications: (filters?: NotificationFilters) => Promise<void>;
  refreshCustomReminders: (filters?: { is_sent?: boolean; is_read?: boolean }) => Promise<void>;
  refreshPreferences: () => Promise<void>;
  refreshSummary: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismiss: (id: number) => Promise<void>;
  dismissAll: () => Promise<void>;
  createCustomReminder: (data: {
    title: string;
    message: string;
    reminder_date: string;
    reminder_time: string;
  }) => Promise<CustomReminder>;
  updateCustomReminder: (id: number, data: Partial<CustomReminder>) => Promise<void>;
  deleteCustomReminder: (id: number) => Promise<void>;
  markCustomReminderAsRead: (id: number) => Promise<void>;
  updatePreferences: (data: Partial<NotificationPreferences>) => Promise<void>;
  getNotification: (id: number) => Promise<Notification>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [customReminders, setCustomReminders] = useState<CustomReminder[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      if (!isAuthenticated) {
        setNotifications([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await notificationService.list(filters);
        setNotifications(response.results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar las notificaciones';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  const loadCustomReminders = useCallback(
    async (filters?: { is_sent?: boolean; is_read?: boolean }) => {
      if (!isAuthenticated) {
        setCustomReminders([]);
        return;
      }

      try {
        const reminders = await notificationService.listCustomReminders(filters);
        setCustomReminders(reminders);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar los recordatorios';
        setError(message);
      }
    },
    [isAuthenticated],
  );

  const loadPreferences = useCallback(async () => {
    if (!isAuthenticated) {
      setPreferences(null);
      return;
    }

    try {
      const prefs = await notificationService.getPreferences();
      setPreferences(prefs);
      // Limpiar error si se cargaron preferencias exitosamente (incluso si son por defecto)
      setError(null);
    } catch (err) {
      // Solo mostrar error si no es un 404 (endpoint no existe)
      const message = err instanceof Error ? err.message : 'No se pudieron cargar las preferencias';
      if (!message.includes('404') && !message.includes('No estás autenticado')) {
        setError(message);
      } else {
        // Si es 404 o error de auth, usar preferencias por defecto
        setPreferences(null);
      }
    }
  }, [isAuthenticated]);

  const loadSummary = useCallback(async () => {
    if (!isAuthenticated) {
      setSummary(null);
      return;
    }

    try {
      const summaryData = await notificationService.getSummary();
      setSummary(summaryData);
    } catch (err) {
      // No mostrar error en summary, es opcional
      console.error('Error loading summary:', err);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadCustomReminders();
      loadPreferences();
      loadSummary();
    } else {
      setNotifications([]);
      setCustomReminders([]);
      setPreferences(null);
      setSummary(null);
    }
  }, [isAuthenticated, loadNotifications, loadCustomReminders, loadPreferences, loadSummary]);

  const refreshNotifications = useCallback(
    async (filters?: NotificationFilters) => {
      await loadNotifications(filters);
    },
    [loadNotifications],
  );

  const refreshCustomReminders = useCallback(
    async (filters?: { is_sent?: boolean; is_read?: boolean }) => {
      await loadCustomReminders(filters);
    },
    [loadCustomReminders],
  );

  const refreshPreferences = useCallback(async () => {
    await loadPreferences();
  }, [loadPreferences]);

  const refreshSummary = useCallback(async () => {
    await loadSummary();
  }, [loadSummary]);

  const markAsRead = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await notificationService.markAsRead(id);
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, read: true, is_read: true, read_timestamp: new Date().toISOString() } : notif)),
        );
        // Actualizar summary si existe
        if (summary) {
          setSummary({
            ...summary,
            unread: Math.max(0, summary.unread - 1),
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo marcar la notificación como leída';
        setError(message);
        throw err;
      }
    },
    [summary],
  );

  const markAllAsRead = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true, is_read: true, read_timestamp: new Date().toISOString() })));
      // Actualizar summary
      if (summary) {
        setSummary({
          ...summary,
          unread: 0,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron marcar todas las notificaciones como leídas';
      setError(message);
      throw err;
    }
  }, [summary]);

  const dismiss = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await notificationService.dismiss(id);
        setNotifications((prev) =>
          prev.map((notif) => (notif.id === id ? { ...notif, is_dismissed: true, dismissed_at: new Date().toISOString() } : notif)),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo descartar la notificación';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const dismissAll = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await notificationService.dismissAll();
      setNotifications((prev) => prev.map((notif) => ({ ...notif, is_dismissed: true, dismissed_at: new Date().toISOString() })));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron descartar todas las notificaciones';
      setError(message);
      throw err;
    }
  }, []);

  const createCustomReminder = useCallback(
    async (data: {
      title: string;
      message: string;
      reminder_date: string;
      reminder_time: string;
    }): Promise<CustomReminder> => {
      setError(null);
      try {
        const reminder = await notificationService.createCustomReminder(data);
        setCustomReminders((prev) => [...prev, reminder]);
        return reminder;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo crear el recordatorio';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const updateCustomReminder = useCallback(
    async (id: number, data: Partial<CustomReminder>): Promise<void> => {
      setError(null);
      try {
        await notificationService.updateCustomReminder(id, data);
        setCustomReminders((prev) =>
          prev.map((reminder) => (reminder.id === id ? { ...reminder, ...data } : reminder)),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo actualizar el recordatorio';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const deleteCustomReminder = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await notificationService.deleteCustomReminder(id);
        setCustomReminders((prev) => prev.filter((reminder) => reminder.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo eliminar el recordatorio';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const markCustomReminderAsRead = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await notificationService.markCustomReminderAsRead(id);
        setCustomReminders((prev) =>
          prev.map((reminder) => (reminder.id === id ? { ...reminder, is_read: true, read_at: new Date().toISOString() } : reminder)),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo marcar el recordatorio como leído';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const updatePreferences = useCallback(
    async (data: Partial<NotificationPreferences>): Promise<void> => {
      setError(null);
      try {
        const updated = await notificationService.updatePreferences(data);
        setPreferences(updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron actualizar las preferencias';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const getNotification = useCallback(async (id: number): Promise<Notification> => {
    setError(null);
    try {
      return await notificationService.get(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener la notificación';
      setError(message);
      throw err;
    }
  }, []);

  const unreadCount = notifications.filter((notif) => !notif.is_read && !notif.is_dismissed).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        customReminders,
        preferences,
        summary,
        unreadCount,
        isLoading,
        error,
        refreshNotifications,
        refreshCustomReminders,
        refreshPreferences,
        refreshSummary,
        markAsRead,
        markAllAsRead,
        dismiss,
        dismissAll,
        createCustomReminder,
        updateCustomReminder,
        deleteCustomReminder,
        markCustomReminderAsRead,
        updatePreferences,
        getNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
  }
  return context;
};

