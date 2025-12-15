import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import PaymentInstallmentModal from './PaymentInstallmentModal';
import * as accountServiceModule from '../services/accountService';
import * as creditCardPlanServiceModule from '../services/creditCardPlanService';
import type { InstallmentPlan, InstallmentPayment } from '../services/creditCardPlanService';

vi.mock('../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

vi.mock('../services/creditCardPlanService', () => ({
  creditCardPlanService: {
    recordPayment: vi.fn(),
  },
}));

describe('PaymentInstallmentModal', () => {
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
    payments: [],
    created_at: '2025-01-15T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  };

  const mockInstallment = {
    id: 1,
    installment_number: 1,
    due_date: '2025-02-15',
    installment_amount: 100000,
    principal_amount: 80000,
    interest_amount: 20000,
    status: 'pending' as const,
    payment_date: null,
    notes: '',
  };

  const mockAccounts = [
    {
      id: 1,
      name: 'Efectivo',
      account_type: 'asset' as const,
      category: 'other' as const,
      currency: 'COP' as const,
      is_active: true,
    },
  ];

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountServiceModule.accountService.getAllAccounts).mockResolvedValue(mockAccounts as accountServiceModule.Account[]);
    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.recordPayment).mockResolvedValue({
      payment: {
        id: 1,
        status: 'completed',
        payment_date: '2025-02-15',
      },
      transactions: {
        transfer_id: 1,
        interest_id: 2,
      },
    } as creditCardPlanServiceModule.PaymentResponse);
  });

  it('debe renderizar el modal', async () => {
    render(
      <PaymentInstallmentModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
        installment={mockInstallment as InstallmentPayment}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/registrar pago de cuota/i)).toBeInTheDocument();
    });
  });

  it('debe cargar las cuentas origen', async () => {
    render(
      <PaymentInstallmentModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
        installment={mockInstallment as InstallmentPayment}
      />
    );

    await waitFor(() => {
      expect(accountServiceModule.accountService.getAllAccounts).toHaveBeenCalled();
    });
  });

  it('debe mostrar el botón de cerrar', async () => {
    render(
      <PaymentInstallmentModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
        installment={mockInstallment as InstallmentPayment}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('debe registrar un pago exitosamente', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <PaymentInstallmentModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
        installment={mockInstallment as InstallmentPayment}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/registrar pago de cuota/i)).toBeInTheDocument();
    });

    const accountSelect = screen.queryByLabelText(/cuenta origen/i);
    if (accountSelect) {
      await user.selectOptions(accountSelect, '1');
    }

    const submitButton = screen.getByRole('button', { name: /registrar|guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(creditCardPlanServiceModule.creditCardPlanService.recordPayment).toHaveBeenCalled();
    });
  });

  it('debe mostrar error al registrar pago', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.recordPayment).mockRejectedValue(
      new Error('Error al registrar pago')
    );

    render(
      <PaymentInstallmentModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
        installment={mockInstallment as InstallmentPayment}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/registrar pago de cuota/i)).toBeInTheDocument();
    });

    const accountSelect = screen.queryByLabelText(/cuenta origen/i);
    if (accountSelect) {
      await user.selectOptions(accountSelect, '1');
    }

    const submitButton = screen.getByRole('button', { name: /registrar|guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error al registrar pago/i)).toBeInTheDocument();
    });
  });
});

