import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Notifications from './Notifications';
import { useNotifications } from '../../context/NotificationContext';
import { Notification, CustomReminder } from '../../services/notificationService';

vi.mock('../../context/NotificationContext', () => ({
  useNotifications: vi.fn(),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

const mockReadNotification: Notification = {
  ...mockNotification,
  id: 2,
  read: true,
  is_read: true,
  read_timestamp: '2025-01-01T01:00:00Z',
};

const mockDismissedNotification: Notification = {
  ...mockNotification,
  id: 3,
  is_dismissed: true,
  dismissed_at: '2025-01-01T02:00:00Z',
};

const mockCustomReminder: CustomReminder = {
  id: 1,
  title: 'Reunión importante',
  message: 'Llevar documentos',
  reminder_date: '2025-01-15',
  reminder_time: '09:00:00',
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

describe('Notifications Page', () => {
  const mockRefreshNotifications = vi.fn();
  const mockRefreshCustomReminders = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockDismiss = vi.fn();
  const mockDismissAll = vi.fn();
  const mockCreateCustomReminder = vi.fn();
  const mockUpdateCustomReminder = vi.fn();
  const mockDeleteCustomReminder = vi.fn();
  const mockMarkCustomReminderAsRead = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      customReminders: [],
      preferences: null,
      summary: { total: 0, unread: 0, recent: [], by_type: [] },
      unreadCount: 0,
      isLoading: false,
      error: null,
      refreshNotifications: mockRefreshNotifications,
      refreshCustomReminders: mockRefreshCustomReminders,
      refreshPreferences: vi.fn(),
      refreshSummary: vi.fn(),
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      dismiss: mockDismiss,
      dismissAll: mockDismissAll,
      createCustomReminder: mockCreateCustomReminder,
      updateCustomReminder: mockUpdateCustomReminder,
      deleteCustomReminder: mockDeleteCustomReminder,
      markCustomReminderAsRead: mockMarkCustomReminderAsRead,
      getNotification: vi.fn(),
    } as unknown as ReturnType<typeof useNotifications>);
  });

  it('debe renderizar la página de notificaciones', () => {
    render(<Notifications />);

    const notificationsTexts = screen.getAllByText(/notificaciones/i);
    expect(notificationsTexts.length).toBeGreaterThan(0);
    expect(screen.getByText(/gestiona tus alertas/i)).toBeInTheDocument();
  });

  it('debe mostrar las pestañas correctas', () => {
    render(<Notifications />);

    expect(screen.getByRole('button', { name: /notificaciones/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recordatorios/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /preferencias/i })).toBeInTheDocument();
  });

  it('debe mostrar el contador de no leídas en la pestaña', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      unreadCount: 5,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('debe mostrar notificaciones no leídas y leídas por separado', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification, mockReadNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    expect(screen.getByText(/no leídas \(1\)/i)).toBeInTheDocument();

    const readTexts = screen.getAllByText(/leídas \(1\)/i);
    expect(readTexts.length).toBeGreaterThan(0);
  });

  it('debe filtrar notificaciones por tipo', async () => {
    const user = userEvent.setup();
    const billNotification: Notification = {
      ...mockNotification,
      id: 4,
      notification_type: 'bill_reminder',
      notification_type_display: 'Recordatorio de factura',
    };

    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification, billNotification],
      unreadCount: 2,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const typeFilter = screen.getByDisplayValue(/todos los tipos/i);
    await user.selectOptions(typeFilter, 'budget_warning');

    await waitFor(() => {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument();

    });
  });

  it('debe filtrar notificaciones por estado de lectura', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification, mockReadNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const readFilter = screen.getByDisplayValue(/todas/i);
    await user.selectOptions(readFilter, 'unread');

    await waitFor(() => {
      expect(screen.getByText(mockNotification.title)).toBeInTheDocument();

    });
  });

  it('debe mostrar notificaciones descartadas cuando el checkbox está marcado', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification, mockDismissedNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const dismissedCheckbox = screen.getByLabelText(/mostrar descartadas/i);
    await user.click(dismissedCheckbox);

    await waitFor(() => {
      expect(screen.getByText(/descartadas \(1\)/i)).toBeInTheDocument();
    });
  });

  it('debe marcar notificación como leída al hacer click', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const markReadButton = screen.getByTitle(/marcar como leída/i);
    await user.click(markReadButton);

    expect(mockMarkAsRead).toHaveBeenCalledWith(mockNotification.id);
  });

  it('debe descartar notificación al hacer click', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const dismissButton = screen.getByTitle(/descartar/i);
    await user.click(dismissButton);

    expect(mockDismiss).toHaveBeenCalledWith(mockNotification.id);
  });

  it('debe marcar todas como leídas', async () => {
    const user = userEvent.setup();
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [mockNotification],
      unreadCount: 1,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const markAllButton = screen.getByRole('button', { name: /marcar todas como leídas/i });
    await user.click(markAllButton);

    expect(mockMarkAllAsRead).toHaveBeenCalled();
  });

  it('debe cambiar a la pestaña de recordatorios', async () => {
    const user = userEvent.setup();
    render(<Notifications />);

    const remindersTab = screen.getByRole('button', { name: /recordatorios/i });
    await user.click(remindersTab);

    await waitFor(() => {

      const remindersTexts = screen.getAllByText(/recordatorios personalizados/i);
      expect(remindersTexts.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar recordatorios pendientes y enviados', async () => {
    const user = userEvent.setup();
    const sentReminder: CustomReminder = {
      ...mockCustomReminder,
      id: 2,
      is_sent: true,
      sent_at: '2025-01-15T09:00:00Z',
    };

    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      customReminders: [mockCustomReminder, sentReminder],
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const remindersTab = screen.getByRole('button', { name: /recordatorios/i });
    await user.click(remindersTab);

    await waitFor(() => {
      expect(screen.getByText(/pendientes \(1\)/i)).toBeInTheDocument();
      expect(screen.getByText(/enviados \(1\)/i)).toBeInTheDocument();
    });
  });

  it('debe abrir modal para crear recordatorio', async () => {
    const user = userEvent.setup();
    render(<Notifications />);

    const remindersTab = screen.getByRole('button', { name: /recordatorios/i });
    await user.click(remindersTab);

    await waitFor(() => {
      const createButton = screen.getByRole('button', { name: /nuevo recordatorio/i });
      expect(createButton).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /nuevo recordatorio/i });
    await user.click(createButton);

    await waitFor(() => {

      const newReminderTexts = screen.getAllByText(/nuevo recordatorio/i);
      expect(newReminderTexts.length).toBeGreaterThan(0);
    });
  });

  it('debe crear recordatorio personalizado', async () => {
    const user = userEvent.setup({ delay: null });
    mockCreateCustomReminder.mockResolvedValue(mockCustomReminder);

    render(<Notifications />);

    const remindersTab = screen.getByRole('button', { name: /recordatorios/i });
    await user.click(remindersTab);

    await waitFor(() => {
      const createButtons = screen.getAllByRole('button', { name: /nuevo recordatorio/i });
      expect(createButtons.length).toBeGreaterThan(0);
    });

    const createButtons = screen.getAllByRole('button', { name: /nuevo recordatorio/i });
    await user.click(createButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);
    const dateInput = screen.getByLabelText(/fecha/i);
    const timeInput = screen.getByLabelText(/hora/i);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    await user.clear(titleInput);
    await user.type(titleInput, 'Nuevo Recordatorio');
    await user.clear(messageInput);
    await user.type(messageInput, 'Mensaje del recordatorio');
    await user.clear(dateInput);
    await user.type(dateInput, futureDateStr);
    await user.clear(timeInput);
    await user.type(timeInput, '14:30');

    const saveButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockCreateCustomReminder).toHaveBeenCalledWith({
        title: 'Nuevo Recordatorio',
        message: 'Mensaje del recordatorio',
        reminder_date: futureDateStr,
        reminder_time: '14:30:00',
      });
    }, { timeout: 5000 });
  });

  it('debe cambiar a la pestaña de preferencias', async () => {
    const user = userEvent.setup();

    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      preferences: {
        id: 1,
        timezone: 'America/Bogota',
        timezone_display: 'America/Bogota',
        language: 'es',
        language_display: 'Español',
        enable_budget_alerts: true,
        enable_bill_reminders: true,
        enable_soat_reminders: true,
        enable_month_end_reminders: true,
        enable_custom_reminders: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const preferencesTab = screen.getByRole('button', { name: /preferencias/i });
    await user.click(preferencesTab);

    await waitFor(() => {

      const preferencesTexts = screen.getAllByText(/preferencias/i);
      expect(preferencesTexts.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('debe mostrar estado de carga', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      isLoading: true,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    expect(screen.getByText(/cargando notificaciones/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay notificaciones', () => {
    render(<Notifications />);

    const emptyMessages = screen.getAllByText(/no hay notificaciones/i);
    expect(emptyMessages.length).toBeGreaterThan(0);
  });

  it('debe mostrar estadísticas del resumen', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      summary: { total: 10, unread: 3, recent: [], by_type: [] },
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('debe cargar notificaciones y recordatorios al montar', () => {
    render(<Notifications />);

    expect(mockRefreshNotifications).toHaveBeenCalled();
    expect(mockRefreshCustomReminders).toHaveBeenCalled();
  });

  it('debe mostrar diferentes tipos de notificaciones', async () => {
    const billNotification: Notification = {
      ...mockNotification,
      id: 4,
      notification_type: 'bill_reminder',
      notification_type_display: 'Recordatorio de factura',
      title: 'Recordatorio de factura',
      message: 'Tienes una factura próxima a vencer',
    };

    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      notifications: [billNotification],
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    await waitFor(() => {

      expect(screen.getByText('Tienes una factura próxima a vencer')).toBeInTheDocument();
    });
  });

  it('debe eliminar recordatorio personalizado', async () => {
    const user = userEvent.setup();

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      customReminders: [mockCustomReminder],
    } as unknown as ReturnType<typeof useNotifications>);

    render(<Notifications />);

    const remindersTab = screen.getByRole('button', { name: /recordatorios/i });
    await user.click(remindersTab);

    await waitFor(() => {
      expect(screen.getByText(mockCustomReminder.title)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => 
      btn.className.includes('reminder-action-btn-delete')
    );
    
    expect(deleteButton).toBeDefined();
    if (deleteButton) {
      await user.click(deleteButton);
      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(mockDeleteCustomReminder).toHaveBeenCalledWith(mockCustomReminder.id);
      });
    }
    
    confirmSpy.mockRestore();
  });
});

