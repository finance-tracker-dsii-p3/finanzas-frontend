import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import DailyFlowChart from './DailyFlowChart';
import * as analyticsServiceModule from '../services/analyticsService';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    getDailyFlowChart: vi.fn(),
  },
}));

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
}));

describe('DailyFlowChart', () => {
  const mockChartData = {
    dates: ['2025-01-01', '2025-01-02', '2025-01-03'],
    series: {
      income: {
        name: 'Ingresos',
        data: [100000, 200000, 150000],
        color: '#10b981',
        total: 450000,
      },
      expenses: {
        name: 'Gastos',
        data: [50000, 80000, 60000],
        color: '#ef4444',
        total: 190000,
      },
      balance: {
        name: 'Balance',
        data: [50000, 120000, 90000],
        color: '#3b82f6',
        final: 260000,
      },
    },
    summary: {
      period_days: 3,
      total_income: 450000,
      total_expenses: 190000,
      final_balance: 260000,
      avg_daily_income: 150000,
      avg_daily_expense: 63333,
    },
    mode: 'total',
    period: {
      start: '2025-01-01',
      end: '2025-01-03',
    },
    currency: 'COP',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(analyticsServiceModule.analyticsService.getDailyFlowChart).mockImplementation(
      () => new Promise(() => {}) // Nunca resuelve
    );

    render(<DailyFlowChart period="2025-01" mode="total" />);

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('debe mostrar el gráfico cuando se cargan los datos', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getDailyFlowChart).mockResolvedValue({
      success: true,
      data: mockChartData,
    });

    render(<DailyFlowChart period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getDailyFlowChart).mockRejectedValue(
      new Error('Error de red')
    );

    render(<DailyFlowChart period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });
  });

  it('debe recargar cuando cambia el período', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getDailyFlowChart).mockResolvedValue({
      success: true,
      data: mockChartData,
    });

    const { rerender } = render(<DailyFlowChart period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getDailyFlowChart).toHaveBeenCalledWith(
        '2025-01',
        'total'
      );
    });

    vi.clearAllMocks();
    rerender(<DailyFlowChart period="2025-02" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getDailyFlowChart).toHaveBeenCalledWith(
        '2025-02',
        'total'
      );
    });
  });

  it('debe recargar cuando cambia el modo', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getDailyFlowChart).mockResolvedValue({
      success: true,
      data: mockChartData,
    });

    const { rerender } = render(<DailyFlowChart period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getDailyFlowChart).toHaveBeenCalledWith(
        '2025-01',
        'total'
      );
    });

    vi.clearAllMocks();
    rerender(<DailyFlowChart period="2025-01" mode="base" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getDailyFlowChart).toHaveBeenCalledWith(
        '2025-01',
        'base'
      );
    });
  });
});
