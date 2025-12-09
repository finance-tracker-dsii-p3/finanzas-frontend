import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export type CriteriaType = 'description_contains' | 'transaction_type';
export type ActionType = 'assign_category' | 'assign_tag';

export interface Rule {
  id: number;
  name: string;
  criteria_type: CriteriaType;
  criteria_type_display: string;
  keyword?: string | null;
  target_transaction_type?: number | null;
  action_type: ActionType;
  action_type_display: string;
  target_category?: number | null;
  target_category_name?: string | null;
  target_category_color?: string | null;
  target_category_icon?: string | null;
  target_tag?: string | null;
  is_active: boolean;
  order: number;
  applied_count: number;
  created_at: string;
  updated_at: string;
}

export interface RuleCreate {
  name: string;
  criteria_type: CriteriaType;
  keyword?: string | null;
  target_transaction_type?: number | null;
  action_type: ActionType;
  target_category?: number | null;
  target_tag?: string | null;
  is_active?: boolean;
  order?: number;
}

export interface RuleFilters {
  active_only?: boolean;
  criteria_type?: CriteriaType;
  action_type?: ActionType;
  search?: string;
}

export interface RulePreview {
  description?: string;
  transaction_type?: number;
}

export interface RulePreviewResponse {
  would_match: boolean;
  matching_rule?: {
    id: number;
    name: string;
    action_type: ActionType;
    changes: Record<string, string>;
  };
  message: string;
}

export interface RuleStats {
  total_rules: number;
  active_rules: number;
  inactive_rules: number;
  total_applications: number;
  most_used_rule?: {
    id: number;
    name: string;
    applications: number;
  };
  recent_applications?: Array<{
    id: number;
    rule_name: string;
    transaction_id: number;
    applied_at: string;
  }>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Token ${token}` }),
  };
};

const buildQueryParams = (filters?: RuleFilters) => {
  const params = new URLSearchParams();
  if (filters?.active_only) {
    params.append('active_only', 'true');
  }
  if (filters?.criteria_type) {
    params.append('criteria_type', filters.criteria_type);
  }
  if (filters?.action_type) {
    params.append('action_type', filters.action_type);
  }
  if (filters?.search) {
    params.append('search', filters.search);
  }
  return params.toString() ? `?${params.toString()}` : '';
};

const parseError = async (response: Response) => {
  if (response.status >= 500) {
    const error = await response.json().catch(() => ({}));
    const errorMessage = error.detail || error.message || error.error || 'Error interno del servidor';
    throw new Error(`Error del servidor (${response.status}): ${errorMessage}. Por favor, intenta nuevamente más tarde o contacta al administrador.`);
  }

  if (checkAndHandleAuthError(response)) {
    throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
  }

  if (response.status === 403) {
    throw new Error('No tienes permiso para realizar esta acción.');
  }

  if (response.status === 404) {
    throw new Error('Regla no encontrada.');
  }

  const fallback = { message: 'Error en la operación de reglas' };
  let error;
  try {
    error = await response.json();
  } catch {
    error = fallback;
  }

  const errorMessages: string[] = [];

  if (error.message && error.message !== 'Error en la petición' && !errorMessages.includes(error.message)) {
    errorMessages.push(error.message);
  }
  if (error.detail && !errorMessages.includes(error.detail)) {
    errorMessages.push(error.detail);
  }

  const errorDetails = error.details || error;
  const fields = ['name', 'criteria_type', 'keyword', 'target_transaction_type', 'action_type', 'target_category', 'target_tag'];

  for (const field of fields) {
    const fieldError = errorDetails[field] || error[field];
    if (fieldError) {
      const errorText = Array.isArray(fieldError) ? fieldError[0] : fieldError;
      const fieldLabel = {
        name: 'Nombre',
        criteria_type: 'Tipo de criterio',
        keyword: 'Palabra clave',
        target_transaction_type: 'Tipo de transacción',
        action_type: 'Tipo de acción',
        target_category: 'Categoría objetivo',
        target_tag: 'Etiqueta objetivo',
      }[field] || field;
      errorMessages.push(`${fieldLabel}: ${errorText}`);
    }
  }

  if (error.details && typeof error.details === 'object') {
    Object.keys(error.details).forEach(key => {
      if (!fields.includes(key) && key !== 'message' && key !== 'detail' && key !== 'non_field_errors' && error.details[key]) {
        const fieldError = Array.isArray(error.details[key]) ? error.details[key][0] : error.details[key];
        if (typeof fieldError === 'string' && !errorMessages.includes(fieldError)) {
          errorMessages.push(fieldError);
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

  if (errorMessages.length === 0) {
    if (error.suggestion) {
      errorMessages.push(error.suggestion);
    } else {
      errorMessages.push('Error en la operación. Verifica que todos los campos obligatorios estén completos.');
    }
  }

  throw new Error(errorMessages.join('. '));
};

export const ruleService = {
  async getRules(filters?: RuleFilters): Promise<{ count: number; results: Rule[] }> {
    try {
      const queryParams = buildQueryParams(filters);
      const response = await fetch(`${API_BASE_URL}/api/rules/${queryParams}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener reglas');
    }
  },

  async getRule(id: number): Promise<Rule> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener la regla');
    }
  },

  async createRule(rule: RuleCreate): Promise<Rule> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al crear regla');
    }
  },

  async updateRule(id: number, rule: Partial<RuleCreate>): Promise<Rule> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(rule),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al actualizar regla');
    }
  },

  async deleteRule(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al eliminar regla');
    }
  },

  async toggleActive(id: number): Promise<Rule> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/${id}/toggle_active/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      return data.rule;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al cambiar estado de la regla');
    }
  },

  async reorderRules(ruleOrders: { id: number; order: number }[]): Promise<Rule[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/reorder/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rule_orders: ruleOrders }),
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      return data.rules;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al reordenar reglas');
    }
  },

  async previewRule(preview: RulePreview): Promise<RulePreviewResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/preview/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(preview),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al previsualizar regla');
    }
  },

  async getStats(): Promise<RuleStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/stats/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener estadísticas');
    }
  },

  async getAppliedTransactions(ruleId: number): Promise<{ count: number; results: unknown[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/rules/${ruleId}/applied_transactions/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al obtener transacciones afectadas');
    }
  },
};

