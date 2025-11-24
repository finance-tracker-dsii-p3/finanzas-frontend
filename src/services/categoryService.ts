import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export type CategoryType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  type: CategoryType;
  type_display: string;
  color: string;
  icon: string;
  icon_display: string;
  is_active: boolean;
  order: number;
  usage_count?: number;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
  related_data?: Record<string, number>;
}

export interface CategoryFilters {
  type?: CategoryType;
  active_only?: boolean;
}

export interface CategoryPayload {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
  is_active?: boolean;
  order?: number;
}

export interface CategoryUpdatePayload extends Omit<CategoryPayload, 'type'> {
  type?: never;
}

export interface CategoryDeletionValidation {
  can_delete: boolean;
  requires_reassignment: boolean;
  warnings: string[];
  errors: string[];
  related_data?: Record<string, number>;
}

export interface CategoryStats {
  total_income: number;
  total_expense: number;
  active_income: number;
  active_expense: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
};

const buildQueryParams = (filters?: CategoryFilters) => {
  const params = new URLSearchParams();
  if (filters?.type) {
    params.append('type', filters.type);
  }
  if (filters?.active_only !== undefined) {
    params.append('active_only', String(filters.active_only));
  }
  return params.toString() ? `?${params.toString()}` : '';
};

const parseError = async (response: Response) => {
  // Manejar errores de autenticación primero
  if (response.status === 401) {
    checkAndHandleAuthError(response);
  }

  const fallback = { message: 'Error en la operación de categorías' };
  const error = await response.json().catch(() => fallback);
  const detail =
    error.message ||
    error.detail ||
    error.non_field_errors?.[0] ||
    error.errors?.[0] ||
    fallback.message;
  throw new Error(detail);
};

export const categoryService = {
  async list(filters?: CategoryFilters): Promise<Category[]> {
    const query = buildQueryParams(filters);
    const response = await fetch(`${API_BASE_URL}/api/categories/${query}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async get(id: number): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async create(payload: CategoryPayload): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async update(id: number, payload: CategoryUpdatePayload): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async toggleActive(id: number): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}/toggle_active/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseError(response);
    }
  },

  async deleteWithReassignment(id: number, targetCategoryId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}/delete_with_reassignment/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ target_category_id: targetCategoryId }),
    });

    if (!response.ok) {
      await parseError(response);
    }
  },

  async validateDeletion(id: number): Promise<CategoryDeletionValidation> {
    const response = await fetch(`${API_BASE_URL}/api/categories/${id}/validate_deletion/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async getStats(): Promise<CategoryStats> {
    const response = await fetch(`${API_BASE_URL}/api/categories/stats/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async createDefaults(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/api/categories/create_defaults/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      await parseError(response);
    }

    return response.json();
  },

  async bulkUpdateOrder(categoryOrders: { id: number; order: number }[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/categories/bulk_update_order/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ categories: categoryOrders }),
    });

    if (!response.ok) {
      await parseError(response);
    }
  },
};


