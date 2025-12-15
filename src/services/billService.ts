const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

export interface Bill {
  id: number;
  provider: string;
  amount: number;
  amount_formatted: string;
  due_date: string;
  suggested_account?: number;
  suggested_account_info?: {
    id: number;
    name: string;
    bank_name?: string;
    current_balance: number;
  } | null;
  category?: number;
  category_info?: {
    id: number;
    name: string;
    color: string;
    icon: string;
  } | null;
  status: 'pending' | 'paid' | 'overdue';
  payment_transaction?: number;
  payment_info?: {
    id: number;
    date: string;
    amount: number;
    account: string;
  } | null;
  reminder_days_before: number;
  description?: string;
  is_recurring: boolean;
  days_until_due: number;
  is_overdue: boolean;
  is_near_due: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBillData {
  provider: string;
  amount: number;
  due_date: string;
  suggested_account?: number;
  category?: number;
  reminder_days_before?: number;
  description?: string;
  is_recurring?: boolean;
}

export type UpdateBillData = Partial<CreateBillData>;

export interface BillPaymentData {
  account_id: number;
  payment_date: string;
  notes?: string;
}

export interface BillPaymentResponse {
  message: string;
  transaction_id: number;
  bill: Bill;
}

export interface BillReminder {
  id: number;
  bill: number;
  bill_info: {
    id: number;
    provider: string;
    amount: number;
    amount_formatted: string;
    due_date: string;
    status: string;
  };
  reminder_type: 'upcoming' | 'due_today' | 'overdue';
  reminder_type_display: string;
  message: string;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

import { parseApiError, handleNetworkError } from '../utils/apiErrorHandler';

export const billService = {
  
  async listBills(filters?: {
    status?: 'pending' | 'paid' | 'overdue';
    provider?: string;
    is_recurring?: boolean;
    is_paid?: boolean;
    due_date?: string;
    due_date_from?: string;
    due_date_to?: string;
  }): Promise<Bill[]> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.provider) queryParams.append('provider', filters.provider);
      if (filters?.is_recurring !== undefined) queryParams.append('is_recurring', filters.is_recurring.toString());
      if (filters?.is_paid !== undefined) queryParams.append('is_paid', filters.is_paid.toString());
      if (filters?.due_date) queryParams.append('due_date', filters.due_date);
      if (filters?.due_date_from) queryParams.append('due_date_from', filters.due_date_from);
      if (filters?.due_date_to) queryParams.append('due_date_to', filters.due_date_to);

      const url = `${API_BASE_URL}/api/bills/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de facturas');
      }

      const data = await response.json();
      return Array.isArray(data) ? data : (data.results || []);
    } catch (error) {
      handleNetworkError(error);
      throw error;
    }
  },

  
  async getBill(billId: number): Promise<Bill> {
    const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async createBill(data: CreateBillData): Promise<Bill> {
    const response = await fetch(`${API_BASE_URL}/api/bills/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async updateBill(billId: number, data: UpdateBillData): Promise<Bill> {
    const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async deleteBill(billId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }
  },

  
  async registerPayment(billId: number, data: BillPaymentData): Promise<BillPaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/register_payment/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async updateStatus(billId: number): Promise<{ id: number; status: string; days_until_due: number; is_paid: boolean }> {
    const response = await fetch(`${API_BASE_URL}/api/bills/${billId}/update_status/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async getPendingBills(): Promise<Bill[]> {
    const response = await fetch(`${API_BASE_URL}/api/bills/pending/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async getOverdueBills(): Promise<Bill[]> {
    const response = await fetch(`${API_BASE_URL}/api/bills/overdue/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },
};

export const billReminderService = {
  
  async listReminders(filters?: {
    is_read?: boolean;
    reminder_type?: 'upcoming' | 'due_today' | 'overdue';
    bill?: number;
  }): Promise<BillReminder[]> {
    const queryParams = new URLSearchParams();
    if (filters?.is_read !== undefined) queryParams.append('is_read', filters.is_read.toString());
    if (filters?.reminder_type) queryParams.append('reminder_type', filters.reminder_type);
    if (filters?.bill) queryParams.append('bill', filters.bill.toString());

    const url = `${API_BASE_URL}/api/bill-reminders/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  
  async getReminder(reminderId: number): Promise<BillReminder> {
    const response = await fetch(`${API_BASE_URL}/api/bill-reminders/${reminderId}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async markAsRead(reminderId: number): Promise<{ id: number; is_read: boolean; read_at: string; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/bill-reminders/${reminderId}/mark_read/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },

  
  async markAllAsRead(): Promise<{ message: string; updated_count: number }> {
    const response = await fetch(`${API_BASE_URL}/api/bill-reminders/mark_all_read/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response);
    }

    return response.json();
  },
};

