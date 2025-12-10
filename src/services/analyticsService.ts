import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface DashboardParams {
  period?: string;
  mode?: 'base' | 'total';
  others_threshold?: number;
}

export interface IndicatorData {
  amount: number;
  count: number;
  formatted: string;
}

export interface BalanceData {
  amount: number;
  formatted: string;
  is_positive: boolean;
}

export interface PeriodData {
  start: string;
  end: string;
  days: number;
}

export interface IndicatorsResponse {
  income: IndicatorData;
  expenses: IndicatorData;
  balance: BalanceData;
  period: PeriodData;
  mode: string;
  currency: string;
}

export interface ChartCategoryData {
  category_id: string;
  name: string;
  amount: number;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  formatted_amount: string;
  is_aggregated?: boolean;
}

export interface ExpensesChartResponse {
  chart_data: ChartCategoryData[];
  others_data: ChartCategoryData[];
  total_expenses: number;
  uncategorized_amount: number;
  mode: string;
  period_summary: string;
  categories_count: number;
  currency?: string;
}

export interface SeriesData {
  name: string;
  data: number[];
  color: string;
  total: number;
}

export interface BalanceSeriesData {
  name: string;
  data: number[];
  color: string;
  final: number;
}

export interface DailyFlowChartResponse {
  dates: string[];
  series: {
    income: SeriesData;
    expenses: SeriesData;
    balance: BalanceSeriesData;
  };
  summary: {
    period_days: number;
    total_income: number;
    total_expenses: number;
    final_balance: number;
    avg_daily_income: number;
    avg_daily_expense: number;
  };
  mode: string;
  period: {
    start: string;
    end: string;
  };
  currency?: string;
}

export interface DashboardResponse {
  success: boolean;
  data: {
    indicators: IndicatorsResponse;
    expenses_chart: ExpensesChartResponse;
    daily_flow_chart: DailyFlowChartResponse;
    metadata: {
      generated_at: string;
      user_id: number;
      period_requested: string;
      mode_used: string;
      others_threshold: number;
    };
  };
  message?: string;
  error?: string;
  code?: string;
}

export interface CategoryTransaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  formatted_amount: string;
  account: string;
  tag?: string;
  category?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  };
}

export interface CategoryTransactionsResponse {
  success: boolean;
  data: {
    transactions: CategoryTransaction[];
    total_count: number;
    showing_count: number;
    category_name: string;
    total_amount: number;
    formatted_total: string;
    period: {
      start: string;
      end: string;
    };
    mode: string;
    has_more: boolean;
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
};

const buildQueryParams = (params: Record<string, string | number | undefined>): string => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      queryParams.append(key, String(value));
    }
  });
  return queryParams.toString() ? `?${queryParams.toString()}` : '';
};

const parseError = async (response: Response) => {
  if (response.status >= 500) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.detail || error.message || error.error || 'Error interno del servidor';
    throw new Error(`Error del servidor (${response.status}): ${errorMessage}. Por favor, intenta nuevamente más tarde o contacta al administrador.`);
  }

  if (checkAndHandleAuthError(response)) {
    throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    throw new Error('No tienes permiso para realizar esta acción.');
  }

  if (response.status === 404) {
    throw new Error('Recurso no encontrado.');
  }

  const fallback = { message: 'Error en la operación de analytics' };
  let error;
  try {
    error = await response.json();
  } catch {
    error = fallback;
  }

  const errorMessages: string[] = [];

  if (error.message && error.message !== 'Error en la petición' && !errorMessages.includes(error.message)) {
    errorMessages.push(error.message);
  }
  if (error.detail && !errorMessages.includes(error.detail)) {
    errorMessages.push(error.detail);
  }
  if (error.error && !errorMessages.includes(error.error)) {
    errorMessages.push(error.error);
  }

  if (errorMessages.length === 0) {
    errorMessages.push('Error en la operación. Por favor, intenta nuevamente.');
  }

  throw new Error(errorMessages.join('. '));
};

export const analyticsService = {
  async getDashboard(params: DashboardParams = {}): Promise<DashboardResponse> {
    try {
      const queryParams = buildQueryParams({
        period: params.period,
        mode: params.mode,
        others_threshold: params.others_threshold,
      });

      const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard/${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener dashboard de analytics');
    }
  },

  async getIndicators(period?: string, mode: 'base' | 'total' = 'total'): Promise<{ success: boolean; data: IndicatorsResponse }> {
    try {
      const queryParams = buildQueryParams({
        period,
        mode,
      });

      const response = await fetch(`${API_BASE_URL}/api/analytics/indicators/${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener indicadores');
    }
  },

  async getExpensesChart(period?: string, mode: 'base' | 'total' = 'total', othersThreshold = 0.05): Promise<{ success: boolean; data: ExpensesChartResponse }> {
    try {
      const queryParams = buildQueryParams({
        period,
        mode,
        others_threshold: othersThreshold,
      });

      const response = await fetch(`${API_BASE_URL}/api/analytics/expenses-chart/${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener gráfico de gastos');
    }
  },

  async getDailyFlowChart(period?: string, mode: 'base' | 'total' = 'total'): Promise<{ success: boolean; data: DailyFlowChartResponse }> {
    try {
      const queryParams = buildQueryParams({
        period,
        mode,
      });

      const response = await fetch(`${API_BASE_URL}/api/analytics/daily-flow-chart/${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener gráfico de flujo diario');
    }
  },

  async getCategoryTransactions(
    categoryId: string | number,
    period?: string,
    mode: 'base' | 'total' = 'total',
    limit = 50
  ): Promise<CategoryTransactionsResponse> {
    try {
      const queryParams = buildQueryParams({
        period,
        mode,
        limit,
      });

      const response = await fetch(`${API_BASE_URL}/api/analytics/category/${categoryId}/transactions/${queryParams ? `?${queryParams}` : ''}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener transacciones de categoría');
    }
  },

  async getAvailablePeriods(): Promise<{ success: boolean; data: { available_periods: Array<{ key: string; name: string; description: string }>; data_range: { min_date: string; max_date: string } } }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/periods/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener períodos disponibles');
    }
  },

  async comparePeriods(
    period1: string,
    period2: string,
    mode: 'base' | 'total' = 'total'
  ): Promise<{
    success: boolean;
    data?: {
      comparison_summary: {
        period1: {
          name: string;
          date_range: string;
          has_data: boolean;
          transactions_count: number;
        };
        period2: {
          name: string;
          date_range: string;
          has_data: boolean;
          transactions_count: number;
        };
        can_compare: boolean;
        mode: string;
      };
      period_data: {
        period1: IndicatorsResponse;
        period2: IndicatorsResponse;
      };
      differences: {
        income: {
          absolute: number;
          percentage: number;
          is_increase: boolean;
          is_significant: boolean;
          period1_amount: number;
          period2_amount: number;
          formatted_absolute: string;
          summary: string;
        };
        expenses: {
          absolute: number;
          percentage: number;
          is_increase: boolean;
          is_significant: boolean;
          period1_amount: number;
          period2_amount: number;
          formatted_absolute: string;
          summary: string;
        };
        balance: {
          absolute: number;
          percentage: number;
          is_increase: boolean;
          is_significant: boolean;
          period1_amount: number;
          period2_amount: number;
          formatted_absolute: string;
          summary: string;
        };
      };
      insights: {
        messages: string[];
        alert_level: 'info' | 'warning' | 'success' | 'error';
        has_significant_changes: boolean;
      };
      metadata: {
        generated_at: string;
        comparison_mode: string;
        currency: string;
      };
    };
    error?: string;
    code?: string;
    details?: Record<string, unknown>;
    message?: string;
    executive_summary?: string[];
  }> {
    try {
      const params = new URLSearchParams();
      params.append('period1', period1);
      params.append('period2', period2);
      params.append('mode', mode);

      const response = await fetch(`${API_BASE_URL}/api/analytics/compare-periods/?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al comparar períodos');
    }
  },
};

