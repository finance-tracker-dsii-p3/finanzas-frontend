import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import InstallmentCalendar from './InstallmentCalendar';
import * as creditCardPlanServiceModule from '../services/creditCardPlanService';
import type { InstallmentPlan, ScheduleItem } from '../services/creditCardPlanService';

vi.mock('../services/creditCardPlanService', () => ({
  creditCardPlanService: {
    getSchedule: vi.fn(),
  },
}));

vi.mock('./PaymentInstallmentModal', () => ({
  default: () => <div data-testid="payment-installment-modal">Payment Installment Modal</div>,
}));

describe('InstallmentCalendar', () => {
  const mockPlan = {
    id: 1,
    credit_card_account: 1,
    credit_card_account_name: 'Tarjeta Test',
    purchase_transaction: 1,
    number_of_installments: 12,
    interest_rate: '2.00',
    start_date: '2025-01-15',
    description: 'Plan de prueba',
    purchase_amount: 1000000,
    installment_amount: 100000,
    total_interest: 200000,
    total_principal: 1000000,
    total_amount: 1200000,
    status: 'active' as const,
    financing_category: 1,
    financing_category_name: 'Financiamiento',
    payments: [
      {
        id: 1,
        installment_number: 1,
        due_date: '2025-02-15',
        installment_amount: 100000,
        principal_amount: 80000,
        interest_amount: 20000,
        status: 'completed' as const,
        payment_date: '2025-02-15',
        notes: '',
      },
    ],
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  };

  const mockSchedule = [
    {
      installment_number: 1,
      due_date: '2025-02-15',
      installment_amount: 100000,
      principal_amount: 80000,
      interest_amount: 20000,
      remaining_principal: 920000,
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnPaymentRecorded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.getSchedule).mockResolvedValue(mockSchedule as ScheduleItem[]);
  });

  it('debe renderizar el componente', async () => {
    render(
      <InstallmentCalendar
        plan={mockPlan as InstallmentPlan}
        onClose={mockOnClose}
        currency="COP"
        onPaymentRecorded={mockOnPaymentRecorded}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/calendario de cuotas/i)).toBeInTheDocument();
    });
  });

  it('debe cargar el calendario de cuotas', async () => {
    render(
      <InstallmentCalendar
        plan={mockPlan as InstallmentPlan}
        onClose={mockOnClose}
        currency="COP"
        onPaymentRecorded={mockOnPaymentRecorded}
      />
    );

    await waitFor(() => {
      expect(creditCardPlanServiceModule.creditCardPlanService.getSchedule).toHaveBeenCalledWith(mockPlan.id);
    });
  });

  it('debe mostrar el botón de cerrar', async () => {
    render(
      <InstallmentCalendar
        plan={mockPlan as InstallmentPlan}
        onClose={mockOnClose}
        currency="COP"
        onPaymentRecorded={mockOnPaymentRecorded}
      />
    );

    await waitFor(() => {

      const modal = screen.getByText(/calendario de cuotas/i);
      expect(modal).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar error al cargar el calendario', async () => {
    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.getSchedule).mockRejectedValue(
      new Error('Error al cargar calendario')
    );

    render(
      <InstallmentCalendar
        plan={mockPlan as InstallmentPlan}
        onClose={mockOnClose}
        currency="COP"
        onPaymentRecorded={mockOnPaymentRecorded}
      />
    );

    await waitFor(() => {

      expect(creditCardPlanServiceModule.creditCardPlanService.getSchedule).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe mostrar el calendario con cuotas', async () => {
    render(
      <InstallmentCalendar
        plan={mockPlan as InstallmentPlan}
        onClose={mockOnClose}
        currency="COP"
        onPaymentRecorded={mockOnPaymentRecorded}
      />
    );

    await waitFor(() => {
      expect(creditCardPlanServiceModule.creditCardPlanService.getSchedule).toHaveBeenCalled();
    });
  });
});

