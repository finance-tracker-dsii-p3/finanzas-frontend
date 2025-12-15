import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { CategoryProvider, useCategories } from './CategoryContext';
import { useAuth } from './AuthContext';
import * as categoryServiceModule from '../services/categoryService';

vi.mock('../services/categoryService', () => ({
  categoryService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleActive: vi.fn(),
    delete: vi.fn(),
    deleteWithReassignment: vi.fn(),
    validateDeletion: vi.fn(),
    bulkUpdateOrder: vi.fn(),
    createDefaults: vi.fn(),
  },
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('CategoryContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, username: 'test', email: 'test@example.com', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });
  });

  it('debe proporcionar el contexto de categorías', async () => {
    vi.mocked(categoryServiceModule.categoryService.list).mockResolvedValue([]);

    const { result } = renderHook(() => useCategories(), {
      wrapper: ({ children }) => <CategoryProvider>{children}</CategoryProvider>,
    });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current.categories).toEqual([]);
  });

  it('debe cargar categorías cuando el usuario está autenticado', async () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Alimentación',
        type: 'expense' as const,
        type_display: 'Gasto',
        color: '#FF5733',
        icon: '🍔',
        icon_display: '🍔',
        is_active: true,
        order: 1,
      },
    ];

    vi.mocked(categoryServiceModule.categoryService.list).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: ({ children }) => <CategoryProvider>{children}</CategoryProvider>,
    });

    await waitFor(() => {
      expect(result.current.categories.length).toBeGreaterThan(0);
    });
  });

  it('debe crear una categoría', async () => {
    vi.mocked(categoryServiceModule.categoryService.list).mockResolvedValue([]);

    const newCategory = {
      id: 1,
      name: 'Nueva Categoría',
      type: 'expense' as const,
      type_display: 'Gasto',
      color: '#FF5733',
      icon: '🍔',
      icon_display: '🍔',
      is_active: true,
      order: 1,
    };

    vi.mocked(categoryServiceModule.categoryService.create).mockResolvedValue(newCategory);

    const { result } = renderHook(() => useCategories(), {
      wrapper: ({ children }) => <CategoryProvider>{children}</CategoryProvider>,
    });

    await waitFor(() => {
      expect(result.current.categories).toBeDefined();
    });

    let created;
    await act(async () => {
      created = await result.current.createCategory({
        name: 'Nueva Categoría',
        type: 'expense',
        color: '#FF5733',
        icon: '🍔',
      });
    });

    expect(created).toEqual(newCategory);
    expect(categoryServiceModule.categoryService.create).toHaveBeenCalled();
  });

  it('debe filtrar categorías por tipo', async () => {
    const mockCategories = [
      {
        id: 1,
        name: 'Alimentación',
        type: 'expense' as const,
        type_display: 'Gasto',
        color: '#FF5733',
        icon: '🍔',
        icon_display: '🍔',
        is_active: true,
        order: 1,
      },
      {
        id: 2,
        name: 'Salario',
        type: 'income' as const,
        type_display: 'Ingreso',
        color: '#10b981',
        icon: '💰',
        icon_display: '💰',
        is_active: true,
        order: 1,
      },
    ];

    vi.mocked(categoryServiceModule.categoryService.list).mockResolvedValue(mockCategories);

    const { result } = renderHook(() => useCategories(), {
      wrapper: ({ children }) => <CategoryProvider>{children}</CategoryProvider>,
    });

    await waitFor(() => {
      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    const expenseCategories = result.current.getCategoriesByType('expense');
    expect(expenseCategories.length).toBe(1);
    expect(expenseCategories[0].type).toBe('expense');
  });

  it('no debe cargar categorías cuando el usuario no está autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });

    const { result } = renderHook(() => useCategories(), {
      wrapper: ({ children }) => <CategoryProvider>{children}</CategoryProvider>,
    });

    expect(result.current.categories).toEqual([]);
    expect(categoryServiceModule.categoryService.list).not.toHaveBeenCalled();
  });
});
