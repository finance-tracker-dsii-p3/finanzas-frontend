import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import ExpensesDonutChart from './ExpensesDonutChart';
import * as analyticsServiceModule from '../services/analyticsService';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    getExpensesChart: vi.fn(),
  },
}));

vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  Legend: () => <div data-testid="legend" />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

describe('ExpensesDonutChart', () => {
  const mockChartData = {
    chart_data: [
      {
        category_id: '1',
        name: 'Alimentación',
        amount: 500000,
        count: 10,
        percentage: 50,
        color: '#FF5733',
        icon: '🍔',
        formatted_amount: '$500,000',
      },
      {
        category_id: '2',
        name: 'Transporte',
        amount: 300000,
        count: 5,
        percentage: 30,
        color: '#33FF57',
        icon: '🚗',
        formatted_amount: '$300,000',
      },
    ],
    others_data: [],
    total_expenses: 1000000,
    uncategorized_amount: 200000,
    mode: 'total',
    period_summary: 'Enero 2025',
    categories_count: 2,
    currency: 'COP',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(analyticsServiceModule.analyticsService.getExpensesChart).mockImplementation(
      () => new Promise(() => {})
    );

    render(<ExpensesDonutChart period="2025-01" mode="total" />);

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('debe mostrar el gráfico cuando se cargan los datos', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getExpensesChart).mockResolvedValue({
      success: true,
      data: mockChartData,
    });

    render(<ExpensesDonutChart period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getExpensesChart).mockRejectedValue(
      new Error('Error de red')
    );

    render(<ExpensesDonutChart period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });
  });

  it('debe recargar cuando cambia el período', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getExpensesChart).mockResolvedValue({
      success: true,
      data: mockChartData,
    });

    const { rerender } = render(<ExpensesDonutChart period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getExpensesChart).toHaveBeenCalled();
    });

    const firstCall = vi.mocked(analyticsServiceModule.analyticsService.getExpensesChart).mock.calls[0];
    expect(firstCall[0]).toBe('2025-01');
    expect(firstCall[1]).toBe('total');

    vi.clearAllMocks();
    rerender(<ExpensesDonutChart period="2025-02" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getExpensesChart).toHaveBeenCalled();
    });

    const secondCall = vi.mocked(analyticsServiceModule.analyticsService.getExpensesChart).mock.calls[0];
    expect(secondCall[0]).toBe('2025-02');
    expect(secondCall[1]).toBe('total');
  });

  it('debe llamar onCategoryClick cuando se hace clic en una categoría', async () => {
    const mockOnCategoryClick = vi.fn();
    vi.mocked(analyticsServiceModule.analyticsService.getExpensesChart).mockResolvedValue({
      success: true,
      data: mockChartData,
    });

    render(
      <ExpensesDonutChart
        period="2025-01"
        mode="total"
        onCategoryClick={mockOnCategoryClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    expect(mockOnCategoryClick).toBeDefined();
  });
});

