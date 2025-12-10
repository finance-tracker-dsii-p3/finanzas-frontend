import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { formatMoney, Currency } from '../utils/currencyUtils';
import './PeriodComparison.css';

interface PeriodComparisonProps {
  defaultPeriod1?: string;
  defaultPeriod2?: string;
  defaultMode?: 'base' | 'total';
}

const PeriodComparison: React.FC<PeriodComparisonProps> = ({
  defaultPeriod1 = 'last_month',
  defaultPeriod2 = 'current_month',
  defaultMode = 'total',
}) => {
  const [period1, setPeriod1] = useState(defaultPeriod1);
  const [period2, setPeriod2] = useState(defaultPeriod2);
  const [mode, setMode] = useState<'base' | 'total'>(defaultMode);
  const [comparison, setComparison] = useState<{
    comparison_summary: {
      period1: { name: string; date_range: string; has_data: boolean; transactions_count: number };
      period2: { name: string; date_range: string; has_data: boolean; transactions_count: number };
      can_compare: boolean;
      mode: string;
    };
    period_data: {
      period1: {
        income: { amount: number; count: number; formatted: string };
        expenses: { amount: number; count: number; formatted: string };
        balance: { amount: number; formatted: string; is_positive: boolean };
      };
      period2: {
        income: { amount: number; count: number; formatted: string };
        expenses: { amount: number; count: number; formatted: string };
        balance: { amount: number; formatted: string; is_positive: boolean };
      };
    };
    differences: {
      income: {
        absolute: number;
        percentage: number;
        is_increase: boolean;
        is_significant: boolean;
        formatted_absolute: string;
        summary: string;
      };
      expenses: {
        absolute: number;
        percentage: number;
        is_increase: boolean;
        is_significant: boolean;
        formatted_absolute: string;
        summary: string;
      };
      balance: {
        absolute: number;
        percentage: number;
        is_increase: boolean;
        is_significant: boolean;
        formatted_absolute: string;
        summary: string;
      };
    };
    insights?: {
      messages: string[];
      alert_level: 'info' | 'warning' | 'success' | 'error';
      has_significant_changes: boolean;
    };
    metadata?: {
      currency?: string;
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComparison = useCallback(async () => {
    if (!period1 || !period2) return;

    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.comparePeriods(period1, period2, mode);

      if (response.success && response.data) {
        setComparison(response.data);
        setError(null);
      } else {
        const errorMessage = response.error || 'No se pudo realizar la comparación';
        setError(errorMessage);
        setComparison(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar comparación';
      setError(errorMessage);
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [period1, period2, mode]);

  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  useEffect(() => {
    const handleCurrencyChange = () => {
      loadComparison();
    };

    window.addEventListener('currency-changed', handleCurrencyChange);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, [loadComparison]);

  const handleModeToggle = () => {
    setMode(mode === 'base' ? 'total' : 'base');
  };

  if (loading) {
    return (
      <div className="comparison-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Cargando comparación...</p>
      </div>
    );
  }

  return (
    <div className="period-comparison">
      <div className="comparison-header">
        <h2 className="comparison-title">Comparación de Períodos</h2>
        <div className="comparison-controls">
          <div className="control-group">
            <label htmlFor="period1-select" className="control-label">
              Período 1
            </label>
            <select
              id="period1-select"
              value={period1}
              onChange={(e) => setPeriod1(e.target.value)}
              className="period-select"
            >
              <option value="last_month">Mes anterior</option>
              <option value="current_month">Mes actual</option>
              <option value="current_year">Año actual</option>
              <option value="last_7_days">Últimos 7 días</option>
              <option value="last_30_days">Últimos 30 días</option>
            </select>
          </div>

          <ArrowRight className="w-5 h-5 text-gray-400 comparison-arrow" />

          <div className="control-group">
            <label htmlFor="period2-select" className="control-label">
              Período 2
            </label>
            <select
              id="period2-select"
              value={period2}
              onChange={(e) => setPeriod2(e.target.value)}
              className="period-select"
            >
              <option value="current_month">Mes actual</option>
              <option value="last_month">Mes anterior</option>
              <option value="current_year">Año actual</option>
              <option value="last_7_days">Últimos 7 días</option>
              <option value="last_30_days">Últimos 30 días</option>
            </select>
          </div>

          <div className="control-group">
            <label className="control-label">Modo</label>
            <div className="mode-toggle">
              <button
                onClick={handleModeToggle}
                className={`mode-button ${mode === 'base' ? 'active' : ''}`}
                type="button"
              >
                Solo Base
              </button>
              <button
                onClick={handleModeToggle}
                className={`mode-button ${mode === 'total' ? 'active' : ''}`}
                type="button"
              >
                Base + Impuestos
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && !comparison && (
        <div className="comparison-error">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="error-title">Error</p>
            <p className="error-message">{error}</p>
            <p className="error-suggestion">
              Verifica que ambos períodos tengan transacciones registradas.
            </p>
          </div>
        </div>
      )}

      {comparison && !comparison.comparison_summary.can_compare && (
        <div className="comparison-warning">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p>
            {error || 'No se puede realizar la comparación. Verifica que ambos períodos tengan datos.'}
          </p>
        </div>
      )}

      {comparison && comparison.comparison_summary.can_compare && (
        <>
          <div className="periods-grid">
            <div className="period-card">
              <h3 className="period-name">{comparison.comparison_summary.period1.name}</h3>
              <p className="period-range">{comparison.comparison_summary.period1.date_range}</p>
              <div className="period-metrics">
                <div className="metric-item">
                  <span className="metric-label">Ingresos:</span>
                  <span className="metric-value income-value">
                    {formatMoney(comparison.period_data.period1.income.amount, (comparison.metadata?.currency as Currency) || 'COP')}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Gastos:</span>
                  <span className="metric-value expenses-value">
                    {formatMoney(comparison.period_data.period1.expenses.amount, (comparison.metadata?.currency as Currency) || 'COP')}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Balance:</span>
                  <span className={`metric-value ${comparison.period_data.period1.balance.is_positive ? 'balance-positive' : 'balance-negative'}`}>
                    {formatMoney(comparison.period_data.period1.balance.amount, (comparison.metadata?.currency as Currency) || 'COP')}
                  </span>
                </div>
                <div className="metric-count">
                  {comparison.comparison_summary.period1.transactions_count} transacciones
                </div>
              </div>
            </div>

            <div className="period-card">
              <h3 className="period-name">{comparison.comparison_summary.period2.name}</h3>
              <p className="period-range">{comparison.comparison_summary.period2.date_range}</p>
              <div className="period-metrics">
                <div className="metric-item">
                  <span className="metric-label">Ingresos:</span>
                  <span className="metric-value income-value">
                    {formatMoney(comparison.period_data.period2.income.amount, (comparison.metadata?.currency as Currency) || 'COP')}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Gastos:</span>
                  <span className="metric-value expenses-value">
                    {formatMoney(comparison.period_data.period2.expenses.amount, (comparison.metadata?.currency as Currency) || 'COP')}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Balance:</span>
                  <span className={`metric-value ${comparison.period_data.period2.balance.is_positive ? 'balance-positive' : 'balance-negative'}`}>
                    {formatMoney(comparison.period_data.period2.balance.amount, (comparison.metadata?.currency as Currency) || 'COP')}
                  </span>
                </div>
                <div className="metric-count">
                  {comparison.comparison_summary.period2.transactions_count} transacciones
                </div>
              </div>
            </div>
          </div>

          <div className="differences-section">
            <h3 className="differences-title">Diferencias</h3>
            <div className="differences-grid">
              <ComparisonMetric
                label="Ingresos"
                difference={comparison.differences.income}
                positiveColor="green"
                currency={(comparison.metadata?.currency as Currency) || 'COP'}
              />
              <ComparisonMetric
                label="Gastos"
                difference={comparison.differences.expenses}
                positiveColor="red"
                invertLogic
                currency={(comparison.metadata?.currency as Currency) || 'COP'}
              />
              <ComparisonMetric
                label="Balance"
                difference={comparison.differences.balance}
                positiveColor="blue"
                currency={(comparison.metadata?.currency as Currency) || 'COP'}
              />
            </div>
          </div>

          {comparison.insights && comparison.insights.messages.length > 0 && (
            <div className={`insights-section insights-${comparison.insights.alert_level}`}>
              <h4 className="insights-title">Análisis</h4>
              <ul className="insights-list">
                {comparison.insights.messages.map((message, index) => (
                  <li key={index} className="insight-item">
                    {message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
};

interface ComparisonMetricProps {
  label: string;
  difference: {
    absolute: number;
    percentage: number;
    is_increase: boolean;
    is_significant: boolean;
    formatted_absolute: string;
    summary: string;
  };
  positiveColor: 'green' | 'red' | 'blue';
  invertLogic?: boolean;
  currency: Currency;
}

const ComparisonMetric: React.FC<ComparisonMetricProps> = ({
  label,
  difference,
  positiveColor,
  invertLogic = false,
  currency,
}) => {
  const isPositive = invertLogic ? !difference.is_increase : difference.is_increase;
  
  const colorClass =
    positiveColor === 'green'
      ? isPositive
        ? 'text-green-600'
        : 'text-red-600'
      : positiveColor === 'red'
      ? isPositive
        ? 'text-red-600'
        : 'text-green-600'
      : isPositive
      ? 'text-blue-600'
      : 'text-orange-600';

  const bgColorClass =
    positiveColor === 'green'
      ? isPositive
        ? 'bg-green-50 border-green-200'
        : 'bg-red-50 border-red-200'
      : positiveColor === 'red'
      ? isPositive
        ? 'bg-red-50 border-red-200'
        : 'bg-green-50 border-green-200'
      : isPositive
      ? 'bg-blue-50 border-blue-200'
      : 'bg-orange-50 border-orange-200';

  return (
    <div className={`difference-card ${bgColorClass}`}>
      <div className="difference-label">{label}</div>
      <div className="difference-content">
        {difference.is_increase ? (
          <TrendingUp className="w-5 h-5 text-green-500" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-500" />
        )}
        <span className={`difference-percentage ${colorClass}`}>
          {difference.percentage > 0 ? '+' : ''}
          {difference.percentage.toFixed(1)}%
        </span>
      </div>
      <div className={`difference-absolute ${colorClass}`}>
        {difference.is_increase ? '+' : '-'}
        {formatMoney(Math.abs(difference.absolute), currency)}
      </div>
      {difference.is_significant && (
        <div className="difference-significant">Cambio significativo</div>
      )}
    </div>
  );
};

export default PeriodComparison;

