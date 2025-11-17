import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import CategoriesPage from './Categories';
import { Category } from '../../services/categoryService';

const mockOnBack = vi.fn();

const mockCategories: Category[] = [
  {
    id: 1,
    name: 'Comida',
    type: 'expense',
    type_display: 'Gasto',
    color: '#FF5733',
    icon: 'fa-utensils',
    icon_display: 'Utensilios',
    is_active: true,
    order: 1,
    usage_count: 5,
  },
  {
    id: 2,
    name: 'Transporte',
    type: 'expense',
    type_display: 'Gasto',
    color: '#3498db',
    icon: 'fa-car',
    icon_display: 'Auto',
    is_active: true,
    order: 2,
    usage_count: 3,
  },
  {
    id: 3,
    name: 'Salario',
    type: 'income',
    type_display: 'Ingreso',
    color: '#2ecc71',
    icon: 'fa-coins',
    icon_display: 'Monedas',
    is_active: true,
    order: 1,
    usage_count: 1,
  },
];

const mockUseCategories = {
  categories: mockCategories,
  isLoading: false,
  error: null,
  refreshCategories: vi.fn().mockResolvedValue(undefined),
  createCategory: vi.fn().mockResolvedValue(mockCategories[0]),
  updateCategory: vi.fn().mockResolvedValue(mockCategories[0]),
  toggleCategory: vi.fn().mockResolvedValue(mockCategories[0]),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategoryWithReassignment: vi.fn().mockResolvedValue(undefined),
  validateDeletion: vi.fn().mockResolvedValue({
    can_delete: true,
    requires_reassignment: false,
    warnings: [],
    errors: [],
  }),
  bulkUpdateOrder: vi.fn().mockResolvedValue(undefined),
  createDefaultCategories: vi.fn().mockResolvedValue(undefined),
  getCategoriesByType: vi.fn((type) => mockCategories.filter((c) => c.type === type)),
  getActiveCategoriesByType: vi.fn((type) => mockCategories.filter((c) => c.type === type && c.is_active)),
};

const mockUseCategoriesFn = vi.fn(() => mockUseCategories);

vi.mock('../../context/CategoryContext', () => ({
  useCategories: () => mockUseCategoriesFn(),
}));

describe('CategoriesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCategoriesFn.mockReturnValue(mockUseCategories);
  });

  it('debe renderizar el componente de categorías', async () => {
    render(<CategoriesPage onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText(/catálogo de categorías/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de volver al dashboard', () => {
    render(<CategoriesPage onBack={mockOnBack} />);

    const backButton = screen.getByText(/volver al dashboard/i);
    expect(backButton).toBeInTheDocument();
  });

  it('debe llamar onBack cuando se hace clic en el botón de volver', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage onBack={mockOnBack} />);

    const backButton = screen.getByText(/volver al dashboard/i);
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar los contadores de categorías', async () => {
    render(<CategoriesPage onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getAllByText(/gastos/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/ingresos/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/totales/i)).toBeInTheDocument();
    });

    const numbers = screen.getAllByText(/^[123]$/);
    expect(numbers.length).toBeGreaterThanOrEqual(3); // Al menos 3 números (2, 1, 3)
  });

  it('debe mostrar el botón de nueva categoría', () => {
    render(<CategoriesPage onBack={mockOnBack} />);

    const newButton = screen.getByText(/nueva categoría/i);
    expect(newButton).toBeInTheDocument();
  });

  it('debe abrir el modal al hacer clic en nueva categoría', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage onBack={mockOnBack} />);

    const newButtons = screen.getAllByText(/nueva categoría/i);
    const newButton = newButtons.find((btn) => btn.tagName === 'BUTTON');
    if (newButton) {
      await user.click(newButton);
    }

    await waitFor(() => {
      // Verificar que el modal se abrió buscando el input de nombre por placeholder o por texto cercano
      const nameInput = screen.getByPlaceholderText(/ej\. comida, transporte/i);
      expect(nameInput).toBeInTheDocument();
    });
  });

  it('debe mostrar las categorías en la lista', async () => {
    render(<CategoriesPage onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Comida')).toBeInTheDocument();
      expect(screen.getByText('Transporte')).toBeInTheDocument();
      expect(screen.getByText('Salario')).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de crear base', () => {
    render(<CategoriesPage onBack={mockOnBack} />);

    const createBaseButton = screen.getByText(/crear base/i);
    expect(createBaseButton).toBeInTheDocument();
  });

  it('debe mostrar el botón de actualizar', () => {
    render(<CategoriesPage onBack={mockOnBack} />);

    const refreshButton = screen.getByText(/actualizar/i);
    expect(refreshButton).toBeInTheDocument();
  });

  it('debe filtrar categorías por tipo', async () => {
    const user = userEvent.setup();
    render(<CategoriesPage onBack={mockOnBack} />);

    await waitFor(() => {
      expect(screen.getByText('Comida')).toBeInTheDocument();
    });

    const gastosButtons = screen.getAllByText(/gastos/i);
    const gastosFilterButton = gastosButtons.find((btn) => btn.closest('button')?.textContent === 'Gastos');
    if (gastosFilterButton) {
      await user.click(gastosFilterButton.closest('button')!);
    }

    await waitFor(() => {
      expect(screen.getByText('Comida')).toBeInTheDocument();
      expect(screen.getByText('Transporte')).toBeInTheDocument();
    });
  });

  it('debe mostrar estado de carga cuando isLoading es true', () => {
    mockUseCategoriesFn.mockReturnValueOnce({
      ...mockUseCategories,
      isLoading: true,
    });

    render(<CategoriesPage onBack={mockOnBack} />);

    expect(screen.getByText(/cargando categorías/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay categorías', () => {
    mockUseCategoriesFn.mockReturnValueOnce({
      ...mockUseCategories,
      categories: [],
    });

    render(<CategoriesPage onBack={mockOnBack} />);

    expect(screen.getByText(/aún no tienes categorías configuradas/i)).toBeInTheDocument();
  });
});

