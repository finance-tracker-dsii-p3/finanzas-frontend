import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

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
  currency_display?: string; // Nombre de visualización de la moneda
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

  const fields = ['name', 'account_type', 'category', 'currency', 'current_balance', 'credit_limit', 'bank_name', 'account_number'];

  for (const field of fields) {
    if (error[field]) {
      const fieldError = Array.isArray(error[field]) ? error[field][0] : error[field];
      const fieldLabel = {
        name: 'Nombre',
        account_type: 'Tipo de cuenta',
        category: 'Categoría',
        currency: 'Moneda',
        current_balance: 'Saldo',
        credit_limit: 'Límite de crédito',
        bank_name: 'Banco',
        account_number: 'Número de cuenta',
      }[field] || field;
      errorMessages.push(`${fieldLabel}: ${fieldError}`);
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
    return new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000');
  }
  if (error instanceof Error) {
    return error;
  }
  return new Error('Error desconocido al realizar la operación');
};

export const accountService = {
  async getAllAccounts(): Promise<Account[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al obtener cuentas');
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
      throw handleFetchError(error);
    }
  },

  async getAccountById(id: number): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al obtener la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al crear la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al actualizar la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleFetchError(error);
    }
  },

  async deleteAccount(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al eliminar la cuenta');
      }
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al validar eliminación');
      }

      return await response.json();
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al actualizar el saldo');
      }

      return await response.json();
    } catch (error) {
      throw handleFetchError(error);
    }
  },

  async toggleActive(id: number): Promise<Account> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/accounts/${id}/toggle_active/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al cambiar estado de la cuenta');
      }

      return await response.json();
    } catch (error) {
      throw handleFetchError(error);
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
        throw await parseError(response, 'Error al obtener opciones');
      }

      return await response.json();
    } catch (error) {
      throw handleFetchError(error);
    }
  },
};
