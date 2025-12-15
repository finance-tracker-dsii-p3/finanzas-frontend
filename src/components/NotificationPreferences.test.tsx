import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import NotificationPreferences from './NotificationPreferences';
import { useNotifications } from '../context/NotificationContext';
import { notificationService } from '../services/notificationService';

vi.mock('../context/NotificationContext', () => ({
  useNotifications: vi.fn(),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../services/notificationService', () => ({
  notificationService: {
    getTimezones: vi.fn(),
  },
}));

const mockPreferences = {
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
};

describe('NotificationPreferences', () => {
  const mockRefreshPreferences = vi.fn();
  const mockUpdatePreferences = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotifications).mockReturnValue({
      notifications: [],
      customReminders: [],
      preferences: mockPreferences,
      summary: null,
      unreadCount: 0,
      isLoading: false,
      error: null,
      refreshNotifications: vi.fn(),
      refreshCustomReminders: vi.fn(),
      refreshPreferences: mockRefreshPreferences,
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      dismiss: vi.fn(),
      dismissAll: vi.fn(),
      createCustomReminder: vi.fn(),
      updateCustomReminder: vi.fn(),
      deleteCustomReminder: vi.fn(),
      markCustomReminderAsRead: vi.fn(),
      updatePreferences: mockUpdatePreferences,
      getNotification: vi.fn(),
    } as unknown as ReturnType<typeof useNotifications>);

    vi.mocked(notificationService.getTimezones).mockResolvedValue([
      { value: 'America/Bogota', label: 'America/Bogota (Colombia)' },
      { value: 'America/Mexico_City', label: 'America/Mexico_City (México)' },
    ]);
  });

  it('debe renderizar el formulario de preferencias', async () => {
    render(<NotificationPreferences />);

    await waitFor(() => {

      const preferencesTexts = screen.getAllByText(/preferencias/i);
      expect(preferencesTexts.length).toBeGreaterThan(0);
      expect(screen.getByLabelText(/zona horaria/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/idioma/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/alertas de presupuesto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recordatorios de facturas/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recordatorios de soat/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recordatorios de fin de mes/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/recordatorios personalizados/i)).toBeInTheDocument();
    });
  });

  it('debe cargar las preferencias existentes', async () => {
    render(<NotificationPreferences />);

    await waitFor(() => {
      const timezoneSelect = screen.getByLabelText(/zona horaria/i) as HTMLSelectElement;
      const languageSelect = screen.getByLabelText(/idioma/i) as HTMLSelectElement;
      const budgetAlerts = screen.getByLabelText(/alertas de presupuesto/i) as HTMLInputElement;

      expect(timezoneSelect.value).toBe('America/Bogota');
      expect(languageSelect.value).toBe('es');
      expect(budgetAlerts.checked).toBe(true);
    });
  });

  it('debe mostrar estado de carga mientras carga preferencias', () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      preferences: null,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPreferences />);

    expect(screen.getByText(/cargando preferencias/i)).toBeInTheDocument();
  });

  it('debe mostrar error si no se pueden cargar preferencias', async () => {
    vi.mocked(useNotifications).mockReturnValue({
      ...vi.mocked(useNotifications)(),
      preferences: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useNotifications>);

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByText(/no se pudieron cargar las preferencias/i)).toBeInTheDocument();
    });
  });

  it('debe actualizar preferencias al enviar el formulario', async () => {
    const user = userEvent.setup();
    mockUpdatePreferences.mockResolvedValue(mockPreferences);

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByLabelText(/idioma/i)).toBeInTheDocument();
    });

    const languageSelect = screen.getByLabelText(/idioma/i);
    await user.selectOptions(languageSelect, 'en');

    const submitButton = screen.getByRole('button', { name: /guardar preferencias/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          language: 'en',
        })
      );
    });
  });

  it('debe mostrar mensaje de éxito al guardar', async () => {
    const user = userEvent.setup();
    mockUpdatePreferences.mockResolvedValue(mockPreferences);

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar preferencias/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /guardar preferencias/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/preferencias actualizadas correctamente/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error si falla al guardar', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Error al actualizar';
    mockUpdatePreferences.mockRejectedValue(new Error(errorMessage));

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar preferencias/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /guardar preferencias/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('debe actualizar el estado al cambiar timezone', async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByLabelText(/zona horaria/i)).toBeInTheDocument();
    });

    const timezoneSelect = screen.getByLabelText(/zona horaria/i);
    await user.selectOptions(timezoneSelect, 'America/Mexico_City');

    const submitButton = screen.getByRole('button', { name: /guardar preferencias/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          timezone: 'America/Mexico_City',
        })
      );
    });
  });

  it('debe actualizar el estado al cambiar toggles', async () => {
    const user = userEvent.setup();
    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByLabelText(/alertas de presupuesto/i)).toBeInTheDocument();
    });

    const budgetAlerts = screen.getByLabelText(/alertas de presupuesto/i);
    await user.click(budgetAlerts);

    const submitButton = screen.getByRole('button', { name: /guardar preferencias/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdatePreferences).toHaveBeenCalledWith(
        expect.objectContaining({
          enable_budget_alerts: false,
        })
      );
    });
  });

  it('debe mostrar estado de carga al guardar', async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: unknown) => void;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    mockUpdatePreferences.mockReturnValue(updatePromise);

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar preferencias/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /guardar preferencias/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/guardando/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    resolveUpdate!(undefined);
    await waitFor(() => {
      expect(screen.queryByText(/guardando/i)).not.toBeInTheDocument();
    });
  });

  it('debe cargar timezones del servicio', async () => {
    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(notificationService.getTimezones).toHaveBeenCalled();
    });
  });

  it('debe usar lista básica de timezones si el servicio falla', async () => {
    vi.mocked(notificationService.getTimezones).mockRejectedValue(new Error('Service error'));

    render(<NotificationPreferences />);

    await waitFor(() => {
      const timezoneSelect = screen.getByLabelText(/zona horaria/i) as HTMLSelectElement;
      expect(timezoneSelect.options.length).toBeGreaterThan(0);
    });
  });

  it('debe limpiar mensajes de error/éxito al cambiar valores', async () => {
    const user = userEvent.setup();
    mockUpdatePreferences.mockResolvedValue(mockPreferences);

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /guardar preferencias/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /guardar preferencias/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/preferencias actualizadas correctamente/i)).toBeInTheDocument();
    });

    const languageSelect = screen.getByLabelText(/idioma/i);
    await user.selectOptions(languageSelect, 'en');

    await waitFor(() => {
      expect(screen.queryByText(/preferencias actualizadas correctamente/i)).not.toBeInTheDocument();
    });
  });
});

