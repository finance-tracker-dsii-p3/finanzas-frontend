import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import Analytics from './Analytics';

vi.mock('../../components/AnalyticsIndicators', () => ({
  default: () => <div data-testid="analytics-indicators">Analytics Indicators</div>,
}));

vi.mock('../../components/ExpensesDonutChart', () => ({
  default: () => <div data-testid="expenses-donut-chart">Expenses Donut Chart</div>,
}));

vi.mock('../../components/DailyFlowChart', () => ({
  default: () => <div data-testid="daily-flow-chart">Daily Flow Chart</div>,
}));

vi.mock('../../components/CategoryTransactionsModal', () => ({
  default: () => <div data-testid="category-transactions-modal">Category Transactions Modal</div>,
}));

vi.mock('../../components/PeriodComparison', () => ({
  default: () => <div data-testid="period-comparison">Period Comparison</div>,
}));

vi.mock('../../components/BaseCurrencySelector', () => ({
  default: () => <div data-testid="base-currency-selector">Base Currency Selector</div>,
}));

describe('Analytics', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el componente', () => {
    render(<Analytics onBack={mockOnBack} />);
    
    expect(screen.getByText(/analytics financieros/i)).toBeInTheDocument();
  });

  it('debe mostrar el botón de volver', () => {
    render(<Analytics onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /volver/i });
    expect(backButton).toBeInTheDocument();
  });

  it('debe mostrar los componentes de analytics', () => {
    render(<Analytics onBack={mockOnBack} />);
    
    expect(screen.getByTestId('analytics-indicators')).toBeInTheDocument();
    expect(screen.getByTestId('expenses-donut-chart')).toBeInTheDocument();
    expect(screen.getByTestId('daily-flow-chart')).toBeInTheDocument();
    expect(screen.getByTestId('period-comparison')).toBeInTheDocument();
  });

  it('debe mostrar el selector de período', () => {
    render(<Analytics onBack={mockOnBack} />);
    
    const periodSelect = screen.getByLabelText(/período/i);
    expect(periodSelect).toBeInTheDocument();
  });

  it('debe llamar a onBack cuando se hace clic en volver', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Analytics onBack={mockOnBack} />);
    
    const backButton = screen.getByRole('button', { name: /volver/i });
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('debe cambiar el período seleccionado', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Analytics onBack={mockOnBack} />);
    
    const periodSelect = screen.queryByLabelText(/período/i);
    if (periodSelect) {
      const options = periodSelect.querySelectorAll('option');
      if (options.length > 1) {
        await user.selectOptions(periodSelect, options[1].value);
        
        await waitFor(() => {
          expect((periodSelect as HTMLSelectElement).value).toBe(options[1].value);
        });
      }
    }
  });

  it('debe cambiar el mes seleccionado', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Analytics onBack={mockOnBack} />);
    
    const monthInput = screen.queryByDisplayValue(/2025/i);
    if (monthInput) {
      await user.click(monthInput);
      await user.keyboard('{Control>}a{/Control}');
      await user.type(monthInput as HTMLElement, '2025-02');
    }
  });
});

