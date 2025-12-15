import { parseApiError, handleNetworkError } from '../utils/apiErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

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
  currency: string;
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
  currency: string;
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
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async get(id: number): Promise<BudgetDetail> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async delete(id: number): Promise<BudgetDeleteResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async toggleActive(id: number): Promise<BudgetToggleResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/${id}/toggle_active/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getMonthlySummary(): Promise<MonthlySummaryResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/monthly_summary/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getAlerts(): Promise<BudgetAlertsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/budgets/alerts/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de presupuestos');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },
};

