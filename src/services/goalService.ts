import { parseApiError, handleNetworkError } from '../utils/apiErrorHandler';

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

export const goalService = {
  async list(): Promise<Goal[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de metas');
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
      throw handleNetworkError(error);
    }
  },

  async get(id: number): Promise<Goal> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de metas');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de metas');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
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
        throw await parseApiError(response, 'Error en la operación de metas');
      }

      return response.json();
    } catch (error) {
      throw handleNetworkError(error);
    }
  },

  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/goals/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error en la operación de metas');
      }
    } catch (error) {
      throw handleNetworkError(error);
    }
  },
};

