import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  budgetService,
  BudgetDetail,
  BudgetListItem,
  BudgetPayload,
  BudgetUpdatePayload,
  Period,
  MonthlySummaryResponse,
  CategoriesWithoutBudgetResponse,
  BudgetByCategoryResponse,
} from '../services/budgetService';
import { useAuth } from './AuthContext';

interface BudgetContextValue {
  budgets: BudgetListItem[];
  isLoading: boolean;
  error: string | null;
  refreshBudgets: (filters?: { active_only?: boolean; period?: Period }) => Promise<void>;
  createBudget: (payload: BudgetPayload) => Promise<BudgetDetail>;
  updateBudget: (id: number, payload: BudgetUpdatePayload) => Promise<BudgetDetail>;
  toggleBudget: (id: number) => Promise<BudgetDetail>;
  deleteBudget: (id: number) => Promise<void>;
  getBudgetDetail: (id: number) => Promise<BudgetDetail>;
  getMonthlySummary: () => Promise<MonthlySummaryResponse>;
  getCategoriesWithoutBudget: (period?: Period) => Promise<CategoriesWithoutBudgetResponse>;
  getBudgetByCategory: (categoryId: number, activeOnly?: boolean) => Promise<BudgetByCategoryResponse>;
}

const BudgetContext = createContext<BudgetContextValue | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [budgets, setBudgets] = useState<BudgetListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgets = useCallback(
    async (filters?: { active_only?: boolean; period?: Period }) => {
      if (!isAuthenticated) {
        setBudgets([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await budgetService.list(filters);
        console.log('📊 Presupuestos cargados desde el backend:', response.results);
        console.log('📊 Primer presupuesto - Gastado:', response.results[0]?.spent_amount);
        // Crear una nueva referencia del array para forzar el re-render
        setBudgets([...response.results]);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar los presupuestos';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadBudgets({ active_only: true, period: 'monthly' });
    } else {
      setBudgets([]);
    }
  }, [isAuthenticated, loadBudgets]);

  // Escuchar eventos de actualización de transacciones para refrescar presupuestos
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleTransactionUpdate = () => {
      // Pequeño delay para dar tiempo al backend
      setTimeout(() => {
        loadBudgets({ active_only: true, period: 'monthly' });
      }, 500);
    };

    window.addEventListener('transactionCreated', handleTransactionUpdate);
    window.addEventListener('transactionUpdated', handleTransactionUpdate);
    window.addEventListener('transactionDeleted', handleTransactionUpdate);

    return () => {
      window.removeEventListener('transactionCreated', handleTransactionUpdate);
      window.removeEventListener('transactionUpdated', handleTransactionUpdate);
      window.removeEventListener('transactionDeleted', handleTransactionUpdate);
    };
  }, [isAuthenticated, loadBudgets]);

  const refreshBudgets = useCallback(
    async (filters?: { active_only?: boolean; period?: Period }) => {
      await loadBudgets(filters);
    },
    [loadBudgets],
  );

  const createBudget = useCallback(async (payload: BudgetPayload): Promise<BudgetDetail> => {
    setError(null);
    try {
      const newBudget = await budgetService.create(payload);
      await loadBudgets({ active_only: true, period: 'monthly' });
      return newBudget;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo crear el presupuesto';
      setError(message);
      throw err;
    }
  }, [loadBudgets]);

  const updateBudget = useCallback(
    async (id: number, payload: BudgetUpdatePayload): Promise<BudgetDetail> => {
      setError(null);
      try {
        const updatedBudget = await budgetService.update(id, payload);
        await loadBudgets({ active_only: true, period: 'monthly' });
        return updatedBudget;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo actualizar el presupuesto';
        setError(message);
        throw err;
      }
    },
    [loadBudgets],
  );

  const toggleBudget = useCallback(
    async (id: number): Promise<BudgetDetail> => {
      setError(null);
      try {
        const response = await budgetService.toggleActive(id);
        await loadBudgets({ active_only: true, period: 'monthly' });
        return response.budget;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo cambiar el estado del presupuesto';
        setError(message);
        throw err;
      }
    },
    [loadBudgets],
  );

  const deleteBudget = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await budgetService.delete(id);
        await loadBudgets({ active_only: true, period: 'monthly' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo eliminar el presupuesto';
        setError(message);
        throw err;
      }
    },
    [loadBudgets],
  );

  const getBudgetDetail = useCallback(async (id: number): Promise<BudgetDetail> => {
    setError(null);
    try {
      return await budgetService.get(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener el detalle del presupuesto';
      setError(message);
      throw err;
    }
  }, []);

  const getMonthlySummary = useCallback(async (): Promise<MonthlySummaryResponse> => {
    setError(null);
    try {
      return await budgetService.getMonthlySummary();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener el resumen mensual';
      setError(message);
      throw err;
    }
  }, []);

  const getCategoriesWithoutBudget = useCallback(
    async (period?: Period): Promise<CategoriesWithoutBudgetResponse> => {
      setError(null);
      try {
        return await budgetService.getCategoriesWithoutBudget(period);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron obtener las categorías disponibles';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const getBudgetByCategory = useCallback(
    async (categoryId: number, activeOnly?: boolean): Promise<BudgetByCategoryResponse> => {
      setError(null);
      try {
        return await budgetService.getByCategory(categoryId, activeOnly);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo obtener el presupuesto de la categoría';
        setError(message);
        throw err;
      }
    },
    [],
  );

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        isLoading,
        error,
        refreshBudgets,
        createBudget,
        updateBudget,
        toggleBudget,
        deleteBudget,
        getBudgetDetail,
        getMonthlySummary,
        getCategoriesWithoutBudget,
        getBudgetByCategory,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudgets debe ser usado dentro de un BudgetProvider');
  }
  return context;
};

