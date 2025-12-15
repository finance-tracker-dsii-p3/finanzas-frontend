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
      () => new Promise(() => {}) // Nunca resuelve
    );

    render(<Goals onBack={mockOnBack} />);
    
    // El componente renderiza pero puede estar en estado de carga
    expect(screen.getByText('Metas de Ahorro')).toBeInTheDocument();
    expect(screen.getByText('Cargando metas...')).toBeInTheDocument();
  });
});
