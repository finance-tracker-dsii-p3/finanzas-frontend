import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { analyticsService, IndicatorsResponse } from '../services/analyticsService';
import { formatMoney, Currency } from '../utils/currencyUtils';
import './AnalyticsIndicators.css';

interface AnalyticsIndicatorsProps {
  period: string;
  mode: 'base' | 'total';
}

const AnalyticsIndicators: React.FC<AnalyticsIndicatorsProps> = ({ period, mode }) => {
  const [indicators, setIndicators] = useState<IndicatorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadIndicators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getIndicators(period, mode);
      if (response.success) {
        setIndicators(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar indicadores');
    } finally {
      setLoading(false);
    }
  }, [period, mode]);

  useEffect(() => {
    loadIndicators();
  }, [loadIndicators]);

  useEffect(() => {
    const handleCurrencyChange = () => {
      loadIndicators();
    };

    window.addEventListener('currency-changed', handleCurrencyChange);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, [loadIndicators]);

  if (loading) {
    return (
      <div className="analytics-indicators-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Cargando indicadores...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-indicators-error">
        <p className="text-red-600">{error}</p>
        <button onClick={loadIndicators} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  if (!indicators) {
    return (
      <div className="analytics-indicators-empty">
        <p className="text-gray-500">No hay datos disponibles para este período</p>
      </div>
    );
  }

  return (
    <div className="analytics-indicators">
      <div className="indicator-card income-card">
        <div className="indicator-header">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <span className="indicator-label">Ingresos</span>
        </div>
        <div className="indicator-amount income-amount">
          {formatMoney(indicators.income.amount, indicators.currency as Currency)}
        </div>
        <div className="indicator-count">
          {indicators.income.count} transacciones
        </div>
      </div>

      <div className="indicator-card expenses-card">
        <div className="indicator-header">
          <TrendingDown className="w-5 h-5 text-red-600" />
          <span className="indicator-label">Gastos</span>
        </div>
        <div className="indicator-amount expenses-amount">
          {formatMoney(indicators.expenses.amount, indicators.currency as Currency)}
        </div>
        <div className="indicator-count">
          {indicators.expenses.count} transacciones
        </div>
      </div>

      <div className={`indicator-card balance-card ${indicators.balance.is_positive ? 'positive' : 'negative'}`}>
        <div className="indicator-header">
          <DollarSign className={`w-5 h-5 ${indicators.balance.is_positive ? 'text-blue-600' : 'text-orange-600'}`} />
          <span className="indicator-label">Balance</span>
        </div>
        <div className={`indicator-amount ${indicators.balance.is_positive ? 'balance-positive' : 'balance-negative'}`}>
          {formatMoney(indicators.balance.amount, indicators.currency as Currency)}
        </div>
        <div className="indicator-count">
          {indicators.period.days} días
        </div>
      </div>
    </div>
  );
};

export default AnalyticsIndicators;

