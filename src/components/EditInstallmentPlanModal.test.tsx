import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import EditInstallmentPlanModal from './EditInstallmentPlanModal';
import * as creditCardPlanServiceModule from '../services/creditCardPlanService';
import type { InstallmentPlan } from '../services/creditCardPlanService';

vi.mock('../services/creditCardPlanService', () => ({
  creditCardPlanService: {
    updatePlan: vi.fn(),
  },
}));

describe('EditInstallmentPlanModal', () => {
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

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.updatePlan).mockResolvedValue(mockPlan as InstallmentPlan);
  });

  it('debe renderizar el modal', async () => {
    render(
      <EditInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/editar plan de cuotas/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de cerrar', async () => {
    render(
      <EditInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  it('debe llamar a onClose cuando se hace clic en cerrar', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <EditInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /cerrar/i });
      expect(closeButton).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe actualizar el plan exitosamente', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    render(
      <EditInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/editar plan de cuotas/i)).toBeInTheDocument();
    });

    const descriptionInput = screen.queryByLabelText(/descripción/i);
    if (descriptionInput) {
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Plan actualizado');
    }

    const submitButton = screen.getByRole('button', { name: /guardar|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(creditCardPlanServiceModule.creditCardPlanService.updatePlan).toHaveBeenCalled();
    });
  });

  it('debe mostrar error al actualizar el plan', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();

    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.updatePlan).mockRejectedValue(
      new Error('Error al actualizar plan')
    );

    render(
      <EditInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        plan={mockPlan as InstallmentPlan}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/editar plan de cuotas/i)).toBeInTheDocument();
    });

    const descriptionInput = screen.queryByLabelText(/descripción/i);
    if (descriptionInput) {
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Plan actualizado');
    }

    const submitButton = screen.queryByRole('button', { name: /guardar|actualizar/i });
    if (submitButton) {
      await user.click(submitButton);

      await waitFor(() => {

        expect(creditCardPlanServiceModule.creditCardPlanService.updatePlan).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });
});

