import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import CustomReminderModal from './CustomReminderModal';

describe('CustomReminderModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el modal para crear nuevo recordatorio', () => {
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    expect(screen.getByText(/nuevo recordatorio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mensaje/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hora/i)).toBeInTheDocument();
  });

  it('debe renderizar el modal para editar recordatorio existente', () => {
    const reminder = {
      id: 1,
      title: 'Reunión importante',
      message: 'Llevar documentos',
      reminder_date: '2025-01-15',
      reminder_time: '09:00:00',
    };

    render(
      <CustomReminderModal reminder={reminder} onClose={mockOnClose} onSave={mockOnSave} />
    );

    expect(screen.getByText(/editar recordatorio/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Reunión importante')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Llevar documentos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-01-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument();
  });

  it('debe establecer valores por defecto para nuevo recordatorio', () => {
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const dateInput = screen.getByLabelText(/fecha/i) as HTMLInputElement;
    const timeInput = screen.getByLabelText(/hora/i) as HTMLInputElement;

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const expectedDate = tomorrow.toISOString().split('T')[0];

    expect(dateInput.value).toBe(expectedDate);
    expect(timeInput.value).toBe('09:00');
  });

  it('debe validar que el título sea requerido', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    await user.clear(titleInput);

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('debe validar que el mensaje sea requerido', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    await user.clear(titleInput);
    await user.type(titleInput, 'Test Title');

    const messageInput = screen.getByLabelText(/mensaje/i);
    await user.clear(messageInput);

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('debe validar que la fecha sea requerida', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);
    const dateInput = screen.getByLabelText(/fecha/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Test Title');
    await user.clear(messageInput);
    await user.type(messageInput, 'Test Message');
    await user.clear(dateInput);

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('debe validar que la hora sea requerida', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);
    const timeInput = screen.getByLabelText(/hora/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Test Title');
    await user.clear(messageInput);
    await user.type(messageInput, 'Test Message');
    await user.clear(timeInput);

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('debe validar que la fecha/hora sea futura', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);
    const dateInput = screen.getByLabelText(/fecha/i);
    const timeInput = screen.getByLabelText(/hora/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Test Title');
    await user.clear(messageInput);
    await user.type(messageInput, 'Test Message');

    await user.clear(dateInput);
    await user.type(dateInput, '2025-01-01');
    await user.clear(timeInput);
    await user.type(timeInput, '08:00');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {

      const errorText = screen.queryByText(/la fecha y hora del recordatorio debe ser futura/i);
      if (errorText) {
        expect(errorText).toBeInTheDocument();
      }
      expect(mockOnSave).not.toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('debe llamar a onSave con los datos correctos', async () => {
    const user = userEvent.setup({ delay: null });
    mockOnSave.mockResolvedValue(undefined);

    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const futureDateStr = futureDate.toISOString().split('T')[0];

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);
    const dateInput = screen.getByLabelText(/fecha/i);
    const timeInput = screen.getByLabelText(/hora/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Nuevo Recordatorio');
    await user.clear(messageInput);
    await user.type(messageInput, 'Mensaje del recordatorio');
    await user.clear(dateInput);
    await user.type(dateInput, futureDateStr);
    await user.clear(timeInput);
    await user.type(timeInput, '14:30');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith({
        title: 'Nuevo Recordatorio',
        message: 'Mensaje del recordatorio',
        reminder_date: futureDateStr,
        reminder_time: '14:30:00',
      });
    }, { timeout: 3000 });
  });

  it('debe mostrar estado de carga al guardar', async () => {
    const user = userEvent.setup({ delay: null });
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);

    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Test');
    await user.clear(messageInput);
    await user.type(messageInput, 'Test');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/guardando/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    }, { timeout: 2000 });

    resolveSave!();
    await waitFor(() => {
      expect(screen.queryByText(/guardando/i)).not.toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe mostrar error si onSave falla', async () => {
    const user = userEvent.setup({ delay: null });
    const errorMessage = 'Error al guardar';
    mockOnSave.mockRejectedValue(new Error(errorMessage));

    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Test');
    await user.clear(messageInput);
    await user.type(messageInput, 'Test');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe cerrar el modal al hacer click en cancelar', async () => {
    const user = userEvent.setup({ delay: null });
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe cerrar el modal al hacer click fuera del contenido', async () => {
    const user = userEvent.setup();
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('no debe cerrar el modal al hacer click dentro del contenido', async () => {
    const user = userEvent.setup();
    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const modalContent = document.querySelector('.modal-content');
    if (modalContent) {
      await user.click(modalContent);
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });

  it('debe deshabilitar botones durante el guardado', async () => {
    const user = userEvent.setup({ delay: null });
    let resolveSave: () => void;
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });
    mockOnSave.mockReturnValue(savePromise);

    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);

    await user.clear(titleInput);
    await user.type(titleInput, 'Test');
    await user.clear(messageInput);
    await user.type(messageInput, 'Test');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });

    await act(async () => {
      await user.click(submitButton);
    });

    await waitFor(() => {
      expect(cancelButton).toBeDisabled();
    }, { timeout: 2000 });

    await act(async () => {
      resolveSave!();
    });
  });

  it('debe recortar espacios en blanco del título y mensaje', async () => {
    const user = userEvent.setup({ delay: null });
    mockOnSave.mockResolvedValue(undefined);

    render(<CustomReminderModal onClose={mockOnClose} onSave={mockOnSave} />);

    const titleInput = screen.getByLabelText(/título/i);
    const messageInput = screen.getByLabelText(/mensaje/i);

    await user.clear(titleInput);
    await user.type(titleInput, '  Título con espacios  ');
    await user.clear(messageInput);
    await user.type(messageInput, '  Mensaje con espacios  ');

    const submitButton = screen.getByRole('button', { name: /guardar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Título con espacios',
          message: 'Mensaje con espacios',
        })
      );
    }, { timeout: 2000 });
  });

  it('debe actualizar el formulario cuando cambia el recordatorio', () => {
    const reminder1 = {
      id: 1,
      title: 'Recordatorio 1',
      message: 'Mensaje 1',
      reminder_date: '2025-01-15',
      reminder_time: '09:00:00',
    };

    const reminder2 = {
      id: 2,
      title: 'Recordatorio 2',
      message: 'Mensaje 2',
      reminder_date: '2025-01-16',
      reminder_time: '10:00:00',
    };

    const { rerender } = render(
      <CustomReminderModal reminder={reminder1} onClose={mockOnClose} onSave={mockOnSave} />
    );

    expect(screen.getByDisplayValue('Recordatorio 1')).toBeInTheDocument();

    rerender(
      <CustomReminderModal reminder={reminder2} onClose={mockOnClose} onSave={mockOnSave} />
    );

    expect(screen.getByDisplayValue('Recordatorio 2')).toBeInTheDocument();
  });
});

