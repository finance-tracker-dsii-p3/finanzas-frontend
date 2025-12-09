import React, { useState } from 'react';
import { ArrowLeft, Download, FileText, Target, Activity, PieChart } from 'lucide-react';
import { formatMoney, Currency } from '../../utils/currencyUtils';
import './reports.css';

interface ReportsProps {
  showTaxes: boolean;
  setShowTaxes: (value: boolean) => void;
  onBack: () => void;
}

interface TopCategory {
  name: string;
  amount: number;
  percentage: number;
}

interface MonthComparison {
  month: string;
  income: number;
  expense: number;
}

const Reports: React.FC<ReportsProps> = ({ showTaxes, setShowTaxes, onBack }) => {
  const [reportPeriod, setReportPeriod] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [compareMode, setCompareMode] = useState(false);
  const [topCategories] = useState<TopCategory[]>([]);
  const [monthComparison] = useState<MonthComparison[]>([]);
  const [summary] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    savingsRate: 0
  });
  const [cashFlow] = useState<number[]>([]);

  const formatCurrency = (amount: number, currency: Currency = 'COP'): string => {
    if (isNaN(amount)) return formatMoney(0, currency);
    return formatMoney(Math.abs(amount), currency);
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Volver al Dashboard</span>
      </button>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reportes y Análisis</h2>
          <p className="text-sm text-gray-600 mt-1">Visualiza tendencias y compara períodos</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {['month', 'quarter', 'year', 'custom'].map(period => (
            <button
              key={period}
              onClick={() => setReportPeriod(period as 'month' | 'quarter' | 'year' | 'custom')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                reportPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {period === 'month' ? 'Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Año' : 'Personalizado'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={compareMode}
            onChange={(e) => setCompareMode(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Comparar períodos</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showTaxes}
            onChange={(e) => setShowTaxes(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Incluir impuestos</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Ingresos</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(summary.income)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Gastos</p>
          <p className="text-xl font-bold text-red-600">{formatCurrency(summary.expenses)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Balance</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.balance)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Tasa de ahorro</p>
          <p className="text-xl font-bold text-purple-600">{summary.savingsRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Top 5 Categorías de Gastos
          </h3>
          <div className="space-y-4">
            {topCategories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay datos disponibles</h4>
                <p className="text-gray-600">Comienza a registrar movimientos para ver análisis de categorías</p>
              </div>
            ) : (
              topCategories.map((cat, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900">{cat.name}</span>
                    <span className="text-gray-600">{formatCurrency(cat.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all"
                        style={{ width: `${cat.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 min-w-[45px] text-right">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Flujo de Caja Acumulado
          </h3>
          {cashFlow.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p className="text-sm">No hay datos disponibles</p>
            </div>
          ) : (
            <>
              <div className="h-64 flex items-end justify-between gap-1">
                {cashFlow.map((value, i) => {
                  const maxValue = Math.max(...cashFlow, 1);
                  const height = (value / maxValue) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer">
                      <div 
                        className="bg-green-500 hover:bg-green-600 transition-colors rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {compareMode && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Comparación Mensual
          </h3>
          {monthComparison.length === 0 ? (
            <div className="h-80 flex items-center justify-center text-gray-400">
              <p className="text-sm">No hay datos disponibles</p>
            </div>
          ) : (
            <div className="h-80 flex items-end justify-around gap-8">
              {monthComparison.map((month, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-4">
                <div className="w-full flex items-end justify-center gap-2 h-64">
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div 
                      className="w-full bg-green-500 hover:bg-green-600 transition-colors rounded-t cursor-pointer"
                      style={{ height: `${(month.income / 5000000) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-600">Ingresos</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div 
                      className="w-full bg-red-500 hover:bg-red-600 transition-colors rounded-t cursor-pointer"
                      style={{ height: `${(month.expense / 5000000) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-600">Gastos</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-gray-900">{month.month}</p>
                  <p className="text-xs text-gray-600">Balance: {formatCurrency(month.income - month.expense)}</p>
                </div>
              </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default Reports;

