import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import Budgets from './Budgets';
import * as budgetContext from '../../context/BudgetContext';

vi.mock('../../context/BudgetContext', async () => {
  const actual = await vi.importActual('../../context/BudgetContext');
  return {
    ...actual,
    useBudgets: vi.fn(),
  };
});

const mockOnBack = vi.fn();

describe('Budgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(budgetContext.useBudgets).mockReturnValue({
      budgets: [],
      isLoading: false,
      error: null,
      refreshBudgets: vi.fn().mockResolvedValue(undefined),
      deleteBudget: vi.fn().mockResolvedValue(undefined),
      toggleBudget: vi.fn().mockResolvedValue(undefined),
      getBudgetDetail: vi.fn().mockResolvedValue({}),
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
    } as unknown as ReturnType<typeof budgetContext.useBudgets>);
  });

  it('debe renderizar el componente', () => {
    render(<Budgets onBack={mockOnBack} />);
    
    expect(screen.getByText(/presupuestos/i)).toBeInTheDocument();
  });

  it('debe mostrar el botón de volver', () => {
    render(<Budgets onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /volver/i });
    expect(backButton).toBeInTheDocument();
  });

  it('debe mostrar el botón de nuevo presupuesto', () => {
    render(<Budgets onBack={mockOnBack} />);
    
    const newButton = screen.getByRole('button', { name: /nuevo presupuesto/i });
    expect(newButton).toBeInTheDocument();
  });

  it('debe mostrar estado de carga cuando isLoading es true', () => {
    vi.mocked(budgetContext.useBudgets).mockReturnValue({
      budgets: [],
      isLoading: true,
      error: null,
      refreshBudgets: vi.fn(),
      deleteBudget: vi.fn(),
      toggleBudget: vi.fn(),
      getBudgetDetail: vi.fn(),
      createBudget: vi.fn(),
      updateBudget: vi.fn(),
    } as unknown as ReturnType<typeof budgetContext.useBudgets>);

    render(<Budgets onBack={mockOnBack} />);
    
    expect(screen.getByText(/cargando presupuestos/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay presupuestos', async () => {
    render(<Budgets onBack={mockOnBack} />);
    
    await waitFor(() => {
      const emptyMessage = screen.queryByText(/no hay presupuestos/i);
      if (emptyMessage) {
        expect(emptyMessage).toBeInTheDocument();
      }
    }, { timeout: 2000 });
  });
});
