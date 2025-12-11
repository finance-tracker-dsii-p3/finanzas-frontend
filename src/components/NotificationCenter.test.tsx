import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import NotificationCenter from './NotificationCenter';
import { useNotifications } from '../context/NotificationContext';
import { Notification } from '../services/notificationService';

vi.mock('../context/NotificationContext', () => ({
  useNotifications: vi.fn(),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const mockNotification: Notification = {
  id: 1,
  notification_type: 'budget_warning',
  notification_type_display: 'Alerta de presupuesto (80%)',
  title: '⚠️ Alerta de Presupuesto',
  message: 'Has alcanzado el 85% del presupuesto de la categoría Comida',
  read: false,
  is_read: false,
  read_timestamp: null,
  is_dismissed: false,
  dismissed_at: null,
  related_object_id: 1,
  related_object_type: 'budget',
  scheduled_for: null,
  sent_at: '2025-01-01T00:00:00Z',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  recipient_name: 'Test User',
  recipient_username: 'testuser',
  user_id: 1,
  user_name: 'Test User',
};

describe('NotificationCenter', () => {
  const mockRefreshNotifications = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      customReminders: [],
      preferences: null,
      summary: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      refreshNotifications: mockRefreshNotifications,
      refreshCustomReminders: vi.fn(),
      refreshPreferences: vi.fn(),
      refreshSummary: vi.fn(),
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      dismiss: mockDismiss,
      dismissAll: vi.fn(),
      createCustomReminder: vi.fn(),
      updateCustomReminder: vi.fn(),
      deleteCustomReminder: vi.fn(),
      markCustomReminderAsRead: vi.fn(),
      updatePreferences: vi.fn(),
      getNotification: vi.fn(),
    } as unknown as ReturnType<typeof useNotifications>);
  });

  it('debe renderizar el botón de notificaciones', () => {
    render(<NotificationCenter />);
    expect(screen.getByLabelText(/centro de notificaciones/i)).toBeInTheDocument();
  });

  it('debe mostrar el contador de notificaciones no leídas', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      unreadCount: 5,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationCenter />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('debe mostrar "9+" cuando hay más de 9 notificaciones no leídas', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      unreadCount: 15,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationCenter />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('debe abrir el dropdown al hacer click', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    // Puede haber múltiples elementos con "notificaciones", usar getAllByText
    const notificationsTexts = screen.getAllByText(/notificaciones/i);
    expect(notificationsTexts.length).toBeGreaterThan(0);
  });

  it('debe mostrar notificaciones no leídas en el dropdown', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument();
      expect(screen.getByText(mockNotification.message)).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay notificaciones', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/no hay notificaciones nuevas/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar estado de carga', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      isLoading: true,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/cargando notificaciones/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a refreshNotifications al abrir el dropdown', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(mockRefreshNotifications).toHaveBeenCalledWith({
        read: false,
        dismissed: false,
      });
    });
  });

  it('debe marcar como leída al hacer click en el botón', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument();
    });

    const markReadButtons = screen.getAllByText(/leer/i);
    if (markReadButtons.length > 0) {
      await user.click(markReadButtons[0]);
      expect(mockMarkAsRead).toHaveBeenCalledWith(mockNotification.id);
    }
  });

  it('debe descartar notificación al hacer click en descartar', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument();
    });

    const dismissButtons = screen.getAllByText(/descartar/i);
    if (dismissButtons.length > 0) {
      await user.click(dismissButtons[0]);
      expect(mockDismiss).toHaveBeenCalledWith(mockNotification.id);
    }
  });

  it('debe marcar todas como leídas cuando hay notificaciones no leídas', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTitle(/marcar todas como leídas/i)).toBeInTheDocument();
    });

    const markAllButton = screen.getByTitle(/marcar todas como leídas/i);
    await user.click(markAllButton);

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('debe cerrar el dropdown al hacer click fuera', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);

    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      const notificationsTexts = screen.getAllByText(/notificaciones/i);
      expect(notificationsTexts.length).toBeGreaterThan(0);
    });

    // Click fuera del dropdown
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/notificaciones/i)).not.toBeInTheDocument();
    });
  });
});

