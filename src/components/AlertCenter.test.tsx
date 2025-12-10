import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils/test-utils';
import AlertCenter from './AlertCenter';
import { useAlerts } from '../context/AlertContext';
import { useBudgets } from '../context/BudgetContext';


vi.mock('../context/AlertContext', () => ({
  useAlerts: vi.fn(),
  AlertProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../context/BudgetContext', () => ({
  useBudgets: vi.fn(),
  BudgetProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AlertCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useBudgets).mockReturnValue({
      getBudgetDetail: vi.fn(),
    } as unknown as ReturnType<typeof useBudgets>);
  });

  it('debe renderizar el botón de alertas', () => {
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [],
      unreadCount: 0,
      isLoading: false,
      refreshAlerts: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteAlert: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);

    vi.mocked(useBudgets).mockReturnValue({
      getBudgetDetail: vi.fn(),
    } as unknown as ReturnType<typeof useBudgets>);

    render(<AlertCenter />);
    expect(screen.getByLabelText(/centro de notificaciones/i)).toBeInTheDocument();
  });

  it('debe mostrar el contador de alertas no leídas', () => {
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [],
      unreadCount: 5,
      isLoading: false,
      refreshAlerts: vi.fn(),
      markAsRead: vi.fn(),
      markAllAsRead: vi.fn(),
      deleteAlert: vi.fn(),
    } as unknown as ReturnType<typeof useAlerts>);

    vi.mocked(useBudgets).mockReturnValue({
      getBudgetDetail: vi.fn(),
    } as unknown as ReturnType<typeof useBudgets>);

    render(<AlertCenter />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});

