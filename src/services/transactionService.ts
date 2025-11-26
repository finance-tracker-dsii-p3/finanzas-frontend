import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export type TransactionType = 1 | 2 | 3 | 4; // 1=Income, 2=Expense, 3=Transfer, 4=Saving

export interface Transaction {
  id: number;
  origin_account: number;
  origin_account_name?: string;
  destination_account: number | null;
  destination_account_name?: string;
  type: TransactionType;
  type_display?: string;
  base_amount: number;
  tax_percentage: number | null;
  taxed_amount?: number | null; // IVA calculado
  gmf_amount?: number | null; // GMF (4x1000) calculado automáticamente
  total_amount: number;
  capital_amount?: number | null; // Capital pagado (reduce deuda en tarjetas de crédito)
  interest_amount?: number | null; // Intereses pagados (no reduce deuda)
  date: string;
  category?: number | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  tag?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
  created_by?: number;
  updated_by?: number;
}

export interface CreateTransactionData {
  origin_account: number;
  destination_account?: number | null;
  type: TransactionType;
  base_amount?: number; // Opcional: no se envía si se usa total_amount (HU-15)
  total_amount?: number; // Opcional: no se envía si se usa base_amount (modo tradicional)
  tax_percentage?: number | null;
  capital_amount?: number | null; // Para pagos a tarjetas de crédito
  interest_amount?: number | null; // Para pagos a tarjetas de crédito
  date: string;
  category?: number | null;
  tag?: string | null;
  note?: string | null;
}

export interface UpdateTransactionData {
  origin_account?: number;
  destination_account?: number | null;
  type?: TransactionType;
  base_amount?: number;
  total_amount?: number;
  tax_percentage?: number | null;
  capital_amount?: number | null; // Para pagos a tarjetas de crédito
  interest_amount?: number | null; // Para pagos a tarjetas de crédito
  date?: string;
  category?: number | null;
  tag?: string | null;
  note?: string | null;
}

export interface TransactionFilters {
  type?: TransactionType;
  origin_account?: number;
  destination_account?: number;
  tag?: string;
  date?: string;
  date_from?: string;
  date_to?: string;
  ordering?: string; // 'date', '-date', 'total_amount', '-total_amount'
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
  if (filters?.type) {
    params.append('type', String(filters.type));
  }
  if (filters?.origin_account) {
    params.append('origin_account', String(filters.origin_account));
  }
  if (filters?.destination_account) {
    params.append('destination_account', String(filters.destination_account));
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
  if (filters?.ordering) {
    params.append('ordering', filters.ordering);
  }
  return params.toString() ? `?${params.toString()}` : '';
};

const parseError = async (response: Response) => {
  // Manejar errores del servidor (500, 502, 503, etc.)
  if (response.status >= 500) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.detail || error.message || error.error || 'Error interno del servidor';
    throw new Error(`Error del servidor (${response.status}): ${errorMessage}. Por favor, intenta nuevamente más tarde o contacta al administrador.`);
  }

  // Manejar errores de autenticación
  if (response.status === 401) {
    checkAndHandleAuthError(response);
    throw new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
  }

  // Manejar errores de permisos
  if (response.status === 403) {
    throw new Error('No tienes permisos para realizar esta operación.');
  }

  // Manejar errores de recurso no encontrado
  if (response.status === 404) {
    throw new Error('El recurso solicitado no fue encontrado.');
  }

  // Manejar otros errores del cliente (400, 422, etc.)
  const fallback = { message: 'Error en la operación de transacciones' };
  let error;
  try {
    error = await response.json();
  } catch {
    error = fallback;
  }
  
  const errorMessages: string[] = [];
  
  // Primero, mostrar el mensaje general si existe (pero no si es genérico)
  if (error.message && 
      error.message !== 'Error en la petición' && 
      !errorMessages.includes(error.message)) {
    errorMessages.push(error.message);
  }
  if (error.detail && !errorMessages.includes(error.detail)) {
    errorMessages.push(error.detail);
  }
  
  // El backend puede devolver errores en `details` o directamente en el objeto
  const errorDetails = error.details || error;
  
  // Luego, mostrar errores de campos específicos
  const fields = ['origin_account', 'destination_account', 'type', 'base_amount', 'total_amount', 'tax_percentage', 'date', 'category', 'tag', 'note', 'capital_amount', 'interest_amount'];
  
  for (const field of fields) {
    // Buscar primero en details, luego en el objeto principal
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
  
  // Si hay un objeto details, buscar otros campos que no estén en la lista
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
  
  // Errores no relacionados con campos específicos
  const nonFieldErrors = errorDetails.non_field_errors || error.non_field_errors;
  if (nonFieldErrors) {
    const nonFieldErrorsArray = Array.isArray(nonFieldErrors) ? nonFieldErrors : [nonFieldErrors];
    nonFieldErrorsArray.forEach((err: string) => {
      if (!errorMessages.includes(err)) {
        errorMessages.push(err);
      }
    });
  }
  
  // Si hay otros campos de error en el objeto principal (no en details), agregarlos
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
  
  // Si no hay mensajes de error específicos, mostrar un mensaje genérico
  if (errorMessages.length === 0) {
    // Si hay una sugerencia del backend, usarla
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
    // Errores de red (conexión rechazada, sin conexión, etc.)
    if (error.message.includes('fetch') || 
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('ERR_CONNECTION_REFUSED')) {
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose en http://localhost:8000');
    }
  }
  // Si es un Error ya formateado, lo re-lanzamos
  if (error instanceof Error) {
    throw error;
  }
  // Para cualquier otro tipo de error
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
      
      // Manejar respuestas paginadas (con 'results' o 'data')
      if (Array.isArray(data)) {
        return data;
      } else if (data.results && Array.isArray(data.results)) {
        return data.results;
      } else if (data.data && Array.isArray(data.data)) {
        return data.data;
      } else if (data.transactions && Array.isArray(data.transactions)) {
        return data.transactions;
      } else {
        // Si no es un array ni tiene estructura conocida, devolver array vacío o lanzar error
        console.warn('Formato de respuesta inesperado del backend:', data);
        return [];
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
      // Limpiar el objeto de datos: remover campos undefined y null innecesarios
      const cleanData: Record<string, unknown> = {
        origin_account: data.origin_account,
        type: data.type,
        date: data.date,
      };

      // Modo HU-15: Si se envía total_amount, NO enviar base_amount
      if (data.total_amount !== undefined && data.total_amount > 0) {
        cleanData.total_amount = Math.round(data.total_amount);
        // Asegurar que NO se incluya base_amount cuando se usa total_amount (HU-15)
        // Eliminar explícitamente base_amount si existe
        if ('base_amount' in cleanData) {
          delete cleanData.base_amount;
        }
      } else if (data.base_amount !== undefined && data.base_amount > 0) {
        // Modo tradicional: Enviar base_amount
        cleanData.base_amount = Math.round(data.base_amount);
        // Calcular total_amount si hay tax_percentage
        if (data.tax_percentage && data.tax_percentage > 0) {
          const baseAmount = cleanData.base_amount as number;
          cleanData.total_amount = Math.round(baseAmount * (1 + data.tax_percentage / 100));
        } else {
          // Si no hay IVA, total = base
          cleanData.total_amount = cleanData.base_amount;
        }
        // Asegurar que NO se incluya total_amount del parámetro original si ya calculamos uno
        // (solo si viene en data.total_amount y no debería estar)
        if (data.total_amount !== undefined && data.total_amount !== cleanData.total_amount) {
          // Ya calculamos total_amount desde base_amount, no usar el que viene en data
          // (no hacer nada, ya tenemos el correcto)
        }
      } else {
        // Validación: debe haber al menos uno de los dos
        throw new Error('Debe proporcionarse base_amount o total_amount');
      }
      
      // Validación final: asegurar que no se incluyan ambos campos simultáneamente
      // Esto es una medida de seguridad adicional
      if (cleanData.total_amount !== undefined && cleanData.base_amount !== undefined) {
        // Si ambos están presentes, priorizar total_amount (modo HU-15)
        delete cleanData.base_amount;
      }

      // Solo incluir destination_account si está presente y no es null (solo para transferencias)
      if (data.destination_account !== undefined && data.destination_account !== null) {
        cleanData.destination_account = data.destination_account;
      }

      // Incluir category solo si está presente y no es null (requerido para ingresos y gastos, no permitido para transferencias)
      if (data.category !== undefined && data.category !== null) {
        cleanData.category = data.category;
      }

      // Solo incluir tax_percentage si está presente y no es null
      if (data.tax_percentage !== undefined && data.tax_percentage !== null && data.tax_percentage > 0) {
        cleanData.tax_percentage = data.tax_percentage;
      }

      // Solo incluir tag si está presente y no es null/empty
      if (data.tag !== undefined && data.tag !== null && data.tag.trim() !== '') {
        cleanData.tag = data.tag.trim();
      }

      // Solo incluir note si está presente y no es null/empty
      if (data.note !== undefined && data.note !== null && data.note.trim() !== '') {
        cleanData.note = data.note.trim();
      }

      // Log para debugging (solo en desarrollo)
      if (import.meta.env.DEV) {
        console.log('Enviando datos de transacción:', cleanData);
      }

      const response = await fetch(`${API_BASE_URL}/api/transactions/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        // Log del error para debugging
        if (import.meta.env.DEV) {
          const errorText = await response.clone().text();
          console.error('Error del backend:', response.status, errorText);
        }
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
      // Limpiar el objeto de datos similar a create
      const cleanData: Record<string, unknown> = {};

      if (data.origin_account !== undefined) {
        cleanData.origin_account = data.origin_account;
      }
      if (data.type !== undefined) {
        cleanData.type = data.type;
      }
      // Modo HU-15: Si se envía total_amount, NO enviar base_amount
      if (data.total_amount !== undefined) {
        cleanData.total_amount = Math.round(data.total_amount);
        // NO incluir base_amount cuando se usa total_amount (HU-15)
        // Si hay base_amount también, el backend rechazará la petición
      } else if (data.base_amount !== undefined) {
        // Modo tradicional: Enviar base_amount
        cleanData.base_amount = Math.round(data.base_amount);
        // Si se actualiza base_amount, recalcular total_amount si hay tax_percentage
        if (data.tax_percentage !== undefined && data.tax_percentage !== null && data.tax_percentage > 0) {
          const baseAmount = cleanData.base_amount as number;
          cleanData.total_amount = Math.round(baseAmount * (1 + data.tax_percentage / 100));
        } else if (data.total_amount === undefined) {
          // Si no hay tax_percentage, total_amount = base_amount
          cleanData.total_amount = cleanData.base_amount;
        }
      }
      if (data.date !== undefined) {
        cleanData.date = data.date;
      }

      // Solo incluir destination_account si está presente y no es null
      if (data.destination_account !== undefined && data.destination_account !== null) {
        cleanData.destination_account = data.destination_account;
      }

      // Incluir category solo si está presente y no es null
      if (data.category !== undefined && data.category !== null) {
        cleanData.category = data.category;
      }

      // Solo incluir tax_percentage si está presente y no es null
      if (data.tax_percentage !== undefined && data.tax_percentage !== null && data.tax_percentage > 0) {
        cleanData.tax_percentage = data.tax_percentage;
        // Recalcular total_amount si se actualiza tax_percentage y hay base_amount
        if (data.base_amount !== undefined && cleanData.base_amount !== undefined) {
          const baseAmount = cleanData.base_amount as number;
          const taxPercentage = data.tax_percentage || 0;
          cleanData.total_amount = Math.round(baseAmount * (1 + taxPercentage / 100));
        }
      }

      // Solo incluir tag si está presente y no es null/empty
      if (data.tag !== undefined && data.tag !== null && data.tag.trim() !== '') {
        cleanData.tag = data.tag.trim();
      }

      // Solo incluir note si está presente y no es null/empty
      if (data.note !== undefined && data.note !== null && data.note.trim() !== '') {
        cleanData.note = data.note.trim();
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

  async duplicate(id: number, newDate?: string): Promise<Transaction> {
    try {
      // Obtener la transacción original
      const original = await this.get(id);
      
      // Crear una nueva con los mismos datos pero fecha actual o la especificada
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

