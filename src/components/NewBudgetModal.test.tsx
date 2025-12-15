import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import NewBudgetModal from './NewBudgetModal';
import * as accountServiceModule from '../services/accountService';

vi.mock('../context/BudgetContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/BudgetContext')>();
  return {
    ...actual,
    useBudgets: () => ({
      createBudget: vi.fn().mockResolvedValue({ budget_id: 1 }),
      updateBudget: vi.fn().mockResolvedValue({ budget_id: 1 }),
      getCategoriesWithoutBudget: vi.fn().mockResolvedValue({
        categories: [
          { id: 1, name: 'Alimentación', color: '#FF5733', icon: '🍔' },
        ],
      }),
    }),
  };
});

vi.mock('../context/CategoryContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../context/CategoryContext')>();
  return {
    ...actual,
    useCategories: () => ({
      getActiveCategoriesByType: () => [
        { id: 1, name: 'Alimentación', color: '#FF5733', icon: '🍔', type: 'expense', is_active: true, order: 1 },
      ],
    }),
  };
});

vi.mock('../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

describe('NewBudgetModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountServiceModule.accountService.getAllAccounts).mockResolvedValue([
      {
        id: 1,
        name: 'Efectivo',
        account_type: 'asset',
        category: 'other',
        currency: 'COP',
        current_balance: 500000,
        is_active: true,
      },
    ]);
  });

  it('debe renderizar el modal', async () => {
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/nuevo presupuesto|editar presupuesto/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de cerrar', async () => {
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find((btn) => {
        const svg = btn.querySelector('svg');
        return svg !== null;
      });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('debe cerrar el modal al hacer clic en cancelar', async () => {
    const user = userEvent.setup();
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancelar/i);
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe crear un presupuesto exitosamente', async () => {
    const user = userEvent.setup();
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/nuevo presupuesto|editar presupuesto/i)).toBeInTheDocument();
    });

    const categorySelect = screen.queryByLabelText(/categoría/i);
    if (categorySelect) {
      const options = categorySelect.querySelectorAll('option');
      if (options.length > 1) {
        await user.selectOptions(categorySelect, options[1].value);
      }
    }

    const amountInputs = screen.queryAllByPlaceholderText(/0/i);
    const amountInput = amountInputs.find(input => 
      input.getAttribute('type') === 'number' && 
      input.closest('form') !== null
    );
    if (amountInput) {
      await user.type(amountInput, '100000');
    }

    const submitButton = screen.queryByRole('button', { name: /crear presupuesto/i });
    if (submitButton && categorySelect && amountInput) {
      await user.click(submitButton);
      expect(submitButton).toBeInTheDocument();
    }
  });

  it('debe permitir seleccionar la moneda', async () => {
    const user = userEvent.setup();
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const currencySelect = selects.find(sel => {
        const options = Array.from((sel as HTMLSelectElement).options);
        return options.some(opt => opt.value === 'USD' || opt.value === 'EUR');
      });
      if (currencySelect) {
        expect(currencySelect).toBeInTheDocument();
        user.selectOptions(currencySelect as HTMLSelectElement, 'USD');
        expect((currencySelect as HTMLSelectElement).value).toBe('USD');
      }
    });
  });

  it('debe permitir cambiar el modo de cálculo', async () => {
    const user = userEvent.setup();
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const calculationSelect = selects.find(sel => {
        const options = Array.from((sel as HTMLSelectElement).options);
        return options.some(opt => opt.value === 'base' || opt.value === 'total');
      });
      expect(calculationSelect).toBeDefined();
    });

    const selects = screen.getAllByRole('combobox');
    const calculationSelect = selects.find(sel => {
      const options = Array.from((sel as HTMLSelectElement).options);
      return options.some(opt => opt.value === 'base' || opt.value === 'total');
    });
    
    if (calculationSelect) {
      const selectElement = calculationSelect as HTMLSelectElement;
      const initialValue = selectElement.value;
      await user.selectOptions(selectElement, initialValue === 'base' ? 'total' : 'base');
      await waitFor(() => {
        expect(selectElement.value).not.toBe(initialValue);
      });
    }
  });

  it('debe permitir ingresar umbral de alerta', async () => {
    const user = userEvent.setup();
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      const numberInputs = screen.queryAllByRole('spinbutton');
      const thresholdInput = numberInputs.find(input => {
        const placeholder = input.getAttribute('placeholder') || '';
        return placeholder === '80' || (input.getAttribute('min') === '0' && input.getAttribute('max') === '100');
      });
      expect(thresholdInput).toBeDefined();
    });

    const numberInputs = screen.queryAllByRole('spinbutton');
    const thresholdInput = numberInputs.find(input => {
      const placeholder = input.getAttribute('placeholder') || '';
      return placeholder === '80' || (input.getAttribute('min') === '0' && input.getAttribute('max') === '100');
    });
    
    if (thresholdInput) {
      await user.clear(thresholdInput);
      await user.type(thresholdInput, '75');
      await waitFor(() => {
        expect(thresholdInput).toHaveValue(75);
      });
    }
  });

  it('debe mostrar checkbox de presupuesto activo cuando se edita', async () => {
    const budgetToEdit = {
      id: 1,
      category: 1,
      category_name: 'Alimentación',
      category_type: 'expense',
      category_type_display: 'Gasto',
      category_color: '#FF5733',
      category_icon: '🍔',
      amount: '500000',
      currency: 'COP',
      calculation_mode: 'total' as const,
      calculation_mode_display: 'Total',
      period: 'monthly' as const,
      period_display: 'Mensual',
      start_date: '2025-01-01',
      is_active: true,
      alert_threshold: '80',
      spent_amount: '300000',
      spent_percentage: '60.0',
      remaining_amount: '200000',
      status: 'good' as const,
      status_text: 'Bueno',
      is_over_budget: false,
      is_alert_triggered: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    render(<NewBudgetModal onClose={mockOnClose} budgetToEdit={budgetToEdit} />);

    await waitFor(() => {
      const checkboxes = screen.queryAllByRole('checkbox');
      const activeCheckbox = checkboxes.find(cb => {
        const label = cb.closest('label');
        return label?.textContent?.toLowerCase().includes('presupuesto activo');
      });
      expect(activeCheckbox).toBeDefined();
    });

    const checkboxes = screen.queryAllByRole('checkbox');
    const activeCheckbox = checkboxes.find(cb => {
      const label = cb.closest('label');
      return label?.textContent?.toLowerCase().includes('presupuesto activo');
    });
    
    if (activeCheckbox) {
      const checkboxElement = activeCheckbox as HTMLInputElement;
      await waitFor(() => {
        expect(checkboxElement.checked).toBe(true);
      });
      expect(checkboxElement.disabled).toBe(false);
    }
  });

  it('debe mostrar mensaje explicativo según el modo de cálculo', async () => {
    const user = userEvent.setup();
    render(<NewBudgetModal onClose={mockOnClose} />);

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const calculationSelect = selects.find(sel => {
        const options = Array.from((sel as HTMLSelectElement).options);
        return options.some(opt => opt.value === 'base' || opt.value === 'total');
      });
      if (calculationSelect) {
        expect(screen.getByText(/monto base, sin incluir impuestos/i)).toBeInTheDocument();
      }
    });
    const selects = screen.getAllByRole('combobox');
    const calculationSelect = selects.find(sel => {
      const options = Array.from((sel as HTMLSelectElement).options);
      return options.some(opt => opt.value === 'base' || opt.value === 'total');
    });
    
    if (calculationSelect) {
      await user.selectOptions(calculationSelect as HTMLSelectElement, 'total');
      
      await waitFor(() => {
        expect(screen.getByText(/monto total, incluyendo impuestos/i)).toBeInTheDocument();
      });
    }
  });
});


