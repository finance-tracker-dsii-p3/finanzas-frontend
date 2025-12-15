import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AlertProvider, useAlerts } from './AlertContext';
import { useAuth } from './AuthContext';
import * as alertServiceModule from '../services/alertService';
import type { BudgetAlert, AlertType } from '../services/alertService';

vi.mock('../services/alertService', () => ({
  alertService: {
    list: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('AlertContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, username: 'test', email: 'test@example.com', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });
  });

  it('debe proporcionar el contexto de alertas', async () => {
    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
    expect(result.current).toBeDefined();
    });

    expect(result.current.alerts).toEqual([]);
    expect(result.current.unreadCount).toBe(0);
  });

  it('debe cargar alertas cuando el usuario está autenticado', async () => {
    const mockAlerts = [
      {
        id: 1,
        budget: 1,
        budget_category_name: 'Alimentación',
        budget_spent_percentage: '85.5',
        budget_amount: '500000',
        alert_type: 'warning' as AlertType,
        is_read: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 1,
      results: mockAlerts,
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current.alerts.length).toBeGreaterThan(0);
    });
  });

  it('debe calcular correctamente el contador de no leídas', async () => {
    const mockAlerts = [
      {
        id: 1,
        budget: 1,
        budget_category_name: 'Alimentación',
        budget_spent_percentage: '85.5',
        budget_amount: '500000',
        alert_type: 'warning' as AlertType,
        is_read: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
      {
        id: 2,
        budget: 2,
        budget_category_name: 'Transporte',
        budget_spent_percentage: '105.0',
        budget_amount: '300000',
        alert_type: 'exceeded' as AlertType,
        is_read: true,
        created_at: '2024-01-14T10:00:00Z',
        updated_at: '2024-01-14T10:00:00Z',
      },
    ];

    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 2,
      results: mockAlerts,
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current.unreadCount).toBe(1);
    });
  });

  it('debe marcar una alerta como leída', async () => {
    const mockAlerts = [
      {
        id: 1,
        budget: 1,
        budget_category_name: 'Alimentación',
        budget_spent_percentage: '85.5',
        budget_amount: '500000',
        alert_type: 'warning' as AlertType,
        is_read: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 1,
      results: mockAlerts,
    });

    vi.mocked(alertServiceModule.alertService.markAsRead).mockResolvedValue({
      message: 'Alert marked as read',
      alert: mockAlerts[0] as BudgetAlert,
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current.alerts.length).toBeGreaterThan(0);
    });

    await act(async () => {
    await result.current.markAsRead(1);
    });

    await waitFor(() => {
      expect(alertServiceModule.alertService.markAsRead).toHaveBeenCalledWith(1);
      expect(result.current.alerts[0].is_read).toBe(true);
    });
  });

  it('debe marcar todas las alertas como leídas', async () => {
    const mockAlerts = [
      {
        id: 1,
        budget: 1,
        budget_category_name: 'Alimentación',
        budget_spent_percentage: '85.5',
        budget_amount: '500000',
        alert_type: 'warning' as AlertType,
        is_read: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 1,
      results: mockAlerts,
    });

    vi.mocked(alertServiceModule.alertService.markAllAsRead).mockResolvedValue({
      message: 'All alerts marked as read',
      marked_count: 1,
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current.alerts.length).toBeGreaterThan(0);
    });

    await act(async () => {
    await result.current.markAllAsRead();
    });

    await waitFor(() => {
      expect(alertServiceModule.alertService.markAllAsRead).toHaveBeenCalled();
      expect(result.current.alerts.every((a) => a.is_read)).toBe(true);
    });
  });

  it('debe eliminar una alerta', async () => {
    const mockAlerts = [
      {
        id: 1,
        budget: 1,
        budget_category_name: 'Alimentación',
        budget_spent_percentage: '85.5',
        budget_amount: '500000',
        alert_type: 'warning' as AlertType,
        is_read: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 1,
      results: mockAlerts,
    });

    vi.mocked(alertServiceModule.alertService.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current.alerts.length).toBe(1);
    });

    await act(async () => {
    await result.current.deleteAlert(1);
    });

    await waitFor(() => {
      expect(alertServiceModule.alertService.delete).toHaveBeenCalledWith(1);
      expect(result.current.alerts.length).toBe(0);
    });
  });

  it('no debe cargar alertas cuando el usuario no está autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    expect(result.current.alerts).toEqual([]);
    expect(alertServiceModule.alertService.list).not.toHaveBeenCalled();
  });

  it('debe manejar errores al cargar alertas', async () => {
    vi.mocked(alertServiceModule.alertService.list).mockRejectedValue(
      new Error('Error de red')
    );

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toContain('Error de red');
  });

  it('debe manejar errores al marcar alerta como leída', async () => {
    const mockAlerts = [
      {
        id: 1,
        budget: 1,
        budget_category_name: 'Alimentación',
        budget_spent_percentage: '85.5',
        budget_amount: '500000',
        alert_type: 'warning' as AlertType,
        is_read: false,
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      },
    ];

    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 1,
      results: mockAlerts,
    });

    vi.mocked(alertServiceModule.alertService.markAsRead).mockRejectedValue(
      new Error('Error al marcar como leída')
    );

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current.alerts.length).toBeGreaterThan(0);
    });

    await act(async () => {
      try {
        await result.current.markAsRead(1);
      } catch {
        void 0;
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('debe obtener una alerta específica', async () => {
    const mockAlert = {
      id: 1,
      budget: 1,
      budget_category_name: 'Alimentación',
      budget_spent_percentage: '85.5',
      budget_amount: '500000',
      alert_type: 'warning' as AlertType,
      is_read: false,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
    };

    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    vi.mocked(alertServiceModule.alertService.get).mockResolvedValue(mockAlert as BudgetAlert);

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    let alert;
    await act(async () => {
      alert = await result.current.getAlert(1);
    });

    expect(alert).toEqual(mockAlert);
    expect(alertServiceModule.alertService.get).toHaveBeenCalledWith(1);
  });

  it('debe refrescar alertas con filtros', async () => {
    vi.mocked(alertServiceModule.alertService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const { result } = renderHook(() => useAlerts(), {
      wrapper: ({ children }) => <AlertProvider>{children}</AlertProvider>,
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    await act(async () => {
      await result.current.refreshAlerts({ unread: true });
    });

    expect(alertServiceModule.alertService.list).toHaveBeenCalledWith({ unread: true });
  });
});


