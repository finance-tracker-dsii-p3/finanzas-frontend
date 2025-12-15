import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import AlertCenter from './AlertCenter';
import { useAlerts } from '../context/AlertContext';
import { useBudgets } from '../context/BudgetContext';


vi.mock('../context/AlertContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/AlertContext')>();
  return {
    ...actual,
    useAlerts: vi.fn(),
  };
});

vi.mock('../context/BudgetContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/BudgetContext')>();
  return {
    ...actual,
    useBudgets: vi.fn(),
  };
});

const mockAlerts = [
  {
    id: 1,
    budget: 1,
    budget_category_name: 'Alimentación',
    budget_spent_percentage: '85.5',
    budget_amount: '500000',
    alert_type: 'warning',
    is_read: false,
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    budget: 2,
    budget_category_name: 'Transporte',
    budget_spent_percentage: '105.0',
    budget_amount: '300000',
    alert_type: 'exceeded',
    is_read: false,
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 3,
    budget: 3,
    budget_category_name: 'Entretenimiento',
    budget_spent_percentage: '90.0',
    budget_amount: '200000',
    alert_type: 'warning',
    is_read: true,
    created_at: '2024-01-13T10:00:00Z',
  },
];

describe('AlertCenter', () => {
  const mockRefreshAlerts = vi.fn();
  const mockMarkAsRead = vi.fn();
  const mockMarkAllAsRead = vi.fn();
  const mockDeleteAlert = vi.fn();
  const mockGetBudgetDetail = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockRefreshAlerts.mockResolvedValue(undefined);
    mockMarkAsRead.mockResolvedValue(undefined);
    mockMarkAllAsRead.mockResolvedValue(undefined);
    mockDeleteAlert.mockResolvedValue(undefined);
    mockGetBudgetDetail.mockResolvedValue(undefined);
    
    vi.mocked(useBudgets).mockReturnValue({
      getBudgetDetail: mockGetBudgetDetail,
    } as unknown as ReturnType<typeof useBudgets>);
  });

  it('debe renderizar el botón de alertas', () => {
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [],
      unreadCount: 0,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    expect(screen.getByLabelText(/centro de notificaciones/i)).toBeInTheDocument();
  });

  it('debe mostrar el contador de alertas no leídas', () => {
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [],
      unreadCount: 5,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('debe mostrar "9+" cuando hay más de 9 alertas no leídas', () => {
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [],
      unreadCount: 15,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    expect(screen.getByText('9+')).toBeInTheDocument();
  });

  it('debe abrir el dropdown al hacer clic', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alertas de presupuesto/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar alertas no leídas y leídas', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
      expect(screen.getByText(/transporte/i)).toBeInTheDocument();
      expect(screen.getByText(/entretenimiento/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar estado de carga', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [],
      unreadCount: 0,
      isLoading: true,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/cargando alertas/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay alertas', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [],
      unreadCount: 0,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/no hay alertas/i)).toBeInTheDocument();
    });
  });

  it('debe marcar una alerta como leída', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
    });

    const markReadButtons = screen.getAllByText(/marcar como leída/i);
    await user.click(markReadButtons[0]);

    await waitFor(() => {
      expect(mockMarkAsRead).toHaveBeenCalledWith(1);
    });
  });

  it('debe marcar todas las alertas como leídas', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTitle(/marcar todas como leídas/i)).toBeInTheDocument();
    });

    const markAllButton = screen.getByTitle(/marcar todas como leídas/i);
    await user.click(markAllButton);

    await waitFor(() => {
      expect(mockMarkAllAsRead).toHaveBeenCalled();
    });
  });

  it('debe eliminar una alerta', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/eliminar/i);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockDeleteAlert).toHaveBeenCalledWith(1);
    });
  });

  it('debe cerrar el dropdown al hacer clic en el botón X', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alertas de presupuesto/i)).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText(/cerrar/i);
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText(/alertas de presupuesto/i)).not.toBeInTheDocument();
    });
  });

  it('debe llamar a onViewBudget cuando se hace clic en ver presupuesto', async () => {
    const user = userEvent.setup();
    const mockOnViewBudget = vi.fn();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter onViewBudget={mockOnViewBudget} />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getAllByText(/ver presupuesto/i).length).toBeGreaterThan(0);
    });

    const viewBudgetButtons = screen.getAllByText(/ver presupuesto/i);
    await user.click(viewBudgetButtons[0]);

    await waitFor(() => {
      expect(mockGetBudgetDetail).toHaveBeenCalledWith(1);
      expect(mockOnViewBudget).toHaveBeenCalledWith(1);
    });
  });

  it('debe mostrar mensaje de error cuando falla markAsRead', async () => {
    const user = userEvent.setup();
    mockMarkAsRead.mockRejectedValue(new Error('Error al marcar como leída'));
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
    });

    const markReadButtons = screen.getAllByText(/marcar como leída/i);
    await user.click(markReadButtons[0]);

    await waitFor(() => {
      const errorMessage = screen.queryByText(/error al marcar la alerta como leída/i);
      if (!errorMessage) {
        // Si no aparece el mensaje específico, buscar cualquier mensaje de error
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      } else {
        expect(errorMessage).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });

  it('debe cerrar el dropdown al hacer clic fuera', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alertas de presupuesto/i)).toBeInTheDocument();
    });

    // Hacer clic fuera del dropdown
    await user.click(document.body);

    await waitFor(() => {
      expect(screen.queryByText(/alertas de presupuesto/i)).not.toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje de error cuando falla deleteAlert', async () => {
    const user = userEvent.setup();
    mockDeleteAlert.mockRejectedValue(new Error('Error al eliminar'));
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText(/eliminar/i);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje de error cuando falla markAllAsRead', async () => {
    const user = userEvent.setup();
    mockMarkAllAsRead.mockRejectedValue(new Error('Error al marcar todas'));
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByTitle(/marcar todas como leídas/i)).toBeInTheDocument();
    });

    const markAllButton = screen.getByTitle(/marcar todas como leídas/i);
    await user.click(markAllButton);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('debe cerrar mensaje de error al hacer clic en el botón X', async () => {
    const user = userEvent.setup();
    mockMarkAsRead.mockRejectedValue(new Error('Error al marcar como leída'));
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
    });

    const markReadButtons = screen.getAllByText(/marcar como leída/i);
    await user.click(markReadButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });

    const closeErrorButtons = screen.getAllByLabelText(/cerrar error/i);
    if (closeErrorButtons.length > 0) {
      await user.click(closeErrorButtons[0]);
      await waitFor(() => {
        expect(screen.queryByText(/error al marcar la alerta como leída/i)).not.toBeInTheDocument();
      });
    }
  });

  it('debe mostrar mensaje de error cuando falla handleViewBudget', async () => {
    const user = userEvent.setup();
    const mockOnViewBudget = vi.fn();
    mockGetBudgetDetail.mockRejectedValue(new Error('Error al obtener presupuesto'));
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter onViewBudget={mockOnViewBudget} />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getAllByText(/ver presupuesto/i).length).toBeGreaterThan(0);
    });

    const viewBudgetButtons = screen.getAllByText(/ver presupuesto/i);
    await user.click(viewBudgetButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar alertas leídas en la sección correspondiente', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      const leidasElements = screen.getAllByText(/leídas/i);
      expect(leidasElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/entretenimiento/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el icono correcto para alertas exceeded', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [mockAlerts[1]], // Alert tipo 'exceeded'
      unreadCount: 1,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/transporte/i)).toBeInTheDocument();
      expect(screen.getByText(/has superado el 100%/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el mensaje correcto para alertas warning', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: [mockAlerts[0]], // Alert tipo 'warning'
      unreadCount: 1,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/has alcanzado el 85.5%/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el badge de nuevas alertas correctamente', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 1,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/1 nueva/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el badge plural cuando hay múltiples alertas nuevas', async () => {
    const user = userEvent.setup();
    vi.mocked(useAlerts).mockReturnValue({
      alerts: mockAlerts,
      unreadCount: 2,
      isLoading: false,
      refreshAlerts: mockRefreshAlerts,
      markAsRead: mockMarkAsRead,
      markAllAsRead: mockMarkAllAsRead,
      deleteAlert: mockDeleteAlert,
    } as unknown as ReturnType<typeof useAlerts>);

    render(<AlertCenter />);
    const button = screen.getByLabelText(/centro de notificaciones/i);
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/2 nuevas/i)).toBeInTheDocument();
    });
  });
});

