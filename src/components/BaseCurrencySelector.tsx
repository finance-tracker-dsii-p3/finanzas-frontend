import React, { useState, useEffect, useRef } from 'react';
import { DollarSign, Check, Loader2, ChevronDown } from 'lucide-react';
import { baseCurrencyService, Currency } from '../services/baseCurrencyService';
import './BaseCurrencySelector.css';

interface BaseCurrencySelectorProps {
  onCurrencyChange?: (currency: Currency) => void;
}

const BaseCurrencySelector: React.FC<BaseCurrencySelectorProps> = ({ onCurrencyChange }) => {
  const [baseCurrency, setBaseCurrency] = useState<Currency>('COP');
  const [availableCurrencies, setAvailableCurrencies] = useState<Currency[]>(['COP', 'USD', 'EUR']);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadBaseCurrency();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadBaseCurrency = async () => {
    try {
      const response = await baseCurrencyService.getBaseCurrency();
      setBaseCurrency(response.base_currency);
      setAvailableCurrencies(response.available_currencies);
    } catch (error) {
      console.error('Error al cargar moneda base:', error);
    }
  };

  const handleCurrencyChange = async (newCurrency: Currency) => {
    if (newCurrency === baseCurrency) {
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await baseCurrencyService.setBaseCurrency(newCurrency);
      setBaseCurrency(newCurrency);
      setMessage(response.message);
      setIsOpen(false);

      // Notificar al componente padre
      if (onCurrencyChange) {
        onCurrencyChange(newCurrency);
      }

      // Disparar evento global para que otros componentes se actualicen
      window.dispatchEvent(new CustomEvent('currency-changed', { 
        detail: { currency: newCurrency } 
      }));

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Error al actualizar la moneda');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const getCurrencyLabel = (currency: Currency): string => {
    const labels: Record<Currency, string> = {
      'COP': '$ COP',
      'USD': '$ USD',
      'EUR': '€ EUR',
    };
    return labels[currency];
  };

  return (
    <div className="base-currency-selector" ref={dropdownRef}>
      <label className="currency-label">
        <DollarSign className="w-4 h-4" />
        Moneda base
      </label>
      
      <div className="currency-dropdown">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className="currency-button"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>{getCurrencyLabel(baseCurrency)}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        {isOpen && !loading && (
          <div className="currency-menu">
            {availableCurrencies.map((currency) => (
              <button
                key={currency}
                type="button"
                onClick={() => handleCurrencyChange(currency)}
                className={`currency-option ${currency === baseCurrency ? 'active' : ''}`}
              >
                <span>{getCurrencyLabel(currency)}</span>
                {currency === baseCurrency && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div className={`currency-message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default BaseCurrencySelector;
