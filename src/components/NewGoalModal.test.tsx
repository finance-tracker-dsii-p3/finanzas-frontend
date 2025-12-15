import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import NewGoalModal from './NewGoalModal';
import * as goalServiceModule from '../services/goalService';

vi.mock('../services/goalService', () => ({
  goalService: {
    create: vi.fn(),
    update: vi.fn(),
  },
}));

describe('NewGoalModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal', () => {
    render(<NewGoalModal onClose={mockOnClose} />);
    expect(screen.getByText(/nueva meta|editar meta/i)).toBeInTheDocument();
  });

  it('debe cerrar el modal al hacer clic en cancelar', async () => {
    const user = userEvent.setup();
    render(<NewGoalModal onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/cancelar/i);
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe validar que el nombre sea requerido', async () => {
    const user = userEvent.setup();
    vi.mocked(goalServiceModule.goalService.create).mockResolvedValue({
      id: 1,
      user: 1,
      name: 'Meta',
      target_amount: 1000000,
      saved_amount: 0,
      date: '2025-12-31',
      currency: 'COP',
      progress_percentage: 0,
      remaining_amount: 1000000,
      is_completed: false,
    });

    render(<NewGoalModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    const submitButton = screen.getByRole('button', { name: /guardar|crear/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(/nombre|requerido/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('debe validar que el monto sea mayor a cero', async () => {
    const user = userEvent.setup();
    render(<NewGoalModal onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Meta de prueba');

    const amountInput = screen.getByLabelText(/monto objetivo/i);
    await user.clear(amountInput);
    await user.type(amountInput, '0');

    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(/monto|objetivo|mayor|cero/i);
      expect(errorElements.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});
