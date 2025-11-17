const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface Account {
  id?: number;
  name: string;
  account_type: 'asset' | 'liability';
  category: 'bank_account' | 'savings_account' | 'credit_card' | 'wallet' | 'other';
  currency: 'COP' | 'USD' | 'EUR';
  current_balance: number;
  description?: string;
  is_active?: boolean;
  bank_name?: string;
  account_number?: string;
  credit_limit?: number;
  gmf_exempt?: boolean;
  expiration_date?: string;
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
  has_movements: boolean;
  movement_count?: number;
  warnings?: string[];
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
    const response = await fetch(`${API_BASE_URL}/api/accounts/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al obtener cuentas' }));
      throw new Error(error.message || error.detail || 'Error al obtener cuentas');
    }

    const data = await response.json();
    
    return data;
  },

  async getAccountById(id: number): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al obtener la cuenta' }));
      throw new Error(error.message || error.detail || 'Error al obtener la cuenta');
    }

    return response.json();
  },

  async createAccount(data: CreateAccountData): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al crear la cuenta' }));
      
      const errorMessages: string[] = [];
      
      const fields = ['name', 'account_type', 'category', 'currency', 'current_balance', 'credit_limit', 'bank_name', 'account_number'];
      
      for (const field of fields) {
        if (error[field]) {
          const fieldError = Array.isArray(error[field]) ? error[field][0] : error[field];
          const fieldLabel = {
            name: 'Nombre',
            account_type: 'Tipo de cuenta',
            category: 'Categoría',
            currency: 'Moneda',
            current_balance: 'Saldo inicial',
            credit_limit: 'Límite de crédito',
            bank_name: 'Banco',
            account_number: 'Número de cuenta',
          }[field] || field;
          errorMessages.push(`${fieldLabel}: ${fieldError}`);
        }
      }
      
      if (error.message) {
        errorMessages.push(error.message);
      }
      if (error.detail) {
        errorMessages.push(error.detail);
      }
      if (error.non_field_errors) {
        const nonFieldErrors = Array.isArray(error.non_field_errors) ? error.non_field_errors : [error.non_field_errors];
        errorMessages.push(...nonFieldErrors);
      }
      
      if (errorMessages.length === 0) {
        const errorValues = Object.values(error);
        const firstArrayValue = Array.isArray(errorValues[0]) ? errorValues[0][0] : null;
        if (firstArrayValue) {
          errorMessages.push(String(firstArrayValue));
        } else {
          errorMessages.push('Error al crear la cuenta. Verifica que todos los campos obligatorios estén completos.');
        }
      }
      
      throw new Error(errorMessages.join('. '));
    }

    return response.json();
  },

  async updateAccount(id: number, data: UpdateAccountData): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al actualizar la cuenta' }));
      
      if (error.account_type) {
        const errorMsg = Array.isArray(error.account_type) ? error.account_type[0] : error.account_type;
        throw new Error(`Error en tipo de cuenta: ${errorMsg}`);
      }
      if (error.category) {
        const errorMsg = Array.isArray(error.category) ? error.category[0] : error.category;
        throw new Error(`Error en categoría: ${errorMsg}`);
      }
      if (error.name) {
        const errorMsg = Array.isArray(error.name) ? error.name[0] : error.name;
        throw new Error(`Error en nombre: ${errorMsg}`);
      }
      if (error.current_balance) {
        const errorMsg = Array.isArray(error.current_balance) ? error.current_balance[0] : error.current_balance;
        throw new Error(`Error en saldo: ${errorMsg}`);
      }
      
      throw new Error(error.message || error.detail || 'Error al actualizar la cuenta');
    }

    return response.json();
  },

  async deleteAccount(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al eliminar la cuenta' }));
      throw new Error(error.message || error.detail || 'Error al eliminar la cuenta');
    }
  },

  async validateDeletion(id: number): Promise<ValidateDeletionResponse> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/validate_deletion/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ force: false }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al validar eliminación' }));
      throw new Error(error.message || error.detail || 'Error al validar eliminación');
    }

    return response.json();
  },

  async updateBalance(id: number, newBalance: number, reason?: string): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/update_balance/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        new_balance: newBalance,
        reason: reason || 'Ajuste manual'
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al actualizar el saldo' }));
      throw new Error(error.message || error.detail || 'Error al actualizar el saldo');
    }

    return response.json();
  },

  async toggleActive(id: number): Promise<Account> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/toggle_active/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al cambiar estado de la cuenta' }));
      throw new Error(error.message || error.detail || 'Error al cambiar estado de la cuenta');
    }

    return response.json();
  },

  async getAccountOptions(): Promise<AccountOptions> {
    const response = await fetch(`${API_BASE_URL}/api/accounts/options/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Endpoint no implementado en el backend');
      }
      const error = await response.json().catch(() => ({ message: 'Error al obtener opciones' }));
      throw new Error(error.message || error.detail || 'Error al obtener opciones');
    }

    return response.json();
  },
};
