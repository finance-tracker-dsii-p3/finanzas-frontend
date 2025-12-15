import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import Rules from './Rules';
import * as exchangeRateServiceModule from '../../services/exchangeRateService';

vi.mock('../../services/exchangeRateService', () => ({
  exchangeRateService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  Currency: {},
}));

vi.mock('../../components/ConfirmModal', () => ({
  default: ({ isOpen, title, message, onConfirm, onCancel }: { isOpen: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void }) => {
    if (!isOpen) return null;
    return (
      <div data-testid="confirm-modal">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onConfirm}>Confirmar</button>
        <button onClick={onCancel}>Cancelar</button>
      </div>
    );
  },
}));

describe('Rules', () => {
  const mockOnBack = vi.fn();
  const mockExchangeRates = [
    {
      id: 1,
      base_currency: 'COP' as const,
      currency: 'USD' as const,
      year: 2025,
      month: 1,
      rate: '4000.00',
      source: 'manual',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exchangeRateServiceModule.exchangeRateService.list).mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: mockExchangeRates,
    } as exchangeRateServiceModule.ExchangeRateListResponse);
  });

  it('debe renderizar el componente', async () => {
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tipos de cambio/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de volver', async () => {
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /volver/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  it('debe cargar los tipos de cambio', async () => {
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(exchangeRateServiceModule.exchangeRateService.list).toHaveBeenCalled();
    });
  });

  it('debe mostrar el botón de nuevo tipo de cambio', async () => {
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      const newButton = screen.getByRole('button', { name: /nuevo/i });
      expect(newButton).toBeInTheDocument();
    });
  });

  it('debe llamar a onBack cuando se hace clic en volver', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /volver/i });
      expect(backButton).toBeInTheDocument();
    });
    
    const backButton = screen.getByRole('button', { name: /volver/i });
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('debe abrir el formulario al hacer clic en nuevo tipo de cambio', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tipos de cambio/i)).toBeInTheDocument();
    });
    
    const newButton = screen.getByRole('button', { name: /nuevo/i });
    await user.click(newButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/moneda base/i)).toBeInTheDocument();
    });
  });

  it('debe crear un nuevo tipo de cambio', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    vi.mocked(exchangeRateServiceModule.exchangeRateService.create).mockResolvedValue({
      id: 2,
      base_currency: 'COP',
      currency: 'EUR',
      year: 2025,
      month: 2,
      rate: '4500.00',
      source: 'manual',
      created_at: '2025-01-15T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    });
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tipos de cambio/i)).toBeInTheDocument();
    });
    
    const newButton = screen.getByRole('button', { name: /nuevo/i });
    await user.click(newButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/moneda base/i)).toBeInTheDocument();
    });
    
    const rateInput = screen.getByLabelText(/tasa de cambio/i);
    await user.type(rateInput, '4500');
    
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(exchangeRateServiceModule.exchangeRateService.create).toHaveBeenCalled();
    });
  });

  it('debe editar un tipo de cambio existente', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    vi.mocked(exchangeRateServiceModule.exchangeRateService.update).mockResolvedValue({
      id: 1,
      base_currency: 'COP',
      currency: 'USD',
      year: 2025,
      month: 1,
      rate: '4100.00',
      source: 'manual',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z',
    });
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('USD / COP')).toBeInTheDocument();
    });
    
    const editButtons = screen.getAllByTitle(/editar/i);
    if (editButtons.length > 0) {
      await user.click(editButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/moneda base/i)).toBeInTheDocument();
      });
      
      const rateInput = screen.getByLabelText(/tasa de cambio/i);
      await user.clear(rateInput);
      await user.type(rateInput, '4100');
      
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(exchangeRateServiceModule.exchangeRateService.update).toHaveBeenCalled();
      });
    }
  });

  it('debe eliminar un tipo de cambio', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    vi.mocked(exchangeRateServiceModule.exchangeRateService.delete).mockResolvedValue(undefined);
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('USD / COP')).toBeInTheDocument();
    });
    
    const deleteButtons = screen.getAllByTitle(/eliminar/i);
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /confirmar/i });
      await user.click(confirmButton);
      
      await waitFor(() => {
        expect(exchangeRateServiceModule.exchangeRateService.delete).toHaveBeenCalledWith(1);
      });
    }
  });

  it('debe filtrar tipos de cambio por moneda', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tipos de cambio/i)).toBeInTheDocument();
    });
    
    const selects = screen.getAllByRole('combobox');
    if (selects.length > 0) {
      await user.selectOptions(selects[0], 'USD');
      
      await waitFor(() => {
        expect(exchangeRateServiceModule.exchangeRateService.list).toHaveBeenCalled();
      });
    }
  });

  it('debe buscar tipos de cambio', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tipos de cambio/i)).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/buscar tipos de cambio/i);
    await user.type(searchInput, 'USD');
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('USD');
    });
  });

  it('debe mostrar error al crear tipo de cambio con monedas iguales', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tipos de cambio/i)).toBeInTheDocument();
    });
    
    const newButton = screen.getByRole('button', { name: /nuevo/i });
    await user.click(newButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/moneda base/i)).toBeInTheDocument();
    });
    
    const baseCurrencySelect = screen.getByLabelText(/moneda base/i);
    const currencySelect = screen.getByLabelText(/moneda a convertir/i);
    
    await user.selectOptions(baseCurrencySelect, 'COP');
    await user.selectOptions(currencySelect, 'COP');
    
    const rateInput = screen.getByLabelText(/tasa de cambio/i);
    await user.type(rateInput, '4000');
    
    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/no pueden ser iguales/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar estado vacío cuando no hay tipos de cambio', async () => {
    vi.mocked(exchangeRateServiceModule.exchangeRateService.list).mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    } as exchangeRateServiceModule.ExchangeRateListResponse);
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/no hay tipos de cambio configurados/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(exchangeRateServiceModule.exchangeRateService.list).mockRejectedValue(
      new Error('Error de red')
    );
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });
  });

  it('debe cerrar el formulario al hacer clic en cancelar', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Rules onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tipos de cambio/i)).toBeInTheDocument();
    });
    
    const newButton = screen.getByRole('button', { name: /nuevo/i });
    await user.click(newButton);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/moneda base/i)).toBeInTheDocument();
    });
    
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);
    
    await waitFor(() => {
      expect(screen.queryByLabelText(/moneda base/i)).not.toBeInTheDocument();
    });
  });
});

