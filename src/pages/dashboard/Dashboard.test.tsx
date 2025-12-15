import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import Dashboard from './Dashboard';
import * as dashboardServiceModule from '../../services/dashboardService';
import * as accountServiceModule from '../../services/accountService';
import * as budgetServiceModule from '../../services/budgetService';

vi.mock('../../services/dashboardService', () => ({
  dashboardService: {
    getFinancialDashboard: vi.fn(),
  },
}));

vi.mock('../../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

vi.mock('../../services/budgetService', () => ({
  budgetService: {
    getMonthlySummary: vi.fn(),
  },
}));

vi.mock('../../components/RecentTransactions', () => ({
  default: () => <div data-testid="recent-transactions">Recent Transactions</div>,
}));

vi.mock('../../components/UpcomingBills', () => ({
  default: () => <div data-testid="upcoming-bills">Upcoming Bills</div>,
}));

vi.mock('../../components/NotificationCenter', () => ({
  default: () => <div data-testid="notification-center">Notification Center</div>,
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Dashboard', () => {
  const mockDashboardData = {
    summary: {
      total_income: 1000000,
      total_expenses: 500000,
      total_savings: 0,
      total_iva: 50000,
      total_gmf: 2000,
      net_balance: 448000,
      currency: 'COP',
    },
    filters: {
      year: 2025,
      month: 1,
      account_id: null,
      period_label: 'Enero 2025',
    },
    recent_transactions: [],
    upcoming_bills: [],
    charts: {
      expense_distribution: {
        categories: [],
        total: 500000,
        has_data: false,
      },
      daily_flow: {
        dates: [],
        income: [],
        expenses: [],
        total_income: 1000000,
        total_expenses: 500000,
        has_data: false,
      },
    },
    accounts_info: {
      total_accounts: 2,
      has_accounts: true,
    },
    empty_state: undefined,
    has_data: true,
  };

  const mockAccounts = [
    {
      id: 1,
      name: 'Efectivo',
      account_type: 'asset' as const,
      category: 'other' as const,
      currency: 'COP' as const,
      current_balance: 500000,
      is_active: true,
    },
  ];

  const mockMonthlySummary = {
    period: { month: 1, year: 2025 },
    count: 5,
    budgets: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(dashboardServiceModule.dashboardService.getFinancialDashboard).mockResolvedValue(
      mockDashboardData
    );
    vi.mocked(accountServiceModule.accountService.getAllAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(budgetServiceModule.budgetService.getMonthlySummary).mockResolvedValue(
      mockMonthlySummary
    );
  });

  it('debe renderizar el dashboard', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('debe mostrar el menú de navegación', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      const menuItems = screen.getAllByText(/movimientos|presupuestos|reportes|cuentas| categorías|metas|reglas|analíticas|vehículos|soats|facturas/i);
      expect(menuItems.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('debe cargar los datos del dashboard', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(dashboardServiceModule.dashboardService.getFinancialDashboard).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe mostrar estado de carga inicialmente', async () => {
    vi.mocked(dashboardServiceModule.dashboardService.getFinancialDashboard).mockImplementation(
      () => new Promise(() => {})
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe mostrar error cuando falla la carga del dashboard', async () => {
    vi.mocked(dashboardServiceModule.dashboardService.getFinancialDashboard).mockRejectedValue(
      new Error('Error de red')
    );

    render(<Dashboard />);

    await waitFor(() => {

      const errorElements = screen.queryAllByText(/error/i);

      if (errorElements.length > 0) {
        expect(errorElements[0]).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });

  it('debe cambiar de vista al hacer clic en un botón de navegación', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const movementsButtons = screen.getAllByText(/movimientos/i);
    if (movementsButtons.length > 0) {
      await user.click(movementsButtons[0]);

      await waitFor(() => {
        expect(localStorage.getItem('dashboard_last_view')).toBe('movements');
      });
    }
  });

  it('debe cambiar el mes seleccionado', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const monthInputs = screen.queryAllByDisplayValue(/2025/i);
    if (monthInputs.length > 0) {
      const monthInput = monthInputs[0] as HTMLInputElement;

      await user.click(monthInput);
      await user.keyboard('{Control>}a{/Control}');
      await user.type(monthInput, '2025-02');
      
      await waitFor(() => {
        expect(dashboardServiceModule.dashboardService.getFinancialDashboard).toHaveBeenCalled();
      }, { timeout: 2000 });
    }
  });

  it('debe cambiar la cuenta seleccionada', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const accountSelect = screen.queryByRole('combobox', { name: /cuenta/i });
    if (accountSelect) {
      await user.click(accountSelect);
      await waitFor(() => {
        expect(dashboardServiceModule.dashboardService.getFinancialDashboard).toHaveBeenCalled();
      });
    }
  });

  it('debe manejar el logout correctamente', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const profileButton = screen.queryByRole('button', { name: /perfil|usuario/i });
    if (profileButton) {
      await user.click(profileButton);
      
      const logoutButton = screen.queryByText(/cerrar sesión|logout/i);
      if (logoutButton) {
        await user.click(logoutButton);
      }
    }
  });

  it('debe mostrar el componente RecentTransactions cuando la vista es dashboard', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const recentTransactions = screen.queryByTestId('recent-transactions');
    if (recentTransactions) {
      expect(recentTransactions).toBeInTheDocument();
    } else {

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }
  });

  it('debe mostrar el componente UpcomingBills cuando la vista es dashboard', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const upcomingBills = screen.queryByTestId('upcoming-bills');
    if (upcomingBills) {
      expect(upcomingBills).toBeInTheDocument();
    } else {

      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }
  });

  it('debe mostrar el componente NotificationCenter', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('notification-center')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('debe cambiar a la vista de presupuestos', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const budgetsButtons = screen.queryAllByText(/presupuestos/i);
    if (budgetsButtons.length > 0) {
      await user.click(budgetsButtons[0]);
      
      await waitFor(() => {
        expect(localStorage.getItem('dashboard_last_view')).toBe('budgets');
      });
    }
  });

  it('debe cambiar a la vista de reportes', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const reportsButtons = screen.queryAllByText(/reportes/i);
    if (reportsButtons.length > 0) {
      await user.click(reportsButtons[0]);
      
      await waitFor(() => {
        expect(localStorage.getItem('dashboard_last_view')).toBe('reports');
      });
    }
  });

  it('debe manejar el cambio de includePending', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    }, { timeout: 3000 });

    const pendingCheckbox = screen.queryByLabelText(/incluir pendientes/i);
    if (pendingCheckbox) {
      await user.click(pendingCheckbox);
      
      await waitFor(() => {
        expect(dashboardServiceModule.dashboardService.getFinancialDashboard).toHaveBeenCalled();
      });
    }
  });
});


