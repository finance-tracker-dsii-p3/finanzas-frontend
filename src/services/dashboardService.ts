import { parseApiError } from '../utils/apiErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

export interface FinancialSummary {
  total_income: number;
  total_expenses: number;
  total_savings: number;
  total_iva: number;
  total_gmf: number;
  net_balance: number;
  currency: string;
}

export interface DashboardFilters {
  year: number | null;
  month: number | null;
  account_id: number | null;
  period_label: string;
}

export interface RecentTransaction {
  id: number;
  type: string;
  type_code: number;
  date: string;
  description: string;
  amount: number;
  amount_formatted: string;
  currency: string;
  account: string;
  category: string | null;
  category_color: string | null;
  category_icon: string | null;
}

export interface UpcomingBill {
  id: number;
  provider: string;
  amount: number;
  amount_formatted: string;
  due_date: string;
  days_until_due: number;
  status: 'pending' | 'paid' | 'overdue';
  urgency: 'overdue' | 'today' | 'urgent' | 'soon' | 'normal';
  urgency_label: string;
  urgency_color: string;
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
  amount: number;
  count: number;
  percentage: number;
  color: string;
  icon: string;
  formatted: string;
}

export interface ExpenseDistribution {
  categories: CategoryDistribution[];
  total: number;
  total_formatted?: string;
  has_data: boolean;
}

export interface DailyFlow {
  dates: string[];
  income: number[];
  expenses: number[];
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
