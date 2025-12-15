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
});
