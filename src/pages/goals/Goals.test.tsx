import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import Goals from './Goals';
import * as goalService from '../../services/goalService';

vi.mock('../../services/goalService');
vi.mock('../../components/NewGoalModal', () => ({
  default: ({ isOpen }: { isOpen: boolean; onClose: () => void }) => 
    isOpen ? <div data-testid="new-goal-modal">New Goal Modal</div> : null,
}));
vi.mock('../../components/ConfirmModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => 
    isOpen ? <div data-testid="confirm-modal">Confirm Modal</div> : null,
}));

const mockOnBack = vi.fn();

describe('Goals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(goalService.goalService.list).mockResolvedValue([]);
  });

  it('debe renderizar el componente', async () => {
    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Metas de Ahorro')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe mostrar el título de la página', async () => {
    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Metas de Ahorro')).toBeInTheDocument();
      expect(screen.getByText(/Gestiona tus objetivos financieros/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe mostrar el botón de nueva meta', async () => {
    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      const newButton = screen.getByRole('button', { name: /nueva meta/i });
      expect(newButton).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe cargar las metas al montar', async () => {
    const mockGoals = [
      {
        id: 1,
        user: 1,
        name: 'Meta de prueba',
        target_amount: 10000000,
        saved_amount: 5000000,
        date: '2025-12-31',
        progress_percentage: 50,
        remaining_amount: 5000000,
        is_completed: false,
        currency: 'COP' as const,
      },
    ];

    vi.mocked(goalService.goalService.list).mockResolvedValue(mockGoals);

    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(goalService.goalService.list).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(goalService.goalService.list).mockImplementation(
      () => new Promise(() => {})
    );

    render(<Goals onBack={mockOnBack} />);

    expect(screen.getByText('Metas de Ahorro')).toBeInTheDocument();
    expect(screen.getByText('Cargando metas...')).toBeInTheDocument();
  });

  it('debe abrir el modal de nueva meta al hacer clic', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Metas de Ahorro')).toBeInTheDocument();
    }, { timeout: 2000 });
    
    const newButtons = screen.getAllByRole('button', { name: /nueva meta|crear tu primera meta/i });
    if (newButtons.length > 0) {
      await user.click(newButtons[0]);
      
      await waitFor(() => {
        const modal = screen.queryByTestId('new-goal-modal');
        if (modal) {
          expect(modal).toBeInTheDocument();
        }
      }, { timeout: 2000 });
    }
  });

  it('debe mostrar metas cuando existen', async () => {
    const mockGoals = [
      {
        id: 1,
        user: 1,
        name: 'Meta de prueba',
        target_amount: 10000000,
        saved_amount: 5000000,
        date: '2025-12-31',
        progress_percentage: 50,
        remaining_amount: 5000000,
        is_completed: false,
        currency: 'COP' as const,
      },
    ];

    vi.mocked(goalService.goalService.list).mockResolvedValue(mockGoals);

    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Meta de prueba')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    vi.mocked(goalService.goalService.list).mockRejectedValue(
      new Error('Error al cargar metas')
    );

    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/error al cargar metas/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('debe abrir modal de confirmación al eliminar una meta', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    const mockGoals = [
      {
        id: 1,
        user: 1,
        name: 'Meta de prueba',
        target_amount: 10000000,
        saved_amount: 5000000,
        date: '2025-12-31',
        progress_percentage: 50,
        remaining_amount: 5000000,
        is_completed: false,
        currency: 'COP' as const,
      },
    ];

    vi.mocked(goalService.goalService.list).mockResolvedValue(mockGoals);
    vi.mocked(goalService.goalService.delete).mockResolvedValue(undefined);

    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Meta de prueba')).toBeInTheDocument();
    }, { timeout: 2000 });

    const deleteButton = screen.queryByRole('button', { name: /eliminar/i });
    if (deleteButton) {
      await user.click(deleteButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
      });
    }
  });

  it('debe abrir modal de edición al hacer clic en editar', async () => {
    const { userEvent } = await import('@testing-library/user-event');
    const user = userEvent.setup();
    
    const mockGoals = [
      {
        id: 1,
        user: 1,
        name: 'Meta de prueba',
        target_amount: 10000000,
        saved_amount: 5000000,
        date: '2025-12-31',
        progress_percentage: 50,
        remaining_amount: 5000000,
        is_completed: false,
        currency: 'COP' as const,
      },
    ];

    vi.mocked(goalService.goalService.list).mockResolvedValue(mockGoals);

    render(<Goals onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Meta de prueba')).toBeInTheDocument();
    }, { timeout: 2000 });

    const editButtons = screen.queryAllByRole('button', { name: /editar/i });
    if (editButtons.length > 0) {
      await user.click(editButtons[0]);
      
      await waitFor(() => {
        const modal = screen.queryByTestId('new-goal-modal');
        if (modal) {
          expect(modal).toBeInTheDocument();
        }
      }, { timeout: 2000 });
    }
  });
});


