export type Currency = 'COP' | 'USD' | 'EUR';

export interface ExchangeRateResponse {
  from: Currency;
  to: Currency;
  rate: number;
  last_updated: string;
}

export interface CurrencyConversionResponse {
  original_amount: number;
  original_currency: Currency;
  converted_amount: number;
  converted_currency: Currency;
  exchange_rate: number;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export const formatMoney = (centavos: number, currency: Currency = 'COP'): string => {
  const amount = centavos / 100;
  
  const formatters: Record<Currency, Intl.NumberFormat> = {
    'COP': new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
    'USD': new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    'EUR': new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  };
  
  const formatter = formatters[currency];
  if (!formatter) {
    return `${amount.toFixed(2)} ${currency}`;
  }
  
  return formatter.format(amount);
};

export const formatMoneyFromPesos = (pesos: number, currency: Currency = 'COP'): string => {
  const formatters: Record<Currency, Intl.NumberFormat> = {
    'COP': new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }),
    'USD': new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }),
    'EUR': new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  };
  
  const formatter = formatters[currency];
  if (!formatter) {
    return `${pesos.toFixed(2)} ${currency}`;
  }
  
  return formatter.format(pesos);
};

export const getCurrencyDisplay = (currency: Currency): string => {
  const displays: Record<Currency, string> = {
    'COP': 'Pesos Colombianos (COP)',
    'USD': 'Dólares (USD)',
    'EUR': 'Euros (EUR)'
  };
  return displays[currency] || currency;
};

export const getExchangeRate = async (
  from: Currency,
  to: Currency,
  token: string
): Promise<ExchangeRateResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/utils/currency/exchange-rate/?from=${from}&to=${to}`,
    {
      headers: {
        'Authorization': `Token ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Error al obtener tasa de cambio: ${response.statusText}`);
  }

  return response.json();
};

export const convertCurrency = async (
  amount: number,
  from: Currency,
  to: Currency,
  token: string
): Promise<CurrencyConversionResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/api/utils/currency/convert/?amount=${amount}&from=${from}&to=${to}`,
    {
      headers: {
        'Authorization': `Token ${token}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Error al convertir moneda: ${response.statusText}`);
  }

  return response.json();
};

export const pesosToCents = (pesos: number): number => {
  return Math.round(pesos * 100);
};

export const centsToPesos = (centavos: number): number => {
  return centavos / 100;
};

