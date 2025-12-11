import { checkAndHandleAuthError } from '../utils/authErrorHandler';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export type NotificationType = 
  | 'general'
  | 'admin_verification'
  | 'system_alert'
  | 'user_action'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'bill_reminder'
  | 'soat_reminder'
  | 'month_end_reminder'
  | 'custom_reminder';

export interface Notification {
  id: number;
  notification_type: NotificationType;
  notification_type_display: string;
  title: string;
  message: string;
  read: boolean;
  is_read: boolean;
  read_timestamp: string | null;
  is_dismissed: boolean;
  dismissed_at: string | null;
  related_object_id: number | null;
  related_object_type: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  recipient_name: string;
  recipient_username: string;
  user_id: number;
  user_name: string;
}

export interface NotificationListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Notification[];
}

export interface NotificationSummary {
  total: number;
  unread: number;
  recent: Notification[];
  by_type: Array<{ notification_type: NotificationType; count: number }>;
}

export interface CustomReminder {
  id: number;
  title: string;
  message: string;
  reminder_date: string;
  reminder_time: string;
  is_sent: boolean;
  sent_at: string | null;
  notification_id: number | null;
  is_read: boolean;
  read_at: string | null;
  is_past_due_display: boolean;
  user_username: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: number;
  timezone: string;
  timezone_display: string;
  language: 'es' | 'en';
  language_display: string;
  enable_budget_alerts: boolean;
  enable_bill_reminders: boolean;
  enable_soat_reminders: boolean;
  enable_month_end_reminders: boolean;
  enable_custom_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  dismissed?: boolean;
  related_type?: string;
}

const getAuthHeaders = (): HeadersInit => {
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
    throw new Error('La notificación que buscas no existe o fue eliminada.');
  }

  const fallback = { message: 'Error en la operación de notificaciones' };
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

  if (errorMessages.length === 0) {
    errorMessages.push('Error en la operación. Verifica que todos los campos obligatorios estén completos.');
  }

  throw new Error(errorMessages.join('. '));
};

const handleFetchError = (error: unknown): never => {
  if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('network'))) {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
  }
  if (error instanceof Error) {
    throw error;
  }
  throw new Error('Error inesperado al procesar la solicitud.');
};

export const notificationService = {
  async list(filters?: NotificationFilters): Promise<NotificationListResponse> {
    try {
      const params = new URLSearchParams();
      if (filters?.type) {
        params.append('type', filters.type);
      }
      if (filters?.read !== undefined) {
        params.append('read', String(filters.read));
      }
      if (filters?.dismissed !== undefined) {
        params.append('dismissed', String(filters.dismissed));
      }
      if (filters?.related_type) {
        params.append('related_type', filters.related_type);
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      
      // Manejar paginación
      if (data.results && Array.isArray(data.results)) {
        return data as NotificationListResponse;
      }
      
      // Si no hay paginación, crear estructura compatible
      if (Array.isArray(data)) {
        return {
          count: data.length,
          next: null,
          previous: null,
          results: data,
        };
      }

      return data;
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async get(id: number): Promise<Notification> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/${id}/`, {
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

  async markAsRead(id: number): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/${id}/mark_as_read/`, {
        method: 'POST',
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

  async markAllAsRead(): Promise<{ message: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/mark_all_read/`, {
        method: 'POST',
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

  async dismiss(id: number): Promise<{ message: string; notification: Notification }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/${id}/dismiss/`, {
        method: 'POST',
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

  async dismissAll(): Promise<{ message: string; updated_count: number }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/dismiss_all/`, {
        method: 'POST',
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

  async getSummary(): Promise<NotificationSummary> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/notifications/summary/`, {
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

  // Custom Reminders
  async listCustomReminders(filters?: { is_sent?: boolean; is_read?: boolean }): Promise<CustomReminder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.is_sent !== undefined) {
        params.append('is_sent', String(filters.is_sent));
      }
      if (filters?.is_read !== undefined) {
        params.append('is_read', String(filters.is_read));
      }
      const query = params.toString() ? `?${params.toString()}` : '';

      const response = await fetch(`${API_BASE_URL}/api/notifications/custom-reminders/${query}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      
      if (data.results && Array.isArray(data.results)) {
        return data.results;
      }
      if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  async createCustomReminder(data: {
    title: string;
    message: string;
    reminder_date: string;
    reminder_time: string;
  }): Promise<CustomReminder> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/custom-reminders/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
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

  async updateCustomReminder(id: number, data: Partial<CustomReminder>): Promise<CustomReminder> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/custom-reminders/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
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

  async deleteCustomReminder(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/custom-reminders/${id}/`, {
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

  async markCustomReminderAsRead(id: number): Promise<CustomReminder> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/notifications/custom-reminders/${id}/mark_read/`, {
        method: 'POST',
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

  // Preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/preferences/`, {
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

  async updatePreferences(data: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const prefs = await this.getPreferences();
      
      const response = await fetch(`${API_BASE_URL}/api/users/preferences/${prefs.id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
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

  async getTimezones(): Promise<Array<{ value: string; label: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/preferences/timezones/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        await parseError(response);
      }

      const data = await response.json();
      // El backend puede retornar {timezone, display_name} o {value, label}
      if (Array.isArray(data) && data.length > 0) {
        if ('timezone' in data[0]) {
          return data.map((tz: { timezone: string; display_name?: string }) => ({
            value: tz.timezone,
            label: tz.display_name || tz.timezone,
          }));
        }
      }
      return data;
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },
};

