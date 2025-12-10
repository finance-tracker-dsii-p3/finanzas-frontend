const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Token ${token}` : '',
    'Content-Type': 'application/json',
  };
};

const parseError = async (response: Response, defaultMessage: string): Promise<Error> => {
  try {
    const data = await response.json();
    if (data.detail) return new Error(data.detail);
    if (data.error) return new Error(data.error);
    if (data.message) return new Error(data.message);
    if (typeof data === 'string') return new Error(data);
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      return new Error(data.non_field_errors[0]);
    }
    const firstKey = Object.keys(data)[0];
    if (firstKey && Array.isArray(data[firstKey]) && data[firstKey].length > 0) {
      return new Error(`${firstKey}: ${data[firstKey][0]}`);
    }
  } catch {
    // Si no se puede parsear el JSON, usar el mensaje por defecto
  }
  return new Error(defaultMessage);
};

export type Currency = 'COP' | 'USD' | 'EUR';

export interface BaseCurrencyResponse {
  base_currency: Currency;
  updated_at: string | null;
  available_currencies: Currency[];
}

export interface SetBaseCurrencyRequest {
  base_currency: Currency;
}

export interface SetBaseCurrencyResponse {
  base_currency: Currency;
  updated_at: string;
  message: string;
}

export const baseCurrencyService = {
  /**
   * Obtiene la moneda base configurada del usuario
   */
  async getBaseCurrency(): Promise<BaseCurrencyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/utils/base-currency/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al obtener moneda base');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al obtener moneda base');
    }
  },

  /**
   * Establece o actualiza la moneda base del usuario
   */
  async setBaseCurrency(currency: Currency): Promise<SetBaseCurrencyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/utils/base-currency/set_base/`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base_currency: currency }),
      });

      if (!response.ok) {
        throw await parseError(response, 'Error al establecer moneda base');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al establecer moneda base');
    }
  },
};

