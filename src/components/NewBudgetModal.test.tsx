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
});
