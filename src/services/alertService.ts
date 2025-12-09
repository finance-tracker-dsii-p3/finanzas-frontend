import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export type AlertType = 'warning' | 'exceeded';

export interface BudgetAlert {
  id: number;
  budget: number;
  budget_category_name?: string;
  budget_category_color?: string;
  budget_amount?: string;
  budget_spent_percentage?: string;
  alert_type: AlertType;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertListResponse {
  count: number;
  results: BudgetAlert[];
}

export interface AlertDetailResponse extends BudgetAlert {
  message?: string;
}

export interface MarkReadResponse {
  message: string;
  alert: BudgetAlert;
}

export interface ReadAllResponse {
  message: string;
  marked_count: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
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
    throw new Error('La alerta que buscas no existe o fue eliminada.');
  }

  const fallback = { message: 'Error en la operación de alertas' };
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

  const fields = ['is_read', 'alert_type', 'budget'];

  for (const field of fields) {
    if (error[field]) {
      const fieldError = Array.isArray(error[field]) ? error[field][0] : error[field];
      const fieldLabel = {
        is_read: 'Estado de lectura',
        alert_type: 'Tipo de alerta',
        budget: 'Presupuesto',
      }[field] || field;
      errorMessages.push(`${fieldLabel}: ${fieldError}`);
    }
  }

  if (error.non_field_errors) {
    const nonFieldErrors = Array.isArray(error.non_field_errors) ? error.non_field_errors : [error.non_field_errors];
    nonFieldErrors.forEach((err: string) => {
      if (!errorMessages.includes(err)) {
        errorMessages.push(err);
      }
    });
  }

  Object.keys(error).forEach(key => {
    if (!fields.includes(key) && 
        key !== 'message' && 
        key !== 'detail' && 
        key !== 'non_field_errors' &&
        error[key]) {
      const fieldError = Array.isArray(error[key]) ? error[key][0] : error[key];
      if (typeof fieldError === 'string' && !errorMessages.includes(fieldError)) {
        errorMessages.push(`${key}: ${fieldError}`);
      }
    }
  });

  if (errorMessages.length === 0) {
    errorMessages.push('Error en la operación. Verifica que todos los campos obligatorios estén completos.');
  }

  throw new Error(errorMessages.join('. '));
};

export interface AlertFilters {
  unread?: boolean;
  type?: AlertType;
}

const handleFetchError = (error: unknown): never => {
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Error inesperado al procesar la solicitud.');
};

export const alertService = {
  async list(filters?: AlertFilters): Promise<AlertListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.unread !== undefined) {
        params.append('unread', String(filters.unread));
      }
      if (filters?.type) {
        params.append('type', filters.type);
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_BASE_URL}/api/alerts/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async get(id: number): Promise<AlertDetailResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async markAsRead(id: number): Promise<MarkReadResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${id}/read/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async markAllAsRead(): Promise<ReadAllResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/read-all/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${id}/delete/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }
    } catch (error) {
      handleFetchError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },
};

