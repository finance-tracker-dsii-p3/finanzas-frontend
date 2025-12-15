import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import AnalyticsIndicators from './AnalyticsIndicators';
import * as analyticsServiceModule from '../services/analyticsService';
import type { IndicatorsResponse } from '../services/analyticsService';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    getIndicators: vi.fn(),
  },
}));

describe('AnalyticsIndicators', () => {
  const mockIndicators = {
    income: {
      amount: 1000000,
      count: 10,
      formatted: '$1,000,000',
    },
    expenses: {
      amount: 500000,
      count: 5,
      formatted: '$500,000',
    },
    balance: {
      amount: 500000,
      formatted: '$500,000',
      is_positive: true,
    },
    period: {
      start: '2025-01-01',
      end: '2025-01-31',
      days: 31,
    },
    mode: 'total',
    currency: 'COP',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(analyticsServiceModule.analyticsService.getIndicators).mockImplementation(
      () => new Promise(() => {})
    );

    render(<AnalyticsIndicators period="2025-01" mode="total" />);

    expect(screen.getByText(/cargando indicadores/i)).toBeInTheDocument();
  });

  it('debe mostrar los indicadores cuando se cargan correctamente', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getIndicators).mockResolvedValue({
      success: true,
      data: mockIndicators,
    });

    render(<AnalyticsIndicators period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByText(/ingresos/i)).toBeInTheDocument();
      expect(screen.getByText(/gastos/i)).toBeInTheDocument();
      expect(screen.getByText(/balance/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getIndicators).mockRejectedValue(
      new Error('Error de red')
    );

    render(<AnalyticsIndicators period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
      expect(screen.getByText(/reintentar/i)).toBeInTheDocument();
    });
  });

  it('debe permitir reintentar cuando hay error', async () => {
    const user = userEvent.setup();
    vi.mocked(analyticsServiceModule.analyticsService.getIndicators)
      .mockRejectedValueOnce(new Error('Error de red'))
      .mockResolvedValueOnce({
        success: true,
        data: mockIndicators,
      });

    render(<AnalyticsIndicators period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/reintentar/i);
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/ingresos/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay datos', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getIndicators).mockResolvedValue({
      success: false,
      data: null as unknown as IndicatorsResponse,
    });

    render(<AnalyticsIndicators period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByText(/no hay datos disponibles/i)).toBeInTheDocument();
    });
  });

  it('debe recargar cuando cambia el período', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getIndicators).mockResolvedValue({
      success: true,
      data: mockIndicators,
    });

    const { rerender } = render(<AnalyticsIndicators period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getIndicators).toHaveBeenCalledWith(
        '2025-01',
        'total'
      );
    });

    vi.clearAllMocks();
    rerender(<AnalyticsIndicators period="2025-02" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getIndicators).toHaveBeenCalledWith(
        '2025-02',
        'total'
      );
    });
  });

  it('debe recargar cuando cambia el modo', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getIndicators).mockResolvedValue({
      success: true,
      data: mockIndicators,
    });

    const { rerender } = render(<AnalyticsIndicators period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getIndicators).toHaveBeenCalledWith(
        '2025-01',
        'total'
      );
    });

    vi.clearAllMocks();
    rerender(<AnalyticsIndicators period="2025-01" mode="base" />);

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getIndicators).toHaveBeenCalledWith(
        '2025-01',
        'base'
      );
    });
  });

  it('debe mostrar balance negativo correctamente', async () => {
    const negativeBalance = {
      ...mockIndicators,
      balance: {
        amount: -100000,
        formatted: '-$100,000',
        is_positive: false,
      },
    };

    vi.mocked(analyticsServiceModule.analyticsService.getIndicators).mockResolvedValue({
      success: true,
      data: negativeBalance,
    });

    render(<AnalyticsIndicators period="2025-01" mode="total" />);

    await waitFor(() => {
      expect(screen.getByText(/balance/i)).toBeInTheDocument();
    });
  });
});

