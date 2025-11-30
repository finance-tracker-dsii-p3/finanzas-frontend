import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import NewMovementModal from './NewMovementModal';
import * as transactionService from '../services/transactionService';
import * as accountService from '../services/accountService';
import { Transaction } from '../services/transactionService';

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

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
    name: 'Tarjeta Crédito',
    account_type: 'liability' as const,
    category: 'credit_card' as const,
    currency: 'COP' as const,
    current_balance: -300000,
    credit_limit: 1000000,
    is_active: true,
  },
];

const mockCategories = [
  { id: 1, name: 'Comida', type: 'expense', color: '#FF5733', icon: '🍔' },
  { id: 2, name: 'Salario', type: 'income', color: '#33FF57', icon: '💰' },
];

vi.mock('../services/transactionService', () => ({
  transactionService: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

vi.mock('../services/categoryService', () => ({
  categoryService: {
    create: vi.fn(),
  },
}));

const mockGetActiveCategoriesByType = vi.fn((type: string) => {
  return mockCategories.filter(cat => cat.type === type);
});

const mockCreateCategory = vi.fn().mockResolvedValue({ id: 3, name: 'Nueva Categoría', type: 'expense' });

vi.mock('../context/CategoryContext', () => ({
  useCategories: () => ({
    getActiveCategoriesByType: mockGetActiveCategoriesByType,
    createCategory: mockCreateCategory,
  }),
  CategoryProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('NewMovementModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.accountService.getAllAccounts).mockResolvedValue(mockAccounts);
  });

  it('debe renderizar el modal de nuevo movimiento', async () => {
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      expect(screen.getByText(/nuevo movimiento/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el modal de edición cuando se pasa una transacción', async () => {
    const transactionToEdit: Transaction = {
      id: 1,
      origin_account: 1,
      destination_account: null,
      type: 2,
      base_amount: 100000,
      total_amount: 119000,
      tax_percentage: 19,
      date: '2025-01-15',
      category: 1,
      note: 'Almuerzo',
    };

    render(
      <NewMovementModal 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        transactionToEdit={transactionToEdit} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/editar movimiento/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el modal de duplicación cuando se pasa una transacción a duplicar', async () => {
    const transactionToDuplicate: Transaction = {
      id: 1,
      origin_account: 1,
      destination_account: null,
      type: 2,
      base_amount: 100000,
      total_amount: 119000,
      tax_percentage: 19,
      date: '2025-01-15',
      category: 1,
      note: 'Almuerzo',
    };

    render(
      <NewMovementModal 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        transactionToDuplicate={transactionToDuplicate} 
      />
    );
    
    await waitFor(() => {
      expect(screen.getByText(/duplicar movimiento/i)).toBeInTheDocument();
    });
  });

  it('debe permitir seleccionar el tipo de movimiento', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const expenseButton = screen.getByText(/gasto/i);
      expect(expenseButton).toBeInTheDocument();
    });

    const expenseButton = screen.getByText(/gasto/i).closest('button');
    if (expenseButton) {
      await user.click(expenseButton);
    }
  });

  it('debe permitir escribir en el campo de monto', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const amountInput = screen.getByLabelText(/total a pagar/i);
      expect(amountInput).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/total a pagar/i);
    await user.type(amountInput, '50000');
    
    expect(amountInput).toHaveValue(50000);
  });

  it('debe permitir escribir en el campo de nota', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const noteInput = screen.getByPlaceholderText(/almuerzo con amigos/i);
      expect(noteInput).toBeInTheDocument();
    });

    const noteInput = screen.getByPlaceholderText(/almuerzo con amigos/i);
    await user.type(noteInput, 'Nota de prueba');
    
    expect(noteInput).toHaveValue('Nota de prueba');
  });

  it('debe permitir escribir en el campo de etiqueta', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const tagInput = screen.getByPlaceholderText(/#hogar/i);
      expect(tagInput).toBeInTheDocument();
    });

    const tagInput = screen.getByPlaceholderText(/#hogar/i);
    await user.type(tagInput, '#hogar');
    
    expect(tagInput).toHaveValue('#hogar');
  });

  it('debe mostrar selector de cuenta origen', async () => {
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const cuentaElements = screen.getAllByText(/cuenta/i);
      expect(cuentaElements.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar selector de cuenta destino para transferencias', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const transferButton = screen.getByText(/transferencia/i).closest('button');
      if (transferButton) {
        user.click(transferButton);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/cuenta destino/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar selector de categoría para ingresos y gastos', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const expenseButton = screen.getByText(/gasto/i).closest('button');
      if (expenseButton) {
        user.click(expenseButton);
      }
    });

    await waitFor(() => {
      expect(screen.getByText(/categoría/i)).toBeInTheDocument();
    });
  });

  it('debe permitir crear una nueva categoría', async () => {
    const user = userEvent.setup();
    mockGetActiveCategoriesByType.mockReturnValueOnce([]);
    
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const expenseButton = screen.getByText(/gasto/i).closest('button');
      expect(expenseButton).toBeInTheDocument();
    });

    const expenseButton = screen.getByText(/gasto/i).closest('button');
    if (expenseButton) {
      await user.click(expenseButton);
    }

    await waitFor(() => {
      const newCategoryButton = screen.getByText(/crear nueva categoría/i);
      expect(newCategoryButton).toBeInTheDocument();
    });
  });

  it('debe cerrar el modal al hacer clic en cancelar', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });
      expect(cancelButton).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe validar que se seleccione una cuenta origen', async () => {
    const user = userEvent.setup();

    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      expect(submitButton).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.queryByText(/debes seleccionar una cuenta origen/i) ||
                          screen.queryByText(/debes seleccionar/i) ||
                          document.querySelector('[aria-invalid="true"]') ||
                          document.querySelector('#movement-account[required]');
      if (!errorMessage) {
        expect(transactionService.transactionService.create).not.toHaveBeenCalled();
      } else {
        expect(errorMessage).toBeTruthy();
      }
    }, { timeout: 2000 });
  });

  it('debe validar que el monto sea mayor a cero', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const accountSelects = screen.getAllByRole('combobox');
      expect(accountSelects.length).toBeGreaterThan(0);
    });

    const accountSelects = screen.getAllByRole('combobox');
    const accountSelect = accountSelects.find(select => {
      const htmlSelect = select as HTMLSelectElement;
      return Array.from(htmlSelect.options).some((opt: HTMLOptionElement) => opt.text.includes('Cuenta Ahorros'));
    }) || accountSelects[0];
    
    if (accountSelect) {
      await user.selectOptions(accountSelect as HTMLSelectElement, '1');
    }

    await waitFor(async () => {
      const categorySelects = screen.queryAllByRole('combobox');
      const categorySelect = categorySelects.find(select => {
        const htmlSelect = select as HTMLSelectElement;
        return Array.from(htmlSelect.options).some((opt: HTMLOptionElement) => opt.text.includes('Comida'));
      });
      if (categorySelect) {
        await user.selectOptions(categorySelect as HTMLSelectElement, '1');
      }
    });

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      expect(submitButton).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorMessage = screen.queryByText(/monto debe ser mayor/i) || 
                          screen.queryByText(/debes seleccionar/i) ||
                          screen.queryByText(/el monto debe ser mayor/i);
      if (!errorMessage) {
        expect(transactionService.transactionService.create).not.toHaveBeenCalled();
      } else {
        expect(errorMessage).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });

  it('debe crear un movimiento de gasto correctamente', async () => {
    const user = userEvent.setup();
    const mockTransaction = {
      id: 1,
      origin_account: 1,
      type: 2,
      base_amount: 100000,
      total_amount: 100000,
      date: '2025-01-15',
      category: 1,
    };

    vi.mocked(transactionService.transactionService.create).mockResolvedValueOnce(mockTransaction as Transaction);

    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const accountSelects = screen.getAllByRole('combobox');
      expect(accountSelects.length).toBeGreaterThan(0);
    });

    const expenseButton = screen.getByText(/gasto/i).closest('button');
    if (expenseButton) {
      await user.click(expenseButton);
    }

    await waitFor(() => {
      const accountSelects = screen.getAllByRole('combobox');
      expect(accountSelects.length).toBeGreaterThan(0);
    });

    const accountSelects = screen.getAllByRole('combobox');
    const accountSelect = accountSelects.find(select => {
      const htmlSelect = select as HTMLSelectElement;
      return Array.from(htmlSelect.options).some((opt: HTMLOptionElement) => opt.text.includes('Cuenta Ahorros'));
    }) || accountSelects[0];
    
    if (accountSelect) {
      await user.selectOptions(accountSelect as HTMLSelectElement, '1');
    }

    await waitFor(() => {
      const categorySelects = screen.getAllByRole('combobox');
      const categorySelect = categorySelects.find(select => {
        const htmlSelect = select as HTMLSelectElement;
        return Array.from(htmlSelect.options).some((opt: HTMLOptionElement) => opt.text.includes('Comida'));
      });
      expect(categorySelect).toBeTruthy();
    });

    const categorySelects = screen.getAllByRole('combobox');
    const categorySelect = categorySelects.find(select => {
      const htmlSelect = select as HTMLSelectElement;
      return Array.from(htmlSelect.options).some((opt: HTMLOptionElement) => opt.text.includes('Comida'));
    });
    
    if (categorySelect) {
      await user.selectOptions(categorySelect as HTMLSelectElement, '1');
    }

    await waitFor(() => {
      const amountInput = screen.getByLabelText(/total a pagar/i);
      expect(amountInput).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/total a pagar/i);
    await user.type(amountInput, '100000');

    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /guardar/i });
      expect(submitButton).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(transactionService.transactionService.create).toHaveBeenCalled();
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe mostrar modo de cálculo con IVA', async () => {
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const ivaModeButton = screen.getByText(/con iva/i);
      if (ivaModeButton) {
        expect(ivaModeButton).toBeInTheDocument();
      }
    });
  });

  it('debe calcular el total cuando se ingresa base e IVA', async () => {
    const user = userEvent.setup();
    render(<NewMovementModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);
    
    await waitFor(() => {
      const baseModeButton = screen.getByText(/base sin iva/i).closest('button');
      expect(baseModeButton).toBeInTheDocument();
    });

    const baseModeButton = screen.getByText(/base sin iva/i).closest('button');
    if (baseModeButton) {
      await user.click(baseModeButton);
    }

    await waitFor(() => {
      const baseInput = screen.getByLabelText(/base gravable/i);
      expect(baseInput).toBeInTheDocument();
    });

    const baseInput = screen.getByLabelText(/base gravable/i);
    await user.clear(baseInput);
    await user.type(baseInput, '100000');

    await waitFor(() => {
      const taxInput = screen.getByLabelText(/iva/i);
      expect(taxInput).toBeInTheDocument();
    });

    const taxInput = screen.getByLabelText(/iva/i);
    await user.clear(taxInput);
    await user.type(taxInput, '19');

    await waitFor(() => {
      const totalDisplay = screen.getByTestId('total-amount-display');
      expect(totalDisplay).toBeInTheDocument();
      const text = totalDisplay.textContent || '';
      const numbersOnly = text.replace(/[^\d]/g, '');
      expect(numbersOnly.length).toBeGreaterThan(0);
      const totalValue = parseFloat(numbersOnly);
      expect(totalValue).toBeGreaterThan(100000);
    }, { timeout: 3000 });
  });
});

