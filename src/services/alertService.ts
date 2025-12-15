import { parseApiError, handleNetworkError } from '../utils/apiErrorHandler';

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

export interface AlertFilters {
  unread?: boolean;
  type?: AlertType;
}

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
        throw await parseApiError(response, 'Error en la operación de alertas');
      }

      return response.json();
    } catch (error) {
      handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de alertas');
      }

      return response.json();
    } catch (error) {
      handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de alertas');
      }

      return response.json();
    } catch (error) {
      handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de alertas');
      }

      return response.json();
    } catch (error) {
      handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de alertas');
      }
    } catch (error) {
      handleNetworkError(error);
      throw error; // Nunca se alcanza, pero satisface TypeScript
    }
  },
};

