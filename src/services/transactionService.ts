import { checkAndHandleAuthError } from '../utils/authErrorHandler';

import { Currency } from '../utils/currencyUtils';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export type TransactionType = 1 | 2 | 3 | 4;

export interface Transaction {
  id: number;
  origin_account: number;
  origin_account_name?: string;
  origin_account_currency?: Currency; // Moneda de la cuenta de origen
  destination_account: number | null;
  destination_account_name?: string;
  type: TransactionType;
  type_display?: string;
  base_amount: number;
  tax_percentage: number | null;
  taxed_amount?: number | null;
  gmf_amount?: number | null;
  total_amount: number;
  capital_amount?: number | null;
  interest_amount?: number | null;
  date: string;
  created_at?: string; // Fecha y hora de creación (del servidor)
  updated_at?: string; // Fecha y hora de última actualización
  category?: number | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  tag?: string | null;
  note?: string | null;
  applied_rule?: number | null;
  applied_rule_name?: string | null;
  created_by?: number;
  updated_by?: number;
  // Campos de conversión a moneda base (HU-17)
  transaction_currency?: Currency | null;
  exchange_rate?: number | null;
  original_amount?: number | null;
  base_currency?: Currency;
  base_equivalent_amount?: number | null; // En centavos
  base_exchange_rate?: number | null;
  base_exchange_rate_warning?: string | null;
}

export interface CreateTransactionData {
  origin_account: number;
  destination_account?: number | null;
  type: TransactionType;
  base_amount?: number;
  total_amount?: number;
  tax_percentage?: number | null;
  capital_amount?: number | null;
  interest_amount?: number | null;
  date: string;
  category?: number | null;
  tag?: string | null;
  note?: string | null;
  goal?: number | null;
  transaction_currency?: 'COP' | 'USD' | 'EUR' | null;
  exchange_rate?: number | null;
  original_amount?: number | null;
}

export interface UpdateTransactionData {
  origin_account?: number;
  destination_account?: number | null;
  type?: TransactionType;
  base_amount?: number;
  total_amount?: number;
  tax_percentage?: number | null;
  capital_amount?: number | null;
  interest_amount?: number | null;
  date?: string;
  category?: number | null;
  tag?: string | null;
  note?: string | null;
}

export interface TransactionFilters {
  search?: string;
  type?: TransactionType;
  origin_account?: number;
  destination_account?: number;
  category?: number;
  tag?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  start_date?: string;
  end_date?: string;
  ordering?: string; // 'date', '-date', 'total_amount', '-total_amount'
  page?: number;
  page_size?: number;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

const buildQueryParams = (filters?: TransactionFilters) => {
  const params = new URLSearchParams();
  if (filters?.search) {
    params.append('search', filters.search);
  }
  if (filters?.type) {
    params.append('type', String(filters.type));
  }
  if (filters?.origin_account) {
    params.append('origin_account', String(filters.origin_account));
  }
  if (filters?.destination_account) {
    params.append('destination_account', String(filters.destination_account));
  }
  if (filters?.category) {
    params.append('category', String(filters.category));
  }
  if (filters?.tag) {
    params.append('tag', filters.tag);
  }
  if (filters?.date) {
    params.append('date', filters.date);
  }
  if (filters?.date_from) {
    params.append('date_from', filters.date_from);
  }
  if (filters?.date_to) {
    params.append('date_to', filters.date_to);
  }
  if (filters?.start_date) {
    params.append('start_date', filters.start_date);
  }
  if (filters?.end_date) {
    params.append('end_date', filters.end_date);
  }
  if (filters?.ordering) {
    params.append('ordering', filters.ordering);
  }
  if (filters?.page) {
    params.append('page', String(filters.page));
  }
  if (filters?.page_size) {
    params.append('page_size', String(filters.page_size));
  }
  return params.toString() ? `?${params.toString()}` : '';
};

const parseError = async (response: Response) => {
  if (response.status >= 500) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.detail || error.message || error.error || 'Error interno del servidor';
    throw new Error(`Error del servidor (${response.status}): ${errorMessage}. Por favor, intenta nuevamente más tarde o contacta al administrador.`);
  }

  if (response.status === 401) {
    checkAndHandleAuthError(response);
    throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    throw new Error('No tienes permisos para realizar esta operación.');
  }

  if (response.status === 404) {
    throw new Error('El recurso solicitado no fue encontrado.');
  }

  const fallback = { message: 'Error en la operación de transacciones' };
  let error;
  try {
    error = await response.json();
  } catch {
    error = fallback;
  }
  
  const errorMessages: string[] = [];
  
  if (error.message && 
      error.message !== 'Error en la petición' && 
      !errorMessages.includes(error.message)) {
    errorMessages.push(error.message);
  }
  if (error.detail && !errorMessages.includes(error.detail)) {
    errorMessages.push(error.detail);
  }
  
  const errorDetails = error.details || error;
  
  const fields = ['origin_account', 'destination_account', 'type', 'base_amount', 'total_amount', 'tax_percentage', 'date', 'category', 'tag', 'note', 'capital_amount', 'interest_amount'];
  
  for (const field of fields) {
    const fieldError = errorDetails[field] || error[field];
    if (fieldError) {
      const errorText = Array.isArray(fieldError) ? fieldError[0] : fieldError;
      const fieldLabel = {
        origin_account: 'Cuenta origen',
        destination_account: 'Cuenta destino',
        type: 'Tipo de transacción',
        base_amount: 'Monto base',
        total_amount: 'Monto total',
        tax_percentage: 'Porcentaje de IVA',
        date: 'Fecha',
        category: 'Categoría',
        tag: 'Etiqueta',
        note: 'Nota',
        capital_amount: 'Monto de capital',
        interest_amount: 'Monto de intereses',
      }[field] || field;
      errorMessages.push(`${fieldLabel}: ${errorText}`);
    }
  }
  
  if (error.details && typeof error.details === 'object') {
    Object.keys(error.details).forEach(key => {
      if (!fields.includes(key) && 
          key !== 'message' && 
          key !== 'detail' && 
          key !== 'non_field_errors' &&
          error.details[key]) {
        const fieldError = Array.isArray(error.details[key]) ? error.details[key][0] : error.details[key];
        if (typeof fieldError === 'string' && !errorMessages.includes(fieldError)) {
          const fieldLabel = {
            origin_account: 'Cuenta origen',
            destination_account: 'Cuenta destino',
            type: 'Tipo de transacción',
            base_amount: 'Monto base',
            total_amount: 'Monto total',
            tax_percentage: 'Porcentaje de IVA',
            date: 'Fecha',
            category: 'Categoría',
            tag: 'Etiqueta',
            note: 'Nota',
            capital_amount: 'Monto de capital',
            interest_amount: 'Monto de intereses',
          }[key] || key;
          errorMessages.push(`${fieldLabel}: ${fieldError}`);
        }
      }
    });
  }
  
  const nonFieldErrors = errorDetails.non_field_errors || error.non_field_errors;
  if (nonFieldErrors) {
    const nonFieldErrorsArray = Array.isArray(nonFieldErrors) ? nonFieldErrors : [nonFieldErrors];
    nonFieldErrorsArray.forEach((err: string) => {
      if (!errorMessages.includes(err)) {
        errorMessages.push(err);
      }
    });
  }
  
  Object.keys(error).forEach(key => {
    if (key !== 'details' &&
        !fields.includes(key) && 
        key !== 'message' && 
        key !== 'detail' && 
        key !== 'non_field_errors' &&
        key !== 'error' &&
        key !== 'status_code' &&
        key !== 'suggestion' &&
        error[key]) {
      const fieldError = Array.isArray(error[key]) ? error[key][0] : error[key];
      if (typeof fieldError === 'string' && !errorMessages.includes(fieldError)) {
        errorMessages.push(`${key}: ${fieldError}`);
      }
    }
  });
  
  if (errorMessages.length === 0) {
    if (error.suggestion) {
      errorMessages.push(error.suggestion);
    } else {
      errorMessages.push('Error en la operación. Verifica que todos los campos obligatorios estén completos.');
    }
  }
  
  throw new Error(errorMessages.join('. '));
};

const handleFetchError = (error: unknown): never => {
  if (error instanceof TypeError) {
    if (error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000');
    }
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Error desconocido al realizar la operación');
};

export const transactionService = {
  async list(filters?: TransactionFilters): Promise<Transaction[]> {
    try {
      const query = buildQueryParams(filters);
      const response = await fetch(`${API_BASE_URL}/api/transactions/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        return data;
      } else if (data.results && Array.isArray(data.results)) {
        return data.results;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.transactions && Array.isArray(data.transactions)) {
        return data.transactions;
      } else {
        return [];
      }
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async listPaginated(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    try {
      const query = buildQueryParams(filters);
      const response = await fetch(`${API_BASE_URL}/api/transactions/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        return {
          count: data.count || data.results.length,
          next: data.next || null,
          previous: data.previous || null,
          results: data.results,
        };
      } else if (Array.isArray(data)) {
        return {
          count: data.length,
          next: null,
          previous: null,
          results: data,
        };
      } else {
        return {
          count: 0,
          next: null,
          previous: null,
          results: [],
        };
      }
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async get(id: number): Promise<Transaction> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async create(data: CreateTransactionData): Promise<Transaction> {
    try {
      const cleanData: Record<string, unknown> = {
        origin_account: data.origin_account,
        type: data.type,
        date: data.date,
      };

      // Los montos ya vienen en centavos desde NewMovementModal
      // Asegurarse de que sean números enteros (no floats) para evitar que el backend los multiplique por 100
      if (data.total_amount !== undefined && data.total_amount > 0) {
        // Asegurar que sea un entero, no un float
        // Usar Math.floor para asegurar que siempre sea un entero, incluso para números muy grandes
        const totalAmountInt = Number.isInteger(data.total_amount) 
          ? data.total_amount 
          : Math.floor(data.total_amount);
        cleanData.total_amount = totalAmountInt;
        // Verificar que el valor sea razonable (al menos 100 centavos = 1 peso)
        if ((cleanData.total_amount as number) < 100) {
          throw new Error('El monto debe ser al menos 1 peso');
        }
        if ('base_amount' in cleanData) {
          delete cleanData.base_amount;
        }
      } else if (data.base_amount !== undefined && data.base_amount > 0) {
        // Asegurar que sea un entero, no un float
        // Usar Math.floor para asegurar que siempre sea un entero, incluso para números muy grandes
        const baseAmountInt = Number.isInteger(data.base_amount) 
          ? data.base_amount 
          : Math.floor(data.base_amount);
        cleanData.base_amount = baseAmountInt;
        // Verificar que el valor sea razonable (al menos 100 centavos = 1 peso)
        if ((cleanData.base_amount as number) < 100) {
          throw new Error('El monto base debe ser al menos 1 peso');
        }
        if (data.tax_percentage && data.tax_percentage > 0) {
          const baseAmount = cleanData.base_amount as number;
          // Calcular total con impuestos en centavos
          cleanData.total_amount = Math.floor(baseAmount * (1 + data.tax_percentage / 100));
        } else {
          cleanData.total_amount = cleanData.base_amount;
        }
        if (data.total_amount !== undefined && data.total_amount !== cleanData.total_amount) {
          void 0;
        }
      } else {
        throw new Error('Debe proporcionarse base_amount o total_amount');
      }
      
      if (cleanData.total_amount !== undefined && cleanData.base_amount !== undefined) {
        delete cleanData.base_amount;
      }

      if (data.destination_account !== undefined && data.destination_account !== null) {
        cleanData.destination_account = data.destination_account;
      }

      if (data.category !== undefined && data.category !== null) {
        cleanData.category = data.category;
      }

      if (data.tax_percentage !== undefined && data.tax_percentage !== null && data.tax_percentage > 0) {
        cleanData.tax_percentage = data.tax_percentage;
      }

      if (data.tag !== undefined && data.tag !== null && data.tag.trim() !== '') {
        cleanData.tag = data.tag.trim();
      }

      if (data.note !== undefined && data.note !== null && data.note.trim() !== '') {
        cleanData.note = data.note.trim();
      }

      if (data.goal !== undefined && data.goal !== null && data.type === 4) {
        cleanData.goal = data.goal;
      }

      // Debug: verificar qué se está enviando
      console.log('[DEBUG] Enviando al backend:', cleanData);
      console.log('[DEBUG] total_amount tipo:', typeof cleanData.total_amount, 'valor:', cleanData.total_amount);
      console.log('[DEBUG] base_amount tipo:', typeof cleanData.base_amount, 'valor:', cleanData.base_amount);
      
      const response = await fetch(`${API_BASE_URL}/api/transactions/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async update(id: number, data: UpdateTransactionData): Promise<Transaction> {
    try {
      const cleanData: Record<string, unknown> = {};

      if (data.origin_account !== undefined) {
        cleanData.origin_account = data.origin_account;
      }
      if (data.type !== undefined) {
        cleanData.type = data.type;
      }
      
      // Los montos ya vienen en centavos desde NewMovementModal
      // Solo validamos que sean números enteros positivos
      if (data.total_amount !== undefined && data.total_amount > 0) {
        cleanData.total_amount = Math.round(data.total_amount);
      } else if (data.base_amount !== undefined && data.base_amount > 0) {
        cleanData.base_amount = Math.round(data.base_amount);
        if (data.tax_percentage !== undefined && data.tax_percentage !== null && data.tax_percentage > 0) {
          const baseAmount = cleanData.base_amount as number;
          // Calcular total con impuestos en centavos
          cleanData.total_amount = Math.round(baseAmount * (1 + data.tax_percentage / 100));
        } else {
          cleanData.total_amount = cleanData.base_amount;
        }
      }
      
      if (data.date !== undefined) {
        cleanData.date = data.date;
      }

      if (data.destination_account !== undefined) {
        cleanData.destination_account = data.destination_account;
      }

      if (data.category !== undefined && data.category !== null) {
        cleanData.category = data.category;
      }

      if (data.tax_percentage !== undefined && data.tax_percentage !== null && data.tax_percentage > 0) {
        cleanData.tax_percentage = data.tax_percentage;
        if (cleanData.base_amount !== undefined && !cleanData.total_amount) {
          const baseAmount = cleanData.base_amount as number;
          const taxPercentage = data.tax_percentage;
          cleanData.total_amount = parseFloat((baseAmount * (1 + taxPercentage / 100)).toFixed(2));
        }
      }
      
      if (cleanData.total_amount && cleanData.base_amount) {
        delete cleanData.base_amount;
      }

      if (data.tag !== undefined && data.tag !== null && data.tag.trim() !== '') {
        cleanData.tag = data.tag.trim();
      } else if (data.tag === null || data.tag === '') {
        cleanData.tag = null;
      }

      if (data.note !== undefined && data.note !== null && data.note.trim() !== '') {
        cleanData.note = data.note.trim();
      } else if (data.note === null || data.note === '') {
        cleanData.note = null;
      }

      if (Object.keys(cleanData).length === 0) {
        throw new Error('No se proporcionaron datos para actualizar');
      }

      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async bulkDelete(ids: number[]): Promise<{ message: string; deleted_count: number; errors?: Array<{ transaction_id: number; error: string }> }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/transactions/bulk_delete/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ids }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async duplicate(id: number, newDate?: string): Promise<Transaction> {
    try {
      const original = await this.get(id);
      
      const duplicateData: CreateTransactionData = {
        origin_account: original.origin_account,
        destination_account: original.destination_account,
        type: original.type,
        base_amount: original.base_amount,
        tax_percentage: original.tax_percentage,
        date: newDate || new Date().toISOString().split('T')[0],
        tag: original.tag,
        note: original.note ? `${original.note} (duplicado)` : 'Duplicado',
      };
      
      return this.create(duplicateData);
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },
};

