import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import CreateInstallmentPlanModal from './CreateInstallmentPlanModal';
import * as accountServiceModule from '../services/accountService';
import * as creditCardPlanServiceModule from '../services/creditCardPlanService';
import * as transactionServiceModule from '../services/transactionService';

vi.mock('../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

vi.mock('../services/creditCardPlanService', () => ({
  creditCardPlanService: {
    createPlan: vi.fn(),
  },
}));

vi.mock('../utils/financingCategoryUtils', () => ({
  ensureFinancingCategory: vi.fn().mockResolvedValue(1),
}));

describe('CreateInstallmentPlanModal', () => {
  const mockTransaction = {
    id: 1,
    type: 2 as const,
    date: '2025-01-15',
    total_amount: 1000000,
    base_amount: 1000000,
    origin_account: 1,
    destination_account: null,
    category: 1,
    tax_percentage: null,
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  const mockCreditCards = [
    {
      id: 1,
      name: 'Tarjeta de Crédito',
      account_type: 'liability' as const,
      category: 'credit_card' as const,
      currency: 'COP' as const,
      is_active: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountServiceModule.accountService.getAllAccounts).mockResolvedValue(mockCreditCards as accountServiceModule.Account[]);
    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.createPlan).mockResolvedValue(1);
  });

  it('debe renderizar el modal', async () => {
    render(
      <CreateInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        purchaseTransaction={mockTransaction as transactionServiceModule.Transaction}
      />
    );

    await waitFor(() => {
      const titles = screen.getAllByText(/crear plan de cuotas/i);
      expect(titles.length).toBeGreaterThan(0);
    });
  });

  it('debe cargar las tarjetas de crédito', async () => {
    render(
      <CreateInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        purchaseTransaction={mockTransaction as transactionServiceModule.Transaction}
      />
    );

    await waitFor(() => {
      expect(accountServiceModule.accountService.getAllAccounts).toHaveBeenCalled();
    });
  });

  it('debe mostrar el botón de cerrar', async () => {
    render(
      <CreateInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        purchaseTransaction={mockTransaction as transactionServiceModule.Transaction}
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
      <CreateInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        purchaseTransaction={mockTransaction as transactionServiceModule.Transaction}
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

  it('debe crear un plan de cuotas exitosamente', async () => {
    const user = userEvent.setup();

    render(
      <CreateInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        purchaseTransaction={mockTransaction as transactionServiceModule.Transaction}
      />
    );

    await waitFor(() => {
      const titles = screen.getAllByText(/crear plan de cuotas/i);
      expect(titles.length).toBeGreaterThan(0);
    });

    const creditCardSelect = screen.queryByLabelText(/tarjeta de crédito/i);
    if (creditCardSelect) {
      await user.selectOptions(creditCardSelect, '1');
    }

    const installmentsInput = screen.queryByLabelText(/número de cuotas/i);
    if (installmentsInput) {
      await user.type(installmentsInput, '12');
    }

    const submitButton = screen.getByRole('button', { name: /crear|guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(creditCardPlanServiceModule.creditCardPlanService.createPlan).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe mostrar error al crear plan', async () => {
    const user = userEvent.setup();

    vi.mocked(creditCardPlanServiceModule.creditCardPlanService.createPlan).mockRejectedValue(
      new Error('Error al crear plan')
    );

    render(
      <CreateInstallmentPlanModal
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        purchaseTransaction={mockTransaction as transactionServiceModule.Transaction}
      />
    );

    await waitFor(() => {
      const titles = screen.getAllByText(/crear plan de cuotas/i);
      expect(titles.length).toBeGreaterThan(0);
    });

    const creditCardSelect = screen.queryByLabelText(/tarjeta de crédito/i);
    if (creditCardSelect) {
      await user.selectOptions(creditCardSelect, '1');
    }

    const submitButton = screen.getByRole('button', { name: /crear plan de cuotas/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(/error/i);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});

