const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': token ? `Token ${token}` : '',
    'Content-Type': 'application/json',
  };
};

import { parseApiError } from '../utils/apiErrorHandler';

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
  
  async getBaseCurrency(): Promise<BaseCurrencyResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/utils/base-currency/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener moneda base');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al obtener moneda base');
    }
  },

  
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
        throw await parseApiError(response, 'Error al establecer moneda base');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al establecer moneda base');
    }
  },
};

