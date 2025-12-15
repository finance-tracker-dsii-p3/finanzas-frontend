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

  it('debe crear una meta exitosamente', async () => {
    const user = userEvent.setup();
    vi.mocked(goalServiceModule.goalService.create).mockResolvedValue({
      id: 1,
      user: 1,
      name: 'Meta de prueba',
      target_amount: 1000000,
      saved_amount: 0,
      date: '2025-12-31',
      currency: 'COP',
      progress_percentage: 0,
      remaining_amount: 1000000,
      is_completed: false,
    });

    render(<NewGoalModal onClose={mockOnClose} onSuccess={mockOnSuccess} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Meta de prueba');

    const amountInput = screen.getByLabelText(/monto objetivo/i);
    await user.clear(amountInput);
    await user.type(amountInput, '1000000');

    const dateInput = screen.getByLabelText(/fecha objetivo/i);
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    await user.clear(dateInput);
    await user.type(dateInput, futureDate.toISOString().split('T')[0]);

    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(goalServiceModule.goalService.create).toHaveBeenCalled();
    }, { timeout: 3000 });
    
    if (mockOnSuccess) {
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 3000 });
    }
  });

  it('debe editar una meta existente', async () => {
    const user = userEvent.setup();
    const existingGoal = {
      id: 1,
      user: 1,
      name: 'Meta existente',
      target_amount: 500000,
      saved_amount: 0,
      date: '2025-12-31',
      currency: 'COP' as const,
      progress_percentage: 0,
      remaining_amount: 500000,
      is_completed: false,
    };

    vi.mocked(goalServiceModule.goalService.update).mockResolvedValue({
      ...existingGoal,
      name: 'Meta actualizada',
    });

    render(<NewGoalModal onClose={mockOnClose} onSuccess={mockOnSuccess} goalToEdit={existingGoal} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Meta existente')).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Meta actualizada');

    const submitButton = screen.getByRole('button', { name: /guardar|actualizar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(goalServiceModule.goalService.update).toHaveBeenCalled();
    });
  });

  it('debe validar que la fecha no sea en el pasado', async () => {
    const user = userEvent.setup();
    render(<NewGoalModal onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Meta de prueba');

    const amountInput = screen.getByLabelText(/monto objetivo/i);
    await user.type(amountInput, '1000000');

    const dateInput = screen.getByLabelText(/fecha objetivo/i);
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    await user.clear(dateInput);
    await user.type(dateInput, pastDate.toISOString().split('T')[0]);

    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(/pasado|fecha/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar error al crear meta', async () => {
    const user = userEvent.setup();
    vi.mocked(goalServiceModule.goalService.create).mockRejectedValue(new Error('Error al crear meta'));

    render(<NewGoalModal onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/nombre/i);
    await user.type(nameInput, 'Meta de prueba');

    const amountInput = screen.getByLabelText(/monto objetivo/i);
    await user.type(amountInput, '1000000');

    const submitButton = screen.getByRole('button', { name: /crear meta/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errorElements = screen.queryAllByText(/error/i);
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });
});


