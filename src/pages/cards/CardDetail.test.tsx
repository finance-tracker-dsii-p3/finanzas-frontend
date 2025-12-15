import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import CardDetail from './CardDetail';
import * as creditCardPlanServiceModule from '../../services/creditCardPlanService';

vi.mock('../../services/creditCardPlanService', () => ({
  creditCardPlanService: {
    listPlans: vi.fn(),
  },
}));

vi.mock('../../components/InstallmentCalendar', () => ({
  default: () => <div data-testid="installment-calendar">Installment Calendar</div>,
}));

vi.mock('../../components/EditInstallmentPlanModal', () => ({
  default: () => <div data-testid="edit-installment-plan-modal">Edit Installment Plan Modal</div>,
}));

describe('CardDetail', () => {
  const mockCard = {
    id: 1,
    name: 'Tarjeta de Crédito',
    bankName: 'Banco Test',
    accountNumber: '1234567890',
    limit: 5000000,
    available: 3000000,
    used: 2000000,
    currentDebt: 2000000,
    totalPaid: 1000000,
    utilizationPercentage: 40,
    currency: 'COP',
    color: '#3B82F6',
  };

  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.listPlans).mockResolvedValue([]);
  });

  it('debe renderizar el componente', async () => {
    render(<CardDetail card={mockCard} onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/tarjeta de crédito/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de volver', async () => {
    render(<CardDetail card={mockCard} onBack={mockOnBack} />);
    
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /volver/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  it('debe mostrar información de la tarjeta', async () => {
    render(<CardDetail card={mockCard} onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(mockCard.bankName)).toBeInTheDocument();

      expect(screen.getByText(/7890/)).toBeInTheDocument();
    });
  });

  it('debe cargar los planes de cuotas', async () => {
    render(<CardDetail card={mockCard} onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(creditCardPlanServiceModule.creditCardPlanService.listPlans).toHaveBeenCalled();
    });
  });

  it('debe llamar a onBack cuando se hace clic en volver', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<CardDetail card={mockCard} onBack={mockOnBack} />);
    
    await waitFor(() => {
      const backButton = screen.getByRole('button', { name: /volver/i });
      expect(backButton).toBeInTheDocument();
    });
    
    const backButton = screen.getByRole('button', { name: /volver/i });
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });
});

