import React, { useState, useEffect } from 'react';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { baseCurrencyService, Currency } from '../services/baseCurrencyService';

interface BaseCurrencySettingsProps {
  onClose?: () => void;
}

const BaseCurrencySettings: React.FC<BaseCurrencySettingsProps> = ({ onClose }) => {
  const [baseCurrency, setBaseCurrency] = useState<Currency>('COP');
  const [availableCurrencies] = useState<Currency[]>(['COP', 'USD', 'EUR']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadBaseCurrency();
  }, []);

  const loadBaseCurrency = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await baseCurrencyService.getBaseCurrency();
      setBaseCurrency(response.base_currency);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar moneda base');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      const response = await baseCurrencyService.setBaseCurrency(baseCurrency);
      setSuccess(response.message || `Moneda base actualizada a ${baseCurrency}`);
      // Recargar la página después de 1 segundo para aplicar los cambios
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar moneda base');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">Moneda Base</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona tu moneda base
          </label>
          <p className="text-xs text-gray-500 mb-4">
            Todos los totales y reportes se mostrarán convertidos a esta moneda. 
            Los valores originales de tus transacciones no se modificarán.
          </p>
          <select
            value={baseCurrency}
            onChange={(e) => setBaseCurrency(e.target.value as Currency)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSaving}
          >
            {availableCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency === 'COP' ? 'Pesos Colombianos (COP)' : 
                 currency === 'USD' ? 'Dólares (USD)' : 
                 'Euros (EUR)'}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseCurrencySettings;

