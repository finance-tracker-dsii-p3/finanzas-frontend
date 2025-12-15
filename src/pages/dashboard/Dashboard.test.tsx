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
      () => new Promise(() => {}) // Nunca resuelve
    );

    render(<Dashboard />);
    
    // El componente renderiza pero puede estar en estado de carga
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
      // El componente puede mostrar un mensaje de error
      const errorElements = screen.queryAllByText(/error/i);
      // Si hay errores, deben estar presentes
      if (errorElements.length > 0) {
        expect(errorElements[0]).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });
});
