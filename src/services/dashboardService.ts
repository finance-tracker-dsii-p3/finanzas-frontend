import { parseApiError } from '../utils/apiErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface FinancialSummary {
  total_income: number;          // Centavos
  total_expenses: number;        // Centavos
  total_savings: number;         // Centavos
  total_iva: number;             // Centavos
  total_gmf: number;             // Centavos
  net_balance: number;           // Centavos
  currency: string;
}

export interface DashboardFilters {
  year: number | null;
  month: number | null;           // 1-12
  account_id: number | null;
  period_label: string;           // "Diciembre 2025"
}

export interface RecentTransaction {
  id: number;
  type: string;                   // "Income", "Expense", etc.
  type_code: number;              // 1, 2, 3, 4
  date: string;                   // ISO format
  description: string;
  amount: number;                 // Centavos
  amount_formatted: string;       // "$3.504"
  currency: string;
  account: string;
  category: string | null;
  category_color: string | null;
  category_icon: string | null;
}

export interface UpcomingBill {
  id: number;
  provider: string;
  amount: number;                 // Centavos
  amount_formatted: string;
  due_date: string;               // ISO format
  days_until_due: number;         // Negativo si está vencida
  status: 'pending' | 'paid' | 'overdue';
  urgency: 'overdue' | 'today' | 'urgent' | 'soon' | 'normal';
  urgency_label: string;
  urgency_color: string;          // Color hex
  suggested_account: string | null;
  suggested_account_id: number | null;
  category: string | null;
  category_color: string | null;
  category_icon: string | null;
  description: string;
  is_recurring: boolean;
}

export interface CategoryDistribution {
  id: number;
  name: string;
  amount: number;                 // Centavos
  count: number;
  percentage: number;
  color: string;
  icon: string;
  formatted: string;
}

export interface ExpenseDistribution {
  categories: CategoryDistribution[];
  total: number;                  // Centavos
  total_formatted?: string;
  has_data: boolean;
}

export interface DailyFlow {
  dates: string[];                // ["2025-12-01", ...]
  income: number[];               // Centavos por fecha
  expenses: number[];             // Centavos por fecha
  total_income: number;
  total_expenses: number;
  has_data: boolean;
}

export interface Charts {
  expense_distribution: ExpenseDistribution;
  daily_flow: DailyFlow;
}

export interface AccountsInfo {
  total_accounts: number;
  has_accounts: boolean;
}

export interface EmptyState {
  message: string;
  suggestion: string;
  action: 'create_account' | 'create_transaction';
}

export interface FinancialDashboardData {
  has_data: boolean;
  summary: FinancialSummary;
  filters: DashboardFilters;
  recent_transactions: RecentTransaction[];
  upcoming_bills: UpcomingBill[];
  charts: Charts;
  accounts_info: AccountsInfo;
  empty_state?: EmptyState;
}

export interface DashboardResponse {
  success: boolean;
  data: FinancialDashboardData;
  message: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
};


export const dashboardService = {
  async getFinancialDashboard(params?: {
    year?: number;
    month?: number;
    account_id?: number;
    all?: boolean;
  }): Promise<FinancialDashboardData> {
    const queryParams = new URLSearchParams();
    
    if (params?.year) queryParams.append('year', params.year.toString());
    if (params?.month) queryParams.append('month', params.month.toString());
    if (params?.account_id) queryParams.append('account_id', params.account_id.toString());
    if (params?.all) queryParams.append('all', 'true');

    const url = `${API_BASE_URL}/api/dashboard/financial/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Error al obtener el dashboard');
    }

    const result: DashboardResponse = await response.json();
    return result.data;
  },
};
