import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export type CalculationMode = 'base' | 'total';
export type Period = 'monthly' | 'yearly';
export type BudgetStatus = 'good' | 'warning' | 'exceeded';

export interface BudgetProjection {
  projected_amount: string;
  projected_percentage: string;
  will_exceed: boolean;
  days_remaining: number;
  days_total: number;
  daily_average: string;
}

export interface BudgetPeriodDates {
  start: string;
  end: string;
}

export interface BudgetDetail {
  id: number;
  category: number;
  category_name: string;
  category_type: string;
  category_type_display: string;
  category_color: string;
  category_icon: string;
  amount: string;
  currency: string; // 'COP', 'USD', 'EUR'
  calculation_mode: CalculationMode;
  calculation_mode_display: string;
  period: Period;
  period_display: string;
  start_date: string;
  is_active: boolean;
  alert_threshold: string;
  spent_amount: string;
  spent_percentage: string;
  remaining_amount: string;
  daily_average: string;
  projection?: BudgetProjection;
  status: BudgetStatus;
  status_text: string;
  is_over_budget: boolean;
  is_alert_triggered: boolean;
  period_dates?: BudgetPeriodDates;
  created_at: string;
  updated_at: string;
}

export type BudgetListItem = Omit<BudgetDetail, 'projection' | 'daily_average' | 'period_dates'>;

export interface BudgetListResponse {
  count: number;
  message?: string;
  results: BudgetListItem[];
}

export interface BudgetPayload {
  category: number;
  amount: string;
  currency: string; // 'COP', 'USD', 'EUR' - Requerido
  calculation_mode?: CalculationMode;
  period?: Period;
  start_date?: string;
  is_active?: boolean;
  alert_threshold?: string;
}

export interface BudgetUpdatePayload extends Partial<Pick<BudgetPayload, 'amount' | 'currency' | 'calculation_mode' | 'alert_threshold'>> {
  is_active?: boolean;
}

export interface BudgetDeleteResponse {
  message: string;
  deleted_budget: {
    id: number;
    category_name: string;
    amount: string;
  };
}

export interface BudgetToggleResponse {
  message: string;
  budget: BudgetDetail;
}

export interface MonthlySummaryPeriod {
  month: number;
  year: number;
}

export interface MonthlySummaryBudget {
  budget_id: number;
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  amount: string;
  spent_amount: string;
  spent_percentage: string;
  remaining_amount: string;
  status: BudgetStatus;
  projection: BudgetProjection;
}

export interface MonthlySummaryResponse {
  period: MonthlySummaryPeriod;
  count: number;
  budgets: MonthlySummaryBudget[];
}

export interface CategoryWithoutBudget {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string;
}

export interface CategoriesWithoutBudgetResponse {
  period: Period;
  count: number;
  categories: CategoryWithoutBudget[];
  message: string;
}

export interface BudgetByCategoryResponse {
  category: {
    id: number;
    name: string;
    type: string;
  };
  count: number;
  budgets: BudgetListItem[];
}

export interface BudgetAlert {
  budget_id: number;
  category: string;
  category_color: string;
  amount: string;
  spent_percentage: string;
  status: BudgetStatus;
  message: string;
}

export interface BudgetAlertsResponse {
  count: number;
  alerts: BudgetAlert[];
  message: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
};

const parseError = async (response: Response) => {
  if (response.status >= 500) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.detail || error.message || error.error || 'Error interno del servidor';
    throw new Error(`Error del servidor (${response.status}): ${errorMessage}. Por favor, intenta nuevamente más tarde o contacta al administrador.`);
  }

  if (response.status === 401) {
    checkAndHandleAuthError(response);
    throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    throw new Error('No tienes permisos para realizar esta operación.');
  }

  if (response.status === 404) {
    throw new Error('El presupuesto que buscas no existe o fue eliminado.');
  }

  const fallback = { message: 'Error en la operación de presupuestos' };
  let error;
  try {
    error = await response.json();
  } catch {
    error = fallback;
  }

  const errorMessages: string[] = [];

  if (error.message && !errorMessages.includes(error.message)) {
    errorMessages.push(error.message);
  }
  if (error.detail && !errorMessages.includes(error.detail)) {
    errorMessages.push(error.detail);
  }

  const fields = ['category', 'amount', 'calculation_mode', 'period', 'start_date', 'is_active', 'alert_threshold', 'categories'];

  for (const field of fields) {
    if (error[field]) {
      const fieldError = Array.isArray(error[field]) ? error[field][0] : error[field];
      const fieldLabel = {
        category: 'Categoría',
        amount: 'Monto',
        calculation_mode: 'Modo de cálculo',
        period: 'Período',
        start_date: 'Fecha de inicio',
        is_active: 'Estado activo',
        alert_threshold: 'Umbral de alerta',
        categories: 'Lista de presupuestos',
      }[field] || field;
      errorMessages.push(`${fieldLabel}: ${fieldError}`);
    }
  }

  if (error.non_field_errors) {
    const nonFieldErrors = Array.isArray(error.non_field_errors) ? error.non_field_errors : [error.non_field_errors];
    nonFieldErrors.forEach((err: string) => {
      if (!errorMessages.includes(err)) {
        errorMessages.push(err);
      }
    });
  }

  Object.keys(error).forEach(key => {
    if (!fields.includes(key) && 
        key !== 'message' && 
        key !== 'detail' && 
        key !== 'non_field_errors' &&
        error[key]) {
      const fieldError = Array.isArray(error[key]) ? error[key][0] : error[key];
      if (typeof fieldError === 'string' && !errorMessages.includes(fieldError)) {
        errorMessages.push(`${key}: ${fieldError}`);
      }
    }
  });

  if (errorMessages.length === 0) {
    errorMessages.push('Error en la operación. Verifica que todos los campos obligatorios estén completos.');
  }

  throw new Error(errorMessages.join('. '));
};

const handleFetchError = (error: unknown): never => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Error inesperado al procesar la solicitud.');
};

export const budgetService = {
  async list(filters?: { active_only?: boolean; period?: Period }): Promise<BudgetListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.active_only !== undefined) {
        params.append('active_only', String(filters.active_only));
      }
      if (filters?.period) {
        params.append('period', filters.period);
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_BASE_URL}/api/budgets/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async get(id: number): Promise<BudgetDetail> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async create(payload: BudgetPayload): Promise<BudgetDetail> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async update(id: number, payload: BudgetUpdatePayload): Promise<BudgetDetail> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async delete(id: number): Promise<BudgetDeleteResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async toggleActive(id: number): Promise<BudgetToggleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}/toggle_active/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async getMonthlySummary(): Promise<MonthlySummaryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/monthly_summary/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async getByCategory(categoryId: number, activeOnly?: boolean): Promise<BudgetByCategoryResponse> {
    try {
      const params = new URLSearchParams();
      if (activeOnly !== undefined) {
        params.append('active_only', String(activeOnly));
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_BASE_URL}/api/budgets/by_category/${categoryId}/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async getCategoriesWithoutBudget(period?: Period): Promise<CategoriesWithoutBudgetResponse> {
    try {
      const params = new URLSearchParams();
      if (period) {
        params.append('period', period);
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_BASE_URL}/api/budgets/categories_without_budget/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async getAlerts(): Promise<BudgetAlertsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/alerts/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },
};

