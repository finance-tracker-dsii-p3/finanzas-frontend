import React, { useState } from 'react';
import { ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import AnalyticsIndicators from '../../components/AnalyticsIndicators';
import ExpensesDonutChart from '../../components/ExpensesDonutChart';
import DailyFlowChart from '../../components/DailyFlowChart';
import CategoryTransactionsModal from '../../components/CategoryTransactionsModal';
import PeriodComparison from '../../components/PeriodComparison';
import BaseCurrencySelector from '../../components/BaseCurrencySelector';
import './analytics.css';

interface AnalyticsPageProps {
  onBack: () => void;
}

const Analytics: React.FC<AnalyticsPageProps> = ({ onBack }) => {
  const [period, setPeriod] = useState('current_month');
  const [mode, setMode] = useState<'base' | 'total'>('total');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setShowTransactionsModal(true);
  };

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleModeToggle = () => {
    setMode(mode === 'base' ? 'total' : 'base');
  };

  const handleCurrencyChange = () => {

    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Dashboard</span>
        </button>
        <h1 className="analytics-title">Analytics Financieros</h1>
      </div>

      <div className="analytics-controls">
        <div className="control-group">
          <label htmlFor="period-select" className="control-label">
            Período
          </label>
          <select
            id="period-select"
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value)}
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
          <label className="control-label">Modo de visualización</label>
          <div className="mode-toggle">
            <button
              onClick={handleModeToggle}
              className={`mode-button ${mode === 'base' ? 'active' : ''}`}
              type="button"
            >
              {mode === 'base' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>Solo Base</span>
            </button>
            <button
              onClick={handleModeToggle}
              className={`mode-button ${mode === 'total' ? 'active' : ''}`}
              type="button"
            >
              {mode === 'total' ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>Base + Impuestos</span>
            </button>
          </div>
        </div>

        <div className="control-group">
          <BaseCurrencySelector onCurrencyChange={handleCurrencyChange} />
        </div>

        <div className="mode-description">
          {mode === 'base'
            ? 'Mostrando montos base (sin impuestos)'
            : 'Mostrando montos totales (con impuestos)'}
        </div>
      </div>

      <div className="analytics-content">
        <div className="indicators-section">
          <AnalyticsIndicators key={`indicators-${refreshKey}`} period={period} mode={mode} />
        </div>

        <div className="charts-section">
          <div className="chart-card">
            <ExpensesDonutChart
              key={`expenses-${refreshKey}`}
              period={period}
              mode={mode}
              onCategoryClick={handleCategoryClick}
            />
          </div>

          <div className="chart-card">
            <DailyFlowChart key={`daily-${refreshKey}`} period={period} mode={mode} />
          </div>
        </div>

        <div className="comparison-section">
          <div className="chart-card">
            <PeriodComparison
              key={`comparison-${refreshKey}`}
              defaultPeriod1="last_month"
              defaultPeriod2="current_month"
              defaultMode={mode}
            />
          </div>
        </div>
      </div>

      {showTransactionsModal && selectedCategory && (
        <CategoryTransactionsModal
          categoryId={selectedCategory}
          period={period}
          mode={mode}
          onClose={() => {
            setShowTransactionsModal(false);
            setSelectedCategory(null);
          }}
        />
      )}
    </div>
  );
};

export default Analytics;

