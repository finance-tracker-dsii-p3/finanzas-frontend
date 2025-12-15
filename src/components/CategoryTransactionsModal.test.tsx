import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import CategoryTransactionsModal from './CategoryTransactionsModal';
import * as analyticsServiceModule from '../services/analyticsService';

vi.mock('../services/analyticsService', () => ({
  analyticsService: {
    getCategoryTransactions: vi.fn(),
  },
}));

describe('CategoryTransactionsModal', () => {
  const mockTransactions = [
    {
      id: 1,
      date: '2025-01-15',
      description: 'Compra en supermercado',
      amount: 50000,
      formatted_amount: '$50,000',
      account: 'Efectivo',
      tag: 'comida',
      category: {
        id: 1,
        name: 'Alimentación',
        color: '#FF5733',
        icon: '🍔',
      },
    },
    {
      id: 2,
      date: '2025-01-14',
      description: 'Pago de servicios',
      amount: 100000,
      formatted_amount: '$100,000',
      account: 'Banco',
      tag: undefined,
      category: {
        id: 2,
        name: 'Servicios',
        color: '#33FF57',
        icon: '💡',
      },
    },
  ];

  const mockResponse = {
    success: true,
    data: {
      transactions: mockTransactions,
      total_count: 2,
      showing_count: 2,
      category_name: 'Alimentación',
      total_amount: 150000,
      formatted_total: '$150,000',
      period: {
        start: '2025-01-01',
        end: '2025-01-31',
      },
      mode: 'total',
      has_more: false,
    },
  };

  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal', () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    const transaccionesElements = screen.getAllByText(/transacciones/i);
    expect(transaccionesElements.length).toBeGreaterThan(0);
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/cargando transacciones/i)).toBeInTheDocument();
  });

  it('debe mostrar las transacciones cuando se cargan correctamente', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockResolvedValue(
      mockResponse
    );

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
      expect(screen.getByText(/compra en supermercado/i)).toBeInTheDocument();
      expect(screen.getByText(/pago de servicios/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar información de la categoría', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockResolvedValue(
      mockResponse
    );

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/2 transacciones/i)).toBeInTheDocument();
      expect(screen.getByText(/\$150,000/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockRejectedValue(
      new Error('Error de red')
    );

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
      expect(screen.getByText(/reintentar/i)).toBeInTheDocument();
    });
  });

  it('debe permitir reintentar cuando hay error', async () => {
    const user = userEvent.setup();
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions)
      .mockRejectedValueOnce(new Error('Error de red'))
      .mockResolvedValueOnce(mockResponse);

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/reintentar/i);
    await user.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText(/compra en supermercado/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay transacciones', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockResolvedValue({
      success: true,
      data: {
        transactions: [],
        total_count: 0,
        showing_count: 0,
        category_name: 'Alimentación',
        total_amount: 0,
        formatted_total: '$0',
        period: {
          start: '2025-01-01',
          end: '2025-01-31',
        },
        mode: 'total',
        has_more: false,
      },
    });

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText(/no hay transacciones en esta categoría/i)
      ).toBeInTheDocument();
    });
  });

  it('debe cerrar el modal al hacer clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockResolvedValue(
      mockResponse
    );

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: '' });
      expect(closeButton).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByRole('button');
    const closeButton = closeButtons.find((btn) => {
      const svg = btn.querySelector('svg');
      return svg !== null;
    });

    if (closeButton) {
      await user.click(closeButton);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('debe cerrar el modal al hacer clic fuera', async () => {
    const user = userEvent.setup();
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockResolvedValue(
      mockResponse
    );

    const { container } = render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/alimentación/i)).toBeInTheDocument();
    });

    const overlay = container.querySelector('.category-modal-overlay');
    if (overlay) {
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('debe mostrar tags cuando están presentes', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockResolvedValue(
      mockResponse
    );

    render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/comida/i)).toBeInTheDocument();
    });
  });

  it('debe recargar cuando cambian los props', async () => {
    vi.mocked(analyticsServiceModule.analyticsService.getCategoryTransactions).mockResolvedValue(
      mockResponse
    );

    const { rerender } = render(
      <CategoryTransactionsModal
        categoryId="1"
        period="2025-01"
        mode="total"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getCategoryTransactions).toHaveBeenCalledWith(
        '1',
        '2025-01',
        'total'
      );
    });

    vi.clearAllMocks();
    rerender(
      <CategoryTransactionsModal
        categoryId="2"
        period="2025-02"
        mode="base"
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(analyticsServiceModule.analyticsService.getCategoryTransactions).toHaveBeenCalledWith(
        '2',
        '2025-02',
        'base'
      );
    });
  });
});

