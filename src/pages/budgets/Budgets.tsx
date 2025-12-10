import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  Target,
  TrendingUp,
  TrendingDown,
  Eye,
  X,
  RefreshCcw,
} from 'lucide-react';
import { useBudgets } from '../../context/BudgetContext';
import { BudgetListItem, BudgetDetail } from '../../services/budgetService';
import NewBudgetModal from '../../components/NewBudgetModal';
import { formatMoneyFromPesos, Currency } from '../../utils/currencyUtils';
import './budgets.css';

interface BudgetsProps {
  onBack: () => void;
  onViewMovements?: (categoryId: number) => void;
}

const Budgets: React.FC<BudgetsProps> = ({ onBack, onViewMovements }) => {
  const {
    budgets,
    isLoading,
    error,
    refreshBudgets,
    deleteBudget,
    toggleBudget,
    getBudgetDetail,
  } = useBudgets();

  useEffect(() => {
  }, [budgets]);

  const [budgetToEdit, setBudgetToEdit] = useState<BudgetListItem | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetListItem | null>(null);
  const [budgetDetail, setBudgetDetail] = useState<BudgetDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggling, setIsToggling] = useState<number | null>(null);
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    refreshBudgets({ active_only: activeOnly, period: 'monthly' });
  }, [activeOnly, refreshBudgets]);

  useEffect(() => {
    const handleTransactionUpdate = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      try {
        await refreshBudgets({ active_only: activeOnly, period: 'monthly' });
      } catch {
        void 0;
      }
    };

    window.addEventListener('transactionCreated', handleTransactionUpdate);
    window.addEventListener('transactionUpdated', handleTransactionUpdate);
    window.addEventListener('transactionDeleted', handleTransactionUpdate);

    return () => {
      window.removeEventListener('transactionCreated', handleTransactionUpdate);
      window.removeEventListener('transactionUpdated', handleTransactionUpdate);
      window.removeEventListener('transactionDeleted', handleTransactionUpdate);
    };
  }, [activeOnly, refreshBudgets]);

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshBudgets({ active_only: activeOnly, period: 'monthly' });
    } catch {
      // Intentionally empty
    }
  }, [activeOnly, refreshBudgets]);

  const formatCurrency = (amount: string | number, currency: Currency = 'COP'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return formatMoneyFromPesos(0, currency);
    return formatMoneyFromPesos(Math.abs(numAmount), currency);
  };

  const formatPercentage = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return `${numValue.toFixed(1)}%`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'good':
      default:
        return 'bg-green-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'exceeded':
        return 'text-red-600';
      case 'warning':
        return 'text-amber-600';
      case 'good':
      default:
        return 'text-green-600';
    }
  };

  const handleViewDetail = useCallback(
    async (budget: BudgetListItem) => {
      try {
        const detail = await getBudgetDetail(budget.id);
        setBudgetDetail(detail);
        setShowDetailModal(true);
      } catch {
        void 0;
      }
    },
    [getBudgetDetail],
  );

  const handleEdit = useCallback((budget: BudgetListItem) => {
    setBudgetToEdit(budget);
    setShowNewBudgetModal(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!budgetToDelete) return;

    setIsDeleting(true);
    try {
      await deleteBudget(budgetToDelete.id);
      setBudgetToDelete(null);
    } catch {
      // Intentionally empty
    } finally {
      setIsDeleting(false);
    }
  }, [budgetToDelete, deleteBudget]);

  const handleToggle = useCallback(
    async (budget: BudgetListItem) => {
      setIsToggling(budget.id);
      try {
        await toggleBudget(budget.id);
      } catch {
        void 0;
      } finally {
        setIsToggling(null);
      }
    },
    [toggleBudget],
  );

  const handleViewMovements = useCallback(
    (categoryId: number) => {
      if (onViewMovements) {
        onViewMovements(categoryId);
      }
    },
    [onViewMovements],
  );

  const filteredBudgets = useMemo(() => {
    if (activeOnly) {
      return budgets.filter((b) => b.is_active);
    }
    return budgets;
  }, [budgets, activeOnly]);

  const summary = useMemo(() => {
    const activeBudgets = filteredBudgets.filter((b) => b.is_active);
    const totalBudgeted = activeBudgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + parseFloat(b.spent_amount), 0);
    const totalRemaining = totalBudgeted - totalSpent;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
    };
  }, [filteredBudgets]);


  if (isLoading && budgets.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando presupuestos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Presupuestos por categoría</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Actualizar
              </button>
              <button
                onClick={() => {
                  setBudgetToEdit(null);
                  setShowNewBudgetModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo presupuesto
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg p-4">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            Solo activos
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Presupuestado</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalBudgeted)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Total Gastado</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalSpent)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500 mb-1">Disponible</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRemaining)}</p>
          </div>
        </div>

        {filteredBudgets.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Aún no tienes límites definidos
            </h3>
            <p className="text-gray-600 mb-4">
              ¡Agrega uno para empezar a controlar tus gastos!
            </p>
            <button
              onClick={() => {
                setBudgetToEdit(null);
                setShowNewBudgetModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear primer presupuesto
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBudgets.map((budget) => {
              const spentPercentage = parseFloat(budget.spent_percentage);
              const statusColor = getStatusColor(budget.status);
              const statusTextColor = getStatusTextColor(budget.status);
              const isInactive = !budget.is_active;

              return (
                <div
                  key={budget.id}
                  className={`rounded-xl border p-6 transition-shadow ${
                    isInactive
                      ? 'bg-gray-50/50 border-gray-200/50 opacity-60'
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: budget.category_color }}
                      >
                        {budget.category_icon ? (
                          <i className={`fa-solid ${budget.category_icon}`} aria-hidden="true"></i>
                        ) : (
                          budget.category_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{budget.category_name}</h3>
                        <p className="text-sm text-gray-500">
                          {budget.calculation_mode_display} · {budget.period_display}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggle(budget)}
                        disabled={isToggling === budget.id}
                        className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                          budget.is_active
                            ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                            : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        } disabled:opacity-50`}
                      >
                        {isToggling === budget.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : budget.is_active ? (
                          'Activo'
                        ) : (
                          'Inactivo'
                        )}
                      </button>
                      <button
                        onClick={() => handleViewDetail(budget)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleEdit(budget)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => setBudgetToDelete(budget)}
                        className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progreso</span>
                      <span className={`text-sm font-semibold ${statusTextColor}`}>
                        {formatPercentage(budget.spent_percentage)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${statusColor}`}
                        style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Límite</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(budget.amount, (budget.currency as Currency) || 'COP')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Gastado</p>
                      <p className="text-sm font-semibold text-red-600">{formatCurrency(budget.spent_amount, (budget.currency as Currency) || 'COP')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Restante</p>
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(budget.remaining_amount, (budget.currency as Currency) || 'COP')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Estado</p>
                      <p className={`text-sm font-semibold ${statusTextColor}`}>{budget.status_text}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleViewMovements(budget.category)}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Ver movimientos
                    </button>
                    <span className="text-xs text-gray-500">{budget.status_text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showDetailModal && budgetDetail && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: budgetDetail.category_color }}
                  >
                    {budgetDetail.category_icon ? (
                      <i className={`fa-solid ${budgetDetail.category_icon}`} aria-hidden="true"></i>
                    ) : (
                      budgetDetail.category_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{budgetDetail.category_name}</h2>
                    <p className="text-sm text-gray-500">
                      {budgetDetail.calculation_mode_display} · {budgetDetail.period_display}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setBudgetDetail(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {budgetDetail.projection && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Proyección mensual</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-blue-700 mb-1">Proyección estimada</p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(budgetDetail.projection.projected_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Promedio diario</p>
                      <p className="text-lg font-bold text-blue-900">
                        {formatCurrency(budgetDetail.projection.daily_average)}/día
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Días restantes</p>
                      <p className="text-lg font-bold text-blue-900">
                        {budgetDetail.projection.days_remaining} de {budgetDetail.projection.days_total}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-700 mb-1">Estado</p>
                      <p
                        className={`text-lg font-bold ${
                          budgetDetail.projection.will_exceed ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {budgetDetail.projection.will_exceed ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-5 h-5" />
                            Excederá
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-5 h-5" />
                            Dentro del límite
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Límite</p>
                  <p className="text-lg font-semibold text-gray-900">{formatCurrency(budgetDetail.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Gastado</p>
                  <p className="text-lg font-semibold text-red-600">{formatCurrency(budgetDetail.spent_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Restante</p>
                  <p className="text-lg font-semibold text-green-600">{formatCurrency(budgetDetail.remaining_amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Porcentaje</p>
                  <p className={`text-lg font-semibold ${getStatusTextColor(budgetDetail.status)}`}>
                    {formatPercentage(budgetDetail.spent_percentage)}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleViewMovements(budgetDetail.category)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Ver movimientos
                </button>
                <button
                  onClick={() => {
                    handleEdit(budgetDetail);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              </div>
            </div>
          </div>
        )}

        {budgetToDelete && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Eliminar presupuesto</h3>
                  <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="font-medium text-gray-900">{budgetToDelete.category_name}</p>
                <p className="text-sm text-gray-500">
                  Límite: {formatCurrency(budgetToDelete.amount)} · {budgetToDelete.period_display}
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setBudgetToDelete(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {showNewBudgetModal && (
          <NewBudgetModal
            onClose={() => {
              setShowNewBudgetModal(false);
              setBudgetToEdit(null);
            }}
            budgetToEdit={budgetToEdit}
          />
        )}
      </main>
    </div>
  );
};

export default Budgets;
