import React, { useState, useEffect, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Loader2 } from 'lucide-react';
import { analyticsService, ExpensesChartResponse, ChartCategoryData } from '../services/analyticsService';
import { formatMoney, Currency } from '../utils/currencyUtils';
import './ExpensesDonutChart.css';

interface ExpensesDonutChartProps {
  period: string;
  mode: 'base' | 'total';
  onCategoryClick?: (categoryId: string) => void;
}

interface PieDataItem {
  name: string;
  value: number;
  percentage: number;
  categoryId: string;
  color: string;
  formatted_amount: string;
}

interface TooltipPayload {
  name: string;
  value: number;
  payload: PieDataItem;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
}

interface LabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

const ExpensesDonutChart: React.FC<ExpensesDonutChartProps> = ({ period, mode, onCategoryClick }) => {
  const [chartData, setChartData] = useState<ExpensesChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChartData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getExpensesChart(period, mode);
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

  useEffect(() => {
    const handleCurrencyChange = () => {
      loadChartData();
    };

    window.addEventListener('currency-changed', handleCurrencyChange);

    return () => {
      window.removeEventListener('currency-changed', handleCurrencyChange);
    };
  }, [loadChartData]);

  const handleClick = (data: PieDataItem) => {
    if (onCategoryClick && data.categoryId !== 'others' && data.categoryId !== 'uncategorized') {
      onCategoryClick(data.categoryId);
    }
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as PieDataItem;
      const currency = (chartData?.currency as Currency) || 'COP';
      return (
        <div className="chart-tooltip">
          <p className="tooltip-name">{data.name}</p>
          <p className="tooltip-amount">{formatMoney(data.value, currency)}</p>
          <p className="tooltip-percentage">{data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, percent = 0 }: LabelProps) => {
    if (!percent || percent < 0.05) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="chart-label"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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

  if (!chartData || chartData.chart_data.length === 0) {
    return (
      <div className="chart-empty">
        <p className="text-gray-500">No hay gastos categorizados en este período</p>
      </div>
    );
  }

  const pieData: PieDataItem[] = chartData.chart_data.map((item: ChartCategoryData) => ({
    name: item.name,
    value: item.amount,
    percentage: item.percentage,
    categoryId: item.category_id,
    color: item.color,
    formatted_amount: item.formatted_amount,
  }));

  return (
    <div className="expenses-donut-chart">
      <div className="chart-header">
        <h3 className="chart-title">Gastos por Categoría</h3>
        <p className="chart-subtitle">
          {chartData.period_summary} • Total: {formatMoney(chartData.total_expenses, (chartData.currency as Currency) || 'COP')}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
          <Pie
            data={pieData as unknown as Array<Record<string, unknown>>}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel as (props: LabelProps) => React.ReactNode}
            outerRadius={120}
            innerRadius={60}
            fill="#8884d8"
            dataKey="value"
            onClick={(data: unknown) => {
              if (data && typeof data === 'object' && 'categoryId' in data) {
                handleClick(data as PieDataItem);
              }
            }}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          >
            {pieData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={pieData[index].color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => {
              const item = pieData.find((d) => d.name === value);
              return `${value} (${item?.percentage.toFixed(1)}%)`;
            }}
            onClick={(data: { value?: string }) => {
              if (data.value) {
                const item = pieData.find((d) => d.name === data.value);
                if (item) {
                  handleClick(item);
                }
              }
            }}
            style={{ cursor: onCategoryClick ? 'pointer' : 'default' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {chartData.others_data && chartData.others_data.length > 0 && (
        <div className="others-section">
          <p className="others-title">Categorías en "Otros":</p>
          <ul className="others-list">
            {chartData.others_data.map((item: ChartCategoryData) => (
              <li key={item.category_id} className="others-item">
                <span className="others-name">{item.name}</span>
                <span className="others-amount">{formatMoney(item.amount, (chartData.currency as Currency) || 'COP')}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ExpensesDonutChart;

