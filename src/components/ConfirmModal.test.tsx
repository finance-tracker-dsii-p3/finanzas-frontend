import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import ConfirmModal from './ConfirmModal';

describe('ConfirmModal', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal con título y mensaje', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        title="Confirmar acción"
        message="¿Estás seguro?"
      />
    );

    expect(screen.getByText('Confirmar acción')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
  });

  it('debe llamar onConfirm cuando se hace clic en confirmar', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        isOpen={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        title="Confirmar"
        message="Mensaje"
      />
    );

    const confirmButton = screen.getByRole('button', { name: /aceptar/i });
    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('debe llamar onCancel cuando se hace clic en cancelar', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        isOpen={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        title="Confirmar"
        message="Mensaje"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('debe llamar onCancel cuando se hace clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(
      <ConfirmModal
        isOpen={true}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        title="Confirmar"
        message="Mensaje"
      />
    );

    const closeButton = screen.getByRole('button', { name: /cerrar/i });
    await user.click(closeButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('no debe renderizar cuando isOpen es false', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onCancel={mockOnCancel}
        onConfirm={mockOnConfirm}
        title="Confirmar"
        message="Mensaje"
      />
    );

    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
  });
});

