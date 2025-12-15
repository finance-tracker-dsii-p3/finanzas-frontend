import { parseApiError, handleNetworkError } from '../utils/apiErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

export interface CreditCardDetails {
  credit_limit: number;
  used_credit: number;
  current_debt: number;
  total_paid: number;
  available_credit: number;
  utilization_percentage: number;
}

export interface Account {
  id?: number;
  name: string;
  account_type: 'asset' | 'liability';
  category: 'bank_account' | 'savings_account' | 'credit_card' | 'wallet' | 'other';
  currency: 'COP' | 'USD' | 'EUR';
  currency_display?: string;
  current_balance: number;
  description?: string;
  is_active?: boolean;
  bank_name?: string;
  account_number?: string;
  credit_limit?: number;
  gmf_exempt?: boolean;
  expiration_date?: string;
  credit_card_details?: CreditCardDetails;
}

export interface CreateAccountData {
  name: string;
  account_type?: 'asset' | 'liability';
  category: 'bank_account' | 'savings_account' | 'credit_card' | 'wallet' | 'other';
  currency: 'COP' | 'USD' | 'EUR';
  current_balance?: number;
  description?: string;
  is_active?: boolean;
  gmf_exempt?: boolean;
  expiration_date?: string;
  credit_limit?: number;
  bank_name?: string;
  account_number?: string;
}

export type UpdateAccountData = Partial<CreateAccountData>;

export interface ValidateDeletionResponse {
  can_delete: boolean;
  requires_confirmation?: boolean;
  has_movements: boolean;
  movement_count?: number;
  warnings?: string[];
  errors?: string[];
}

export interface AccountOptions {
  banks: string[];
  wallets: string[];
  credit_card_banks: string[];
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};


export const accountService = {
  async getAllAccounts(): Promise<Account[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener cuentas');
      }

      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        return data.results;
      }
      if (data.data && Array.isArray(data.data)) {
        return data.data;
      }
      if (data.accounts && Array.isArray(data.accounts)) {
        return data.accounts;
      }
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getAccountById(id: number): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async createAccount(data: CreateAccountData): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al crear la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async updateAccount(id: number, data: UpdateAccountData): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al actualizar la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async deleteAccount(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al eliminar la cuenta');
      }
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async validateDeletion(id: number): Promise<ValidateDeletionResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/validate_deletion/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ force: false }),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al validar eliminación');
      }

      return await response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async updateBalance(id: number, newBalance: number, reason?: string): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/update_balance/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          new_balance: newBalance,
          reason: reason || 'Ajuste manual'
        }),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al actualizar el saldo');
      }

      return await response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async toggleActive(id: number): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/toggle_active/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al cambiar estado de la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async getAccountOptions(): Promise<AccountOptions> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/options/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Endpoint no implementado en el backend');
        }
        throw await parseApiError(response, 'Error al obtener opciones');
      }

      return await response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },
};
