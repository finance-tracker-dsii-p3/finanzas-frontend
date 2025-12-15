import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import PeriodComparison from './PeriodComparison';
import * as analyticsServiceModule from '../services/analyticsService';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    comparePeriods: vi.fn(),
  },
}));

describe('PeriodComparison', () => {
  const mockComparison = {
    success: true,
    data: {
      comparison_summary: {
        period1: {
          name: 'Enero 2025',
          date_range: '2025-01-01 a 2025-01-31',
          has_data: true,
          transactions_count: 10,
        },
        period2: {
          name: 'Febrero 2025',
          date_range: '2025-02-01 a 2025-02-28',
          has_data: true,
          transactions_count: 12,
        },
        can_compare: true,
        mode: 'total',
      },
      period_data: {
        period1: {
          income: { amount: 1000000, count: 10, formatted: '$1,000,000' },
          expenses: { amount: 500000, count: 5, formatted: '$500,000' },
          balance: { amount: 500000, formatted: '$500,000', is_positive: true },
          period: { start: '2025-01-01', end: '2025-01-31', days: 31 },
          mode: 'total',
          currency: 'COP',
        },
        period2: {
          income: { amount: 1200000, count: 12, formatted: '$1,200,000' },
          expenses: { amount: 600000, count: 6, formatted: '$600,000' },
          balance: { amount: 600000, formatted: '$600,000', is_positive: true },
          period: { start: '2025-02-01', end: '2025-02-28', days: 28 },
          mode: 'total',
          currency: 'COP',
        },
      },
      differences: {
        income: {
          absolute: 200000,
          percentage: 20,
          is_increase: true,
          is_significant: true,
          period1_amount: 1000000,
          period2_amount: 1200000,
          formatted_absolute: '$200,000',
          summary: 'Aumento del 20%',
        },
        expenses: {
          absolute: 100000,
          percentage: 20,
          is_increase: true,
          is_significant: true,
          period1_amount: 500000,
          period2_amount: 600000,
          formatted_absolute: '$100,000',
          summary: 'Aumento del 20%',
        },
        balance: {
          absolute: 100000,
          percentage: 20,
          is_increase: true,
          is_significant: true,
          period1_amount: 500000,
          period2_amount: 600000,
          formatted_absolute: '$100,000',
          summary: 'Aumento del 20%',
        },
      },
      insights: {
        messages: ['Los ingresos aumentaron'],
        alert_level: 'info' as const,
        has_significant_changes: true,
      },
      metadata: {
        generated_at: '2025-01-15T10:00:00Z',
        comparison_mode: 'total',
        currency: 'COP',
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el componente', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.comparePeriods).mockResolvedValue(
      mockComparison
    );

    render(<PeriodComparison />);

    await waitFor(() => {
      expect(screen.getByText(/comparación de períodos/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(analyticsServiceModule.analyticsService.comparePeriods).mockImplementation(
      () => new Promise(() => {})
    );

    render(<PeriodComparison />);
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('debe mostrar la comparación cuando se cargan los datos', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.comparePeriods).mockResolvedValue(
      mockComparison
    );

    render(<PeriodComparison />);

    await waitFor(() => {
      expect(screen.getByText(/enero 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/febrero 2025/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.comparePeriods).mockRejectedValue(
      new Error('Error de red')
    );

    render(<PeriodComparison />);

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });
  });
});

