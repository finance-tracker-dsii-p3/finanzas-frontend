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

export interface ExchangeRate {
  id: number;
  base_currency: Currency;
  currency: Currency;
  year: number;
  month: number;
  rate: string;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface CreateExchangeRateRequest {
  base_currency: Currency;
  currency: Currency;
  year: number;
  month: number;
  rate: string | number;
  source?: string;
}

export interface UpdateExchangeRateRequest {
  base_currency?: Currency;
  currency?: Currency;
  year?: number;
  month?: number;
  rate?: string | number;
  source?: string;
}

export interface ExchangeRateListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ExchangeRate[];
}

export interface ConvertCurrencyRequest {
  amount: number;
  from: Currency;
  to: Currency;
  date?: string;
}

export interface ConvertCurrencyResponse {
  original_amount: number;
  converted_amount: number;
  exchange_rate: number;
  from_currency: Currency;
  to_currency: Currency;
  warning?: string;
}

export interface CurrentRateRequest {
  currency: Currency;
  base_currency?: Currency;
  date?: string;
}

export interface CurrentRateResponse {
  currency: Currency;
  base_currency: Currency;
  rate: number;
  year: number;
  month: number;
  warning?: string;
}

export const exchangeRateService = {
  
  async list(params?: {
    currency?: Currency;
    base_currency?: Currency;
    year?: number;
    month?: number;
    page?: number;
    page_size?: number;
  }): Promise<ExchangeRateListResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.currency) queryParams.append('currency', params.currency);
      if (params?.base_currency) queryParams.append('base_currency', params.base_currency);
      if (params?.year) queryParams.append('year', params.year.toString());
      if (params?.month) queryParams.append('month', params.month.toString());
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

      const url = `${API_BASE_URL}/api/utils/exchange-rates/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al listar tipos de cambio');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al listar tipos de cambio');
    }
  },

  
  async getById(id: number): Promise<ExchangeRate> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/utils/exchange-rates/${id}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener tipo de cambio');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al obtener tipo de cambio');
    }
  },

  
  async create(data: CreateExchangeRateRequest): Promise<ExchangeRate> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/utils/exchange-rates/`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al crear tipo de cambio');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al crear tipo de cambio');
    }
  },

  
  async update(id: number, data: UpdateExchangeRateRequest): Promise<ExchangeRate> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/utils/exchange-rates/${id}/`, {
        method: 'PATCH',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al actualizar tipo de cambio');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al actualizar tipo de cambio');
    }
  },

  
  async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/utils/exchange-rates/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al eliminar tipo de cambio');
      }
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al eliminar tipo de cambio');
    }
  },

  
  async getCurrentRate(params: CurrentRateRequest): Promise<CurrentRateResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('currency', params.currency);
      if (params.base_currency) queryParams.append('base_currency', params.base_currency);
      if (params.date) queryParams.append('date', params.date);

      const url = `${API_BASE_URL}/api/utils/exchange-rates/current/?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al obtener tipo de cambio vigente');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al obtener tipo de cambio vigente');
    }
  },

  
  async convert(params: ConvertCurrencyRequest): Promise<ConvertCurrencyResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('amount', params.amount.toString());
      queryParams.append('from', params.from);
      queryParams.append('to', params.to);
      if (params.date) queryParams.append('date', params.date);

      const url = `${API_BASE_URL}/api/utils/exchange-rates/convert/?${queryParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw await parseApiError(response, 'Error al convertir moneda');
      }

      return await response.json();
    } catch (error) {
      throw error instanceof Error ? error : new Error('Error desconocido al convertir moneda');
    }
  },
};

