import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface Goal {
  id: number;
  user: number;
  name: string;
  target_amount: number; // En centavos
  saved_amount: number; // En centavos
  date: string; // YYYY-MM-DD
  description?: string | null;
  currency?: 'COP' | 'USD' | 'EUR'; // Moneda de la meta
  currency_display?: string; // Nombre de visualización de la moneda
  progress_percentage: number; // Calculado por el backend
  remaining_amount: number; // Calculado por el backend
  is_completed: boolean; // Calculado por el backend
  created_at?: string;
  updated_at?: string;
}

export interface CreateGoalData {
  name: string;
  target_amount: number; // En centavos
  date: string; // YYYY-MM-DD
  description?: string | null;
  currency?: 'COP' | 'USD' | 'EUR'; // Moneda de la meta
}

export interface UpdateGoalData {
  name?: string;
  target_amount?: number; // En centavos
  date?: string; // YYYY-MM-DD
  description?: string | null;
  currency?: 'COP' | 'USD' | 'EUR'; // Moneda de la meta
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

const parseError = async (response: Response): Promise<Error> => {
  if (response.status >= 500) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.detail || error.message || error.error || 'Error interno del servidor';
    return new Error(`Error del servidor (${response.status}): ${errorMessage}. Por favor, intenta nuevamente más tarde o contacta al administrador.`);
  }

  if (response.status === 401) {
    checkAndHandleAuthError(response);
    return new Error('No estás autenticado. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    return new Error('No tienes permisos para realizar esta operación.');
  }

  if (response.status === 404) {
    return new Error('La meta solicitada no fue encontrada.');
  }

  const fallback = { message: 'Error en la operación de metas' };
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
  
  const fields = ['name', 'target_amount', 'date', 'description'];
  
  for (const field of fields) {
    const fieldError = errorDetails[field] || error[field];
    if (fieldError) {
      const errorText = Array.isArray(fieldError) ? fieldError[0] : fieldError;
      const fieldLabel = {
        name: 'Nombre',
        target_amount: 'Monto objetivo',
        date: 'Fecha',
        description: 'Descripción',
      }[field] || field;
      errorMessages.push(`${fieldLabel}: ${errorText}`);
    }
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
  
  if (errorMessages.length === 0) {
    if (error.suggestion) {
      errorMessages.push(error.suggestion);
    } else {
      errorMessages.push('Error en la operación. Verifica que todos los campos obligatorios estén completos.');
    }
  }
  
  return new Error(errorMessages.join('. '));
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

export const goalService = {
  async list(): Promise<Goal[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        return data.results;
      }
      if (Array.isArray(data)) {
        return data;
      }
      
      if (data.count === 0) {
        return [];
      }
      
      return [];
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async get(id: number): Promise<Goal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async create(data: CreateGoalData): Promise<Goal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async update(id: number, data: UpdateGoalData): Promise<Goal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response);
      }
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },
};

