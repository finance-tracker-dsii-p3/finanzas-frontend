import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { BudgetProvider, useBudgets } from './BudgetContext';
import { useAuth } from './AuthContext';
import * as budgetServiceModule from '../services/budgetService';
import type { BudgetDetail } from '../services/budgetService';

vi.mock('../services/budgetService', () => ({
  budgetService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleActive: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
    getMonthlySummary: vi.fn(),
    getCategoriesWithoutBudget: vi.fn(),
    getByCategory: vi.fn(),
  },
}));

vi.mock('./AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('BudgetContext', () => {
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

  it('debe proporcionar el contexto de presupuestos', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
    expect(result.current).toBeDefined();
    });

    expect(result.current.budgets).toEqual([]);
  });

  it('debe cargar presupuestos cuando el usuario está autenticado', async () => {
    const mockBudgets = [
      {
        id: 1,
        category: 1,
        category_name: 'Alimentación',
        category_type: 'expense',
        category_type_display: 'Gasto',
        category_color: '#FF5733',
        category_icon: '🍔',
        amount: '500000',
        currency: 'COP',
        calculation_mode: 'total' as const,
        calculation_mode_display: 'Total',
        period: 'monthly' as const,
        period_display: 'Mensual',
        start_date: '2025-01-01',
        is_active: true,
        alert_threshold: '80',
        spent_amount: '300000',
        spent_percentage: '60.0',
        remaining_amount: '200000',
        status: 'good' as const,
        status_text: 'Bueno',
        is_over_budget: false,
        is_alert_triggered: false,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 1,
      results: mockBudgets,
    });

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets.length).toBeGreaterThan(0);
    });
  });

  it('debe crear un presupuesto', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const newBudget: BudgetDetail = {
      id: 1,
      category: 1,
      category_name: 'Alimentación',
      category_type: 'expense',
      category_type_display: 'Gasto',
      category_color: '#FF5733',
      category_icon: '🍔',
      amount: '500000',
      currency: 'COP',
      calculation_mode: 'total',
      calculation_mode_display: 'Total',
      period: 'monthly',
      period_display: 'Mensual',
      start_date: '2025-01-01',
      is_active: true,
      alert_threshold: '80',
      spent_amount: '0',
      spent_percentage: '0.0',
      remaining_amount: '500000',
      status: 'good',
      status_text: 'Normal',
      is_over_budget: false,
      is_alert_triggered: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      daily_average: '16129.03',
    };

    vi.mocked(budgetServiceModule.budgetService.create).mockResolvedValue(newBudget);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    let created;
    await act(async () => {
      created = await result.current.createBudget({
      category: 1,
      amount: '500000',
      period: 'monthly',
      currency: 'COP',
      });
    });

    expect(created).toEqual(newBudget);
    expect(budgetServiceModule.budgetService.create).toHaveBeenCalled();
  });

  it('debe actualizar un presupuesto', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const updatedBudget: BudgetDetail = {
      id: 1,
      category: 1,
      category_name: 'Alimentación',
      category_type: 'expense',
      category_type_display: 'Gasto',
      category_color: '#FF5733',
      category_icon: '🍔',
      amount: '600000',
      currency: 'COP',
      calculation_mode: 'total',
      calculation_mode_display: 'Total',
      period: 'monthly',
      period_display: 'Mensual',
      start_date: '2025-01-01',
      is_active: true,
      alert_threshold: '80',
      spent_amount: '0',
      spent_percentage: '0.0',
      remaining_amount: '600000',
      status: 'good',
      status_text: 'Normal',
      is_over_budget: false,
      is_alert_triggered: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      daily_average: '19354.84',
    };

    vi.mocked(budgetServiceModule.budgetService.update).mockResolvedValue(updatedBudget);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    let updated;
    await act(async () => {
      updated = await result.current.updateBudget(1, {
      amount: '600000',
      });
    });

    expect(updated).toEqual(updatedBudget);
    expect(budgetServiceModule.budgetService.update).toHaveBeenCalledWith(1, {
      amount: '600000',
    });
  });

  it('debe obtener el detalle de un presupuesto', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const budgetDetail: BudgetDetail = {
      id: 1,
      category: 1,
      category_name: 'Alimentación',
      category_type: 'expense',
      category_type_display: 'Gasto',
      category_color: '#FF5733',
      category_icon: '🍔',
      amount: '500000',
      currency: 'COP',
      calculation_mode: 'total',
      calculation_mode_display: 'Total',
      period: 'monthly',
      period_display: 'Mensual',
      start_date: '2025-01-01',
      is_active: true,
      alert_threshold: '80',
      spent_amount: '300000',
      spent_percentage: '60.0',
      remaining_amount: '200000',
      daily_average: '9677.42',
      status: 'good',
      status_text: 'Bueno',
      is_over_budget: false,
      is_alert_triggered: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    vi.mocked(budgetServiceModule.budgetService.get).mockResolvedValue(budgetDetail);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    let detail;
    await act(async () => {
      detail = await result.current.getBudgetDetail(1);
    });

    expect(detail).toEqual(budgetDetail);
    expect(budgetServiceModule.budgetService.get).toHaveBeenCalledWith(1);
  });

  it('no debe cargar presupuestos cuando el usuario no está autenticado', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    });

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    expect(result.current.budgets).toEqual([]);
    expect(budgetServiceModule.budgetService.list).not.toHaveBeenCalled();
  });

  it('debe eliminar un presupuesto', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    vi.mocked(budgetServiceModule.budgetService.delete).mockResolvedValue({
      message: 'Presupuesto eliminado correctamente',
      deleted_budget: {
        id: 1,
        category_name: 'Comida',
        amount: '500000',
      },
    } as budgetServiceModule.BudgetDeleteResponse);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    await act(async () => {
      await result.current.deleteBudget(1);
    });

    expect(budgetServiceModule.budgetService.delete).toHaveBeenCalledWith(1);
  });

  it('debe alternar el estado activo de un presupuesto', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const toggledBudget: BudgetDetail = {
      id: 1,
      category: 1,
      category_name: 'Alimentación',
      category_type: 'expense',
      category_type_display: 'Gasto',
      category_color: '#FF5733',
      category_icon: '🍔',
      amount: '500000',
      currency: 'COP',
      calculation_mode: 'total',
      calculation_mode_display: 'Total',
      period: 'monthly',
      period_display: 'Mensual',
      start_date: '2025-01-01',
      is_active: false,
      alert_threshold: '80',
      spent_amount: '0',
      spent_percentage: '0.0',
      remaining_amount: '500000',
      status: 'good',
      status_text: 'Normal',
      is_over_budget: false,
      is_alert_triggered: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      daily_average: '16129.03',
    };

    vi.mocked(budgetServiceModule.budgetService.toggleActive).mockResolvedValue({
      budget: toggledBudget,
      message: 'Presupuesto actualizado',
    } as budgetServiceModule.BudgetToggleResponse);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    await act(async () => {
      const toggled = await result.current.toggleBudget(1);
      expect(toggled).toEqual(toggledBudget);
    });

    expect(budgetServiceModule.budgetService.toggleActive).toHaveBeenCalledWith(1);
  });

  it('debe obtener el resumen mensual', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const mockSummary = {
      period: { month: 1, year: 2025 },
      count: 5,
      budgets: [],
    };

    vi.mocked(budgetServiceModule.budgetService.getMonthlySummary).mockResolvedValue(mockSummary);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    let summary;
    await act(async () => {
      summary = await result.current.getMonthlySummary();
    });

    expect(summary).toEqual(mockSummary);
    expect(budgetServiceModule.budgetService.getMonthlySummary).toHaveBeenCalled();
  });

  it('debe manejar errores al cargar presupuestos', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockRejectedValue(
      new Error('Error al cargar presupuestos')
    );

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    expect(result.current.error).toContain('Error al cargar presupuestos');
  });

  it('debe obtener categorías sin presupuesto', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const mockResponse = {
      period: 'monthly' as const,
      count: 1,
      categories: [
        {
          id: 1,
          name: 'Categoría sin presupuesto',
          type: 'expense' as const,
          color: '#FF5733',
          icon: '🍔',
        },
      ],
      message: 'Categorías sin presupuesto encontradas',
    };

    vi.mocked(budgetServiceModule.budgetService.getCategoriesWithoutBudget).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    let response;
    await act(async () => {
      response = await result.current.getCategoriesWithoutBudget('monthly');
    });

    expect(response).toEqual(mockResponse);
    expect(budgetServiceModule.budgetService.getCategoriesWithoutBudget).toHaveBeenCalledWith('monthly');
  });

  it('debe obtener presupuesto por categoría', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const mockResponse = {
      category: {
        id: 1,
        name: 'Alimentación',
        type: 'expense',
      },
      count: 1,
      budgets: [
        {
          id: 1,
          category: 1,
          category_name: 'Alimentación',
          category_type: 'expense',
          category_type_display: 'Gasto',
          category_color: '#FF5733',
          category_icon: '🍔',
          amount: '500000',
          currency: 'COP',
          calculation_mode: 'total' as const,
          calculation_mode_display: 'Total',
          period: 'monthly' as const,
          period_display: 'Mensual',
          start_date: '2025-01-01',
          is_active: true,
          alert_threshold: '80',
          spent_amount: '300000',
          spent_percentage: '60.0',
          remaining_amount: '200000',
          status: 'good' as const,
          status_text: 'Bueno',
          is_over_budget: false,
          is_alert_triggered: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    };

    vi.mocked(budgetServiceModule.budgetService.getByCategory).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    let response;
    await act(async () => {
      response = await result.current.getBudgetByCategory(1, true);
    });

    expect(response).toEqual(mockResponse);
    expect(budgetServiceModule.budgetService.getByCategory).toHaveBeenCalledWith(1, true);
  });

  it('debe refrescar presupuestos con filtros', async () => {
    vi.mocked(budgetServiceModule.budgetService.list).mockResolvedValue({
      count: 0,
      results: [],
    });

    const { result } = renderHook(() => useBudgets(), {
      wrapper: ({ children }) => <BudgetProvider>{children}</BudgetProvider>,
    });

    await waitFor(() => {
      expect(result.current.budgets).toBeDefined();
    });

    await act(async () => {
      await result.current.refreshBudgets({ active_only: false, period: 'yearly' });
    });

    expect(budgetServiceModule.budgetService.list).toHaveBeenCalledWith({ active_only: false, period: 'yearly' });
  });
});


