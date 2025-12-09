import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

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

const parseError = async (response: Response, defaultMessage: string = 'Error en la operación'): Promise<Error> => {
  if (response.status >= 500) {
    let errorText = await response.text();
    
    if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html')) {
      const exceptionMatch = errorText.match(/<pre class="exception_value">([^<]+)<\/pre>/);
      if (exceptionMatch) {
        errorText = exceptionMatch[1].trim();
      } else {
        const titleMatch = errorText.match(/<title>([^<]+)<\/title>/);
        if (titleMatch) {
          errorText = titleMatch[1].trim();
        } else {
          errorText = 'Error interno del servidor. Revisa los logs del backend para más detalles.';
        }
      }
    } else {
      try {
        const errorJson = JSON.parse(errorText);
        errorText = errorJson.detail || errorJson.message || errorJson.error || errorText;
      } catch {
        if (errorText.length > 500) {
          errorText = errorText.substring(0, 500) + '...';
        }
      }
    }
    
    return new Error(`Error del servidor (${response.status}): ${errorText}. Por favor, intenta nuevamente más tarde o contacta al administrador.`);
  }

  if (response.status === 401) {
    checkAndHandleAuthError(response);
    return new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    return new Error('No tienes permisos para realizar esta operación.');
  }

  if (response.status === 404) {
    return new Error('El recurso solicitado no fue encontrado.');
  }

  const fallback = { message: defaultMessage };
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

  const fields = [
    'credit_card_account_id',
    'purchase_transaction_id',
    'financing_category_id',
    'number_of_installments',
    'interest_rate',
    'start_date',
    'description',
    'installment_number',
    'payment_date',
    'source_account_id',
    'notes'
  ];

  for (const field of fields) {
    if (error[field]) {
      const fieldError = Array.isArray(error[field]) ? error[field][0] : error[field];
      const fieldLabel: Record<string, string> = {
        credit_card_account_id: 'Tarjeta de crédito',
        purchase_transaction_id: 'Transacción de compra',
        financing_category_id: 'Categoría de financiamiento',
        number_of_installments: 'Número de cuotas',
        interest_rate: 'Tasa de interés',
        start_date: 'Fecha de inicio',
        description: 'Descripción',
        installment_number: 'Número de cuota',
        payment_date: 'Fecha de pago',
        source_account_id: 'Cuenta origen',
        notes: 'Notas'
      };
      errorMessages.push(`${fieldLabel[field] || field}: ${fieldError}`);
    }
  }

  if (error.non_field_errors) {
    const nonFieldErrors = Array.isArray(error.non_field_errors) ? error.non_field_errors : [error.non_field_errors];
    errorMessages.push(...nonFieldErrors);
  }

  if (errorMessages.length === 0) {
    errorMessages.push(defaultMessage);
  }

  return new Error(errorMessages.join('. '));
};

const handleFetchError = (error: unknown): Error => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.');
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Error desconocido al realizar la operación');
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
        throw await parseError(response, 'Error al crear el plan de cuotas');
      }

      const result = await response.json();
      const normalized = normalizeResponse<{ plan_id: number }>(result);
      return normalized.plan_id;
    } catch (error) {
      throw handleFetchError(error);
    }
  },

  async listPlans(): Promise<InstallmentPlan[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al listar los planes de cuotas');
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
      throw handleFetchError(error);
    }
  },

  async getPlan(id: number): Promise<InstallmentPlan> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al obtener el plan de cuotas');
      }

      const result = await response.json();
      return normalizeResponse<InstallmentPlan>(result);
    } catch (error) {
      throw handleFetchError(error);
    }
  },

  async getSchedule(id: number): Promise<ScheduleItem[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/${id}/schedule/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al obtener el calendario de cuotas');
      }

      const result = await response.json();
      const normalized = normalizeResponse<{ schedule: ScheduleItem[] }>(result);
      return normalized.schedule || [];
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al registrar el pago');
      }

      const result = await response.json();
      return normalizeResponse<PaymentResponse>(result);
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al actualizar el plan de cuotas');
      }

      const result = await response.json();
      return normalizeResponse<InstallmentPlan>(result);
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al obtener el resumen mensual');
      }

      const result = await response.json();
      return normalizeResponse<MonthlySummary>(result);
    } catch (error) {
      throw handleFetchError(error);
    }
  },

  async getUpcomingPayments(days: number = 30): Promise<UpcomingPayment[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/credit-cards/plans/upcoming-payments/?days=${days}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al obtener los próximos pagos');
      }

      const result = await response.json();
      const normalized = normalizeResponse<UpcomingPayment[]>(result);
      return Array.isArray(normalized) ? normalized : [];
    } catch (error) {
      throw handleFetchError(error);
    }
  },
};

