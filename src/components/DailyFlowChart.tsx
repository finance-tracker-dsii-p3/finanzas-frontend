import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { analyticsService, DailyFlowChartResponse } from '../services/analyticsService';
import { formatMoney, Currency } from '../utils/currencyUtils';
import './DailyFlowChart.css';

interface DailyFlowChartProps {
  period: string;
  mode: 'base' | 'total';
}

interface ChartDataPoint {
  date: string;
  ingresos: number;
  gastos: number;
  balance: number;
}

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}

const DailyFlowChart: React.FC<DailyFlowChartProps> = ({ period, mode }) => {
  const [chartData, setChartData] = useState<DailyFlowChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getDailyFlowChart(period, mode);
      if (response.success) {
        setChartData(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar gráfico');
    } finally {
      setLoading(false);
    }
  }, [period, mode]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  const formatCurrency = (value: number, currency: Currency = 'COP'): string => {
    return formatMoney(value, currency);
  };

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{`Fecha: ${label}`}</p>
            {payload.map((entry: TooltipPayload, index: number) => (
            <p key={index} style={{ color: entry.color }} className="tooltip-item">
              {`${entry.name}: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="chart-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Cargando gráfico...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-error">
        <p className="text-red-600">{error}</p>
        <button onClick={loadChartData} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  if (!chartData || chartData.dates.length === 0) {
    return (
      <div className="chart-empty">
        <p className="text-gray-500">No hay datos para este período</p>
      </div>
    );
  }

  const formattedData: ChartDataPoint[] = chartData.dates.map((date: string, index: number) => ({
    date: new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
    }),
    ingresos: chartData.series.income.data[index],
    gastos: chartData.series.expenses.data[index],
    balance: chartData.series.balance.data[index],
  }));

  return (
    <div className="daily-flow-chart">
      <div className="chart-header">
        <h3 className="chart-title">Flujo Diario</h3>
        <div className="chart-summary">
          <div className="summary-item">
            <span className="summary-label">Ingresos totales: </span>
            <span className="summary-value income-value">
              {formatCurrency(chartData.summary.total_income)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Gastos totales: </span>
            <span className="summary-value expenses-value">
              {formatCurrency(chartData.summary.total_expenses)}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Balance final: </span>
            <span className={`summary-value ${chartData.summary.final_balance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
              {formatCurrency(chartData.summary.final_balance)}
            </span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={formattedData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
            interval="preserveStartEnd"
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            stroke="#6b7280"
            tickFormatter={(value) => {
              if (value >= 1000000) {
                return `$${(value / 1000000).toFixed(1)}M`;
              }
              if (value >= 1000) {
                return `$${(value / 1000).toFixed(0)}K`;
              }
              return `$${value}`;
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                ingresos: chartData.series.income.name,
                gastos: chartData.series.expenses.name,
                balance: chartData.series.balance.name,
              };
              return labels[value] || value;
            }}
          />
          <Line
            type="monotone"
            dataKey="ingresos"
            stroke={chartData.series.income.color}
            strokeWidth={2}
            name="ingresos"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="gastos"
            stroke={chartData.series.expenses.color}
            strokeWidth={2}
            name="gastos"
            dot={false}
            activeDot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={chartData.series.balance.color}
            strokeWidth={2}
            name="balance"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DailyFlowChart;

