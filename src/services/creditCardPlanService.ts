import { parseApiError, handleNetworkError } from '../utils/apiErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

export interface InstallmentPayment {
  id: number;
  installment_number: number;
  due_date: string;
  installment_amount: number;
  principal_amount: number;
  interest_amount: number;
  status: 'pending' | 'completed' | 'overdue';
  payment_date: string | null;
  notes: string;
}

export interface InstallmentPlan {
  id: number;
  credit_card_account: number;
  credit_card_account_name: string;
  purchase_transaction: number;
  description: string;
  purchase_amount: number;
  number_of_installments: number;
  interest_rate: string;
  installment_amount: number;
  total_interest: number;
  total_principal: number;
  total_amount: number;
  start_date: string;
  status: 'active' | 'completed' | 'cancelled';
  financing_category: number;
  financing_category_name: string;
  payments: InstallmentPayment[];
  created_at: string;
  updated_at: string;
}

export interface ScheduleItem {
  installment_number: number;
  due_date: string;
  installment_amount: number;
  principal_amount: number;
  interest_amount: number;
  remaining_principal: number;
}

export interface CreatePlanData {
  credit_card_account_id: number;
  purchase_transaction_id: number;
  financing_category_id: number;
  number_of_installments: number;
  interest_rate: string;
  start_date?: string;
  description?: string;
}

export interface UpdatePlanData {
  number_of_installments?: number;
  interest_rate?: string;
  start_date?: string;
  description?: string;
}

export interface RecordPaymentData {
  installment_number: number;
  payment_date: string;
  source_account_id: number;
  notes?: string;
}

export interface PaymentResponse {
  payment: {
    id: number;
    status: string;
    payment_date: string;
  };
  transactions: {
    transfer_id: number;
    interest_id: number | null;
  };
}

export interface MonthlySummary {
  month: string;
  total_installments: number;
  total_amount: number;
  pending_installments: number;
  paid_installments: number;
}

export interface UpcomingPayment {
  plan_id: number;
  installment_number: number;
  due_date: string;
  installment_amount: number;
  status: 'pending' | 'completed' | 'overdue';
  credit_card: string;
}

export interface PlansListResponse {
  count: number;
  results: InstallmentPlan[];
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

const normalizeResponse = <T>(data: { status: string; data?: T | { results: T[] } | { schedule: T[] } }): T => {
  if (data.status === 'success' && data.data) {
    return data.data as T;
  }
  return data as T;
};


export const creditCardPlanService = {
  async createPlan(data: CreatePlanData): Promise<number> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al crear el plan de cuotas');
      }

      const result = await response.json();
      const normalized = normalizeResponse<{ plan_id: number }>(result);
      return normalized.plan_id;
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async listPlans(): Promise<InstallmentPlan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al listar los planes de cuotas');
      }

      const result = await response.json();
      const normalized = normalizeResponse<PlansListResponse>(result);
      
      if (normalized.results && Array.isArray(normalized.results)) {
        return normalized.results;
      }
      if (Array.isArray(normalized)) {
        return normalized;
      }
      return [];
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getPlan(id: number): Promise<InstallmentPlan> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener el plan de cuotas');
      }

      const result = await response.json();
      return normalizeResponse<InstallmentPlan>(result);
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getSchedule(id: number): Promise<ScheduleItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/${id}/schedule/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener el calendario de cuotas');
      }

      const result = await response.json();
      const normalized = normalizeResponse<{ schedule: ScheduleItem[] }>(result);
      return normalized.schedule || [];
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async recordPayment(planId: number, data: RecordPaymentData): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/${planId}/payments/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al registrar el pago');
      }

      const result = await response.json();
      return normalizeResponse<PaymentResponse>(result);
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async updatePlan(id: number, data: UpdatePlanData): Promise<InstallmentPlan> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al actualizar el plan de cuotas');
      }

      const result = await response.json();
      return normalizeResponse<InstallmentPlan>(result);
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getMonthlySummary(year?: number, month?: number): Promise<MonthlySummary> {
    try {
      const params = new URLSearchParams();
      if (year) params.append('year', year.toString());
      if (month) params.append('month', month.toString());
      
      const query = params.toString() ? `?${params.toString()}` : '';
      const url = `${API_BASE_URL}/api/credit-cards/plans/monthly-summary/${query}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener el resumen mensual');
      }

      const result = await response.json();
      return normalizeResponse<MonthlySummary>(result);
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getUpcomingPayments(days: number = 30): Promise<UpcomingPayment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/upcoming-payments/?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener los próximos pagos');
      }

      const result = await response.json();
      const normalized = normalizeResponse<UpcomingPayment[]>(result);
      return Array.isArray(normalized) ? normalized : [];
    } catch (error) {
      throw handleNetworkError(error);
    }
  },
};

