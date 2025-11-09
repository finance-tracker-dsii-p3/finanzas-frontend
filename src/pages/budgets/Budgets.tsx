import React, { useState } from 'react';
import { ArrowLeft, Calendar, Plus, Edit2, ArrowRight, AlertCircle, Target } from 'lucide-react';
import NewBudgetModal from '../../components/NewBudgetModal';
import './budgets.css';

interface BudgetCategory {
  category: string;
  limit: number;
  spent: number;
  base: number;
  projection: number;
  color: string;
  includeTaxes: boolean;
}

interface BudgetsProps {
  showTaxes: boolean;
  setShowTaxes: (value: boolean) => void;
  selectedMonth: string;
  setSelectedMonth: (value: string) => void;
  onBack: () => void;
}

const Budgets: React.FC<BudgetsProps> = ({ showTaxes, setShowTaxes, selectedMonth, setSelectedMonth, onBack }) => {
  const [budgetCategories] = useState<BudgetCategory[]>([]);
  const [summary] = useState({
    totalBudgeted: 0,
    totalSpent: 0,
    available: 0
  });
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
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
          <h2 className="text-2xl font-bold text-gray-900">Presupuestos</h2>
          <p className="text-sm text-gray-600 mt-1">Gestiona tus límites mensuales por categoría</p>
        </div>
        <button 
          onClick={() => setShowNewBudgetModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo presupuesto
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-400" />
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showTaxes}
            onChange={(e) => setShowTaxes(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Incluir impuestos en presupuestos</span>
        </label>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Presupuestado</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalBudgeted)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Gastado</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalSpent)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Disponible</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.available)}</p>
          </div>
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Límite</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gastado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progreso</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Proyección</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {budgetCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Establece tus primeros presupuestos!</h3>
                    <p className="text-gray-600 mb-4">No hay presupuestos configurados aún</p>
                    <p className="text-sm text-gray-500 mb-4">Crea límites mensuales por categoría para mantener el control de tus gastos</p>
                  </div>
                </td>
              </tr>
            ) : (
              budgetCategories.map((budget, idx) => {
              const spentValue = showTaxes && budget.includeTaxes ? budget.spent : budget.base;
              const percentage = (spentValue / budget.limit) * 100;
              const projectionPercentage = (budget.projection / budget.limit) * 100;
              const status = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'success';
              
              const getMotivationalMessage = () => {
                if (percentage >= 100) return 'Límite alcanzado';
                if (percentage >= 80) return '¡Cuidado! Cerca del límite';
                if (percentage >= 50) return '¡Vas bien!';
                if (percentage >= 25) return '¡Buen comienzo!';
                return '¡Comencemos!';
              };
              
              return (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.color }}></div>
                      <div>
                        <span className="font-medium text-gray-900">{budget.category}</span>
                        {budget.includeTaxes && (
                          <span className="ml-2 text-xs text-gray-500">(con IVA)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {formatCurrency(budget.limit)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-semibold text-red-600">
                      {formatCurrency(spentValue)}
                    </div>
                    {showTaxes && budget.includeTaxes && (
                      <div className="text-xs text-gray-500">
                        Base: {formatCurrency(budget.base)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${
                            status === 'danger' ? 'bg-red-500' : 
                            status === 'warning' ? 'bg-amber-500' : 
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <span className={`text-sm font-medium min-w-[45px] text-right ${
                        status === 'danger' ? 'text-red-600' : 
                        status === 'warning' ? 'text-amber-600' : 
                        'text-green-600'
                      }`}>
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">{formatCurrency(budget.projection)}</div>
                      <div className={`text-xs ${
                        projectionPercentage > 100 ? 'text-red-600' : 
                        projectionPercentage > 90 ? 'text-amber-600' : 
                        'text-gray-500'
                      }`}>
                        {projectionPercentage.toFixed(0)}% del límite
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        {getMotivationalMessage()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors">
                        Ver movimientos
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-4">
        {budgetCategories.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Establece tus primeros presupuestos!</h3>
            <p className="text-gray-600 mb-4">No hay presupuestos configurados aún</p>
            <p className="text-sm text-gray-500 mb-4">Crea límites mensuales por categoría para mantener el control de tus gastos</p>
          </div>
        ) : (
          budgetCategories.map((budget, idx) => {
          const spentValue = showTaxes && budget.includeTaxes ? budget.spent : budget.base;
          const percentage = (spentValue / budget.limit) * 100;
          const projectionPercentage = (budget.projection / budget.limit) * 100;
          const status = percentage >= 100 ? 'danger' : percentage >= 80 ? 'warning' : 'success';
          
          const getMotivationalMessage = () => {
            if (percentage >= 100) return 'Límite alcanzado';
            if (percentage >= 80) return '¡Cuidado! Cerca del límite';
            if (percentage >= 50) return '¡Vas bien!';
            if (percentage >= 25) return '¡Buen comienzo!';
            return '¡Comencemos!';
          };
          
          return (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: budget.color }}></div>
                  <h4 className="font-semibold text-gray-900">{budget.category}</h4>
                </div>
                <span className={`text-sm font-bold ${
                  status === 'danger' ? 'text-red-600' : 
                  status === 'warning' ? 'text-amber-600' : 
                  'text-green-600'
                }`}>
                  {percentage.toFixed(0)}%
                </span>
              </div>
              
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden mb-3">
                <div 
                  className={`h-full rounded-full transition-all ${
                    status === 'danger' ? 'bg-red-500' : 
                    status === 'warning' ? 'bg-amber-500' : 
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                ></div>
              </div>
              
              <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
                <div>
                  <p className="text-gray-600">Límite</p>
                  <p className="font-semibold">{formatCurrency(budget.limit)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Gastado</p>
                  <p className="font-semibold text-red-600">{formatCurrency(spentValue)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Proyección</p>
                  <p className={`font-semibold ${
                    projectionPercentage > 100 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {formatCurrency(budget.projection)}
                  </p>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-sm text-blue-600 font-medium text-center">
                  {getMotivationalMessage()}
                </p>
              </div>
              
              <div className="flex gap-2">
                <button className="flex-1 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1 py-2 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                  Ver movimientos
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
          })
        )}
      </div>

      {budgetCategories.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Consejo de ahorro</h4>
              <p className="text-sm text-blue-800">
                Recuerda que los presupuestos {showTaxes ? 'incluyen' : 'excluyen'} impuestos según tu configuración.
              </p>
            </div>
          </div>
        </div>
      )}

      {showNewBudgetModal && (
        <NewBudgetModal
          onClose={() => setShowNewBudgetModal(false)}
          selectedMonth={selectedMonth}
        />
      )}
    </div>
  );
};

export default Budgets;

