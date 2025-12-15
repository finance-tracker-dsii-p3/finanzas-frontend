import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../test/utils/test-utils';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { notificationService } from '../services/notificationService';
import { Notification } from '../services/notificationService';
import { useAuth } from './AuthContext';

vi.mock('../services/notificationService');
vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const TestComponent = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
    dismissAll,
    createCustomReminder,
    updateCustomReminder,
    deleteCustomReminder,
    refreshCustomReminders,
    refreshPreferences,
    refreshSummary,
    updatePreferences,
    getNotification,
  } = useNotifications();

  return (
    <div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <button onClick={() => refreshNotifications()}>Refresh</button>
      <button onClick={() => markAsRead(1)}>Mark Read</button>
      <button onClick={() => markAllAsRead()}>Mark All Read</button>
      <button onClick={() => dismiss(1)}>Dismiss</button>
      <button onClick={() => dismissAll()}>Dismiss All</button>
      <button onClick={() => createCustomReminder({
        title: 'Test',
        message: 'Test message',
        reminder_date: '2025-12-31',
        reminder_time: '12:00',
      })}>Create Reminder</button>
      <button onClick={() => updateCustomReminder(1, { title: 'Updated' })}>Update Reminder</button>
      <button onClick={() => deleteCustomReminder(1)}>Delete Reminder</button>
      <button onClick={() => refreshCustomReminders()}>Refresh Reminders</button>
      <button onClick={() => refreshPreferences()}>Refresh Preferences</button>
      <button onClick={() => refreshSummary()}>Refresh Summary</button>
      <button onClick={() => updatePreferences({ enable_budget_alerts: true })}>Update Preferences</button>
      <button onClick={() => getNotification(1)}>Get Notification</button>
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: true,
      user: { id: 1, username: 'test' },
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('debe cargar notificaciones al montar cuando está autenticado', async () => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        notification_type: 'budget_warning',
        notification_type_display: 'Alerta',
        title: 'Test',
        message: 'Test message',
        read: false,
        is_read: false,
        read_timestamp: null,
        is_dismissed: false,
        dismissed_at: null,
        related_object_id: null,
        related_object_type: null,
        scheduled_for: null,
        sent_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        recipient_name: '',
        recipient_username: 'test',
        user_id: 1,
        user_name: '',
      },
    ];

    vi.mocked(notificationService.list).mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: mockNotifications,
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(notificationService.list).toHaveBeenCalled();
    });
  });

  it('debe calcular correctamente el contador de no leídas', async () => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        notification_type: 'budget_warning',
        notification_type_display: 'Alerta',
        title: 'Test 1',
        message: 'Message 1',
        read: false,
        is_read: false,
        read_timestamp: null,
        is_dismissed: false,
        dismissed_at: null,
        related_object_id: null,
        related_object_type: null,
        scheduled_for: null,
        sent_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        recipient_name: '',
        recipient_username: 'test',
        user_id: 1,
        user_name: '',
      },
      {
        id: 2,
        notification_type: 'budget_warning',
        notification_type_display: 'Alerta',
        title: 'Test 2',
        message: 'Message 2',
        read: true,
        is_read: true,
        read_timestamp: '2025-01-01T00:00:00Z',
        is_dismissed: false,
        dismissed_at: null,
        related_object_id: null,
        related_object_type: null,
        scheduled_for: null,
        sent_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        recipient_name: '',
        recipient_username: 'test',
        user_id: 1,
        user_name: '',
      },
    ];

    vi.mocked(notificationService.list).mockResolvedValueOnce({
      count: 2,
      next: null,
      previous: null,
      results: mockNotifications,
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });
  });

  it('debe actualizar notificaciones al llamar refreshNotifications', async () => {
    const mockNotifications: Notification[] = [];

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: mockNotifications,
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    });

    const refreshButton = screen.getByText('Refresh');
    await act(async () => {
      await refreshButton.click();
    });

    await waitFor(() => {

      expect(notificationService.list).toHaveBeenCalled();
    });
  });

  it('debe marcar notificación como leída y actualizar estado', async () => {
    const mockNotification: Notification = {
      id: 1,
      notification_type: 'budget_warning',
      notification_type_display: 'Alerta',
      title: 'Test',
      message: 'Test message',
      read: false,
      is_read: false,
      read_timestamp: null,
      is_dismissed: false,
      dismissed_at: null,
      related_object_id: null,
      related_object_type: null,
      scheduled_for: null,
      sent_at: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      recipient_name: '',
      recipient_username: 'test',
      user_id: 1,
      user_name: '',
    };

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [mockNotification],
    });

    vi.mocked(notificationService.markAsRead).mockResolvedValue({
      message: 'Marcada como leída',
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    const markReadButton = screen.getByText('Mark Read');
    await act(async () => {
      await markReadButton.click();
    });

    await waitFor(() => {
      expect(notificationService.markAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('no debe cargar notificaciones si no está autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    expect(notificationService.list).not.toHaveBeenCalled();
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  it('debe marcar todas las notificaciones como leídas', async () => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        notification_type: 'budget_warning',
        notification_type_display: 'Alerta',
        title: 'Test 1',
        message: 'Message 1',
        read: false,
        is_read: false,
        read_timestamp: null,
        is_dismissed: false,
        dismissed_at: null,
        related_object_id: null,
        related_object_type: null,
        scheduled_for: null,
        sent_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        recipient_name: '',
        recipient_username: 'test',
        user_id: 1,
        user_name: '',
      },
    ];

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockNotifications,
    });

    vi.mocked(notificationService.markAllAsRead).mockResolvedValue({
      message: 'Todas marcadas como leídas',
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    const markAllButton = screen.getByText('Mark All Read');
    await act(async () => {
      await markAllButton.click();
    });

    await waitFor(() => {
      expect(notificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  it('debe descartar una notificación', async () => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        notification_type: 'budget_warning',
        notification_type_display: 'Alerta',
        title: 'Test',
        message: 'Test message',
        read: false,
        is_read: false,
        read_timestamp: null,
        is_dismissed: false,
        dismissed_at: null,
        related_object_id: null,
        related_object_type: null,
        scheduled_for: null,
        sent_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        recipient_name: '',
        recipient_username: 'test',
        user_id: 1,
        user_name: '',
      },
    ];

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockNotifications,
    });

    vi.mocked(notificationService.dismiss).mockResolvedValue({
      message: 'Descartada',
      notification: mockNotifications[0],
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    });

    const dismissButton = screen.getByText('Dismiss');
    await act(async () => {
      await dismissButton.click();
    });

    await waitFor(() => {
      expect(notificationService.dismiss).toHaveBeenCalledWith(1);
    });
  });

  it('debe descartar todas las notificaciones', async () => {
    const mockNotifications: Notification[] = [
      {
        id: 1,
        notification_type: 'budget_warning',
        notification_type_display: 'Alerta',
        title: 'Test',
        message: 'Test message',
        read: false,
        is_read: false,
        read_timestamp: null,
        is_dismissed: false,
        dismissed_at: null,
        related_object_id: null,
        related_object_type: null,
        scheduled_for: null,
        sent_at: null,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        recipient_name: '',
        recipient_username: 'test',
        user_id: 1,
        user_name: '',
      },
    ];

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockNotifications,
    });

    vi.mocked(notificationService.dismissAll).mockResolvedValue({
      message: 'Todas descartadas',
      updated_count: 1,
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    });

    const dismissAllButton = screen.getByText('Dismiss All');
    await act(async () => {
      await dismissAllButton.click();
    });

    await waitFor(() => {
      expect(notificationService.dismissAll).toHaveBeenCalled();
    });
  });

  it('debe crear un recordatorio personalizado', async () => {
    const mockReminder = {
      id: 1,
      title: 'Test',
      message: 'Test message',
      reminder_date: '2025-12-31',
      reminder_time: '12:00',
      is_sent: false,
      sent_at: null,
      notification_id: null,
      is_read: false,
      read_at: null,
      is_past_due_display: false,
      user_username: 'testuser',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    vi.mocked(notificationService.listCustomReminders).mockResolvedValue([]);
    vi.mocked(notificationService.createCustomReminder).mockResolvedValue(mockReminder);

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    });

    const createButton = screen.getByText('Create Reminder');
    await act(async () => {
      await createButton.click();
    });

    await waitFor(() => {
      expect(notificationService.createCustomReminder).toHaveBeenCalledWith({
        title: 'Test',
        message: 'Test message',
        reminder_date: '2025-12-31',
        reminder_time: '12:00',
      });
    });
  });

  it('debe actualizar un recordatorio personalizado', async () => {
    vi.mocked(notificationService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const mockReminder = {
      id: 1,
      title: 'Test',
      message: 'Test message',
      reminder_date: '2025-12-31',
      reminder_time: '12:00',
      is_sent: false,
      sent_at: null,
      notification_id: null,
      is_read: false,
      read_at: null,
      is_past_due_display: false,
      user_username: 'testuser',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    vi.mocked(notificationService.listCustomReminders).mockResolvedValue([mockReminder]);
    vi.mocked(notificationService.updateCustomReminder).mockResolvedValue(mockReminder);

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    });

    const updateButton = screen.getByText('Update Reminder');
    await act(async () => {
      await updateButton.click();
    });

    await waitFor(() => {
      expect(notificationService.updateCustomReminder).toHaveBeenCalledWith(1, { title: 'Updated' });
    });
  });

  it('debe eliminar un recordatorio personalizado', async () => {
    vi.mocked(notificationService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    const mockReminder = {
      id: 1,
      title: 'Test',
      message: 'Test message',
      reminder_date: '2025-12-31',
      reminder_time: '12:00',
      is_sent: false,
      sent_at: null,
      notification_id: null,
      is_read: false,
      read_at: null,
      is_past_due_display: false,
      user_username: 'testuser',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };
    vi.mocked(notificationService.listCustomReminders).mockResolvedValue([mockReminder]);
    vi.mocked(notificationService.deleteCustomReminder).mockResolvedValue(undefined);

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    });

    const deleteButton = screen.getByText('Delete Reminder');
    await act(async () => {
      await deleteButton.click();
    });

    await waitFor(() => {
      expect(notificationService.deleteCustomReminder).toHaveBeenCalledWith(1);
    });
  });

  it('debe actualizar preferencias de notificaciones', async () => {
    const mockPreferences = {
      id: 1,
      timezone: 'America/Bogota',
      timezone_display: 'America/Bogota',
      language: 'es' as const,
      language_display: 'Español',
      enable_budget_alerts: true,
      enable_bill_reminders: true,
      enable_soat_reminders: false,
      enable_month_end_reminders: false,
      enable_custom_reminders: true,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    vi.mocked(notificationService.updatePreferences).mockResolvedValue(mockPreferences);

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    });

    const updatePrefsButton = screen.getByText('Update Preferences');
    await act(async () => {
      await updatePrefsButton.click();
    });

    await waitFor(() => {
      expect(notificationService.updatePreferences).toHaveBeenCalledWith({ enable_budget_alerts: true });
    });
  });

  it('debe obtener una notificación específica', async () => {
    const mockNotification: Notification = {
      id: 1,
      notification_type: 'budget_warning',
      notification_type_display: 'Alerta',
      title: 'Test',
      message: 'Test message',
      read: false,
      is_read: false,
      read_timestamp: null,
      is_dismissed: false,
      dismissed_at: null,
      related_object_id: null,
      related_object_type: null,
      scheduled_for: null,
      sent_at: null,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      recipient_name: '',
      recipient_username: 'test',
      user_id: 1,
      user_name: '',
    };

    vi.mocked(notificationService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    vi.mocked(notificationService.get).mockResolvedValue(mockNotification);

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    });

    const getButton = screen.getByText('Get Notification');
    await act(async () => {
      await getButton.click();
    });

    await waitFor(() => {
      expect(notificationService.get).toHaveBeenCalledWith(1);
    });
  });

  it('debe manejar errores al cargar preferencias con 404', async () => {
    vi.mocked(notificationService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    vi.mocked(notificationService.getPreferences).mockRejectedValue(
      new Error('404 Not Found')
    );

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(notificationService.getPreferences).toHaveBeenCalled();
    });
  });
});

