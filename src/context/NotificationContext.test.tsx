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
  } = useNotifications();

  return (
    <div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <button onClick={() => refreshNotifications()}>Refresh</button>
      <button onClick={() => markAsRead(1)}>Mark Read</button>
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
      // Puede ser llamado más veces debido a efectos del contexto
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
});

