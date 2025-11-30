import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Target, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react';
import { goalService, Goal } from '../../services/goalService';
import NewGoalModal from '../../components/NewGoalModal';
import ConfirmModal from '../../components/ConfirmModal';
import { formatMoney, Currency } from '../../utils/currencyUtils';
import './goals.css';

interface GoalsProps {
  onBack: () => void;
}

const Goals: React.FC<GoalsProps> = ({ onBack: _onBack }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const goalsData = await goalService.list();
      setGoals(goalsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar metas';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (goal: Goal) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar la meta "${goal.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        await performDelete(goal.id);
      },
    });
  };

  const performDelete = async (id: number) => {
    try {
      await goalService.delete(id);
      await loadGoals();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar la meta');
    }
  };

  const handleEdit = (goal: Goal) => {
    setGoalToEdit(goal);
    setShowNewGoalModal(true);
  };

  const handleModalClose = () => {
    setShowNewGoalModal(false);
    setGoalToEdit(null);
  };

  const handleModalSuccess = async () => {
    await loadGoals();
  };

  const formatCurrency = (amount: number, currency: Currency = 'COP'): string => {
    return formatMoney(amount, currency);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (dateString: string): number => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Metas de Ahorro</h1>
          <p className="text-gray-600">Gestiona tus objetivos financieros y visualiza tu progreso</p>
        </div>
        <button
          onClick={() => setShowNewGoalModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nueva meta
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-gray-600">Cargando metas...</p>
        </div>
      ) : error ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadGoals}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : goals.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ¡Comencemos a crear tus metas!
          </h3>
          <p className="text-gray-600 mb-4">
            No tienes metas creadas aún. Crea tu primera meta de ahorro para empezar a trabajar hacia tus objetivos financieros.
          </p>
          <button
            onClick={() => setShowNewGoalModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear tu primera meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const daysRemaining = getDaysRemaining(goal.date);
            const progressPercentage = goal.progress_percentage;

            return (
              <div
                key={goal.id}
                className={`bg-white rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${
                  goal.is_completed
                    ? 'border-green-500 bg-green-50'
                    : progressPercentage >= 75
                    ? 'border-blue-500'
                    : progressPercentage >= 50
                    ? 'border-blue-300'
                    : 'border-gray-200'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-900">{goal.name}</h3>
                        {goal.currency && (
                          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                            {goal.currency_display || goal.currency}
                          </span>
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                      )}
                    </div>
                    {goal.is_completed && (
                      <div className="ml-2">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {formatCurrency(goal.saved_amount, goal.currency || 'COP')} / {formatCurrency(goal.target_amount, goal.currency || 'COP')}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {progressPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          goal.is_completed
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : progressPercentage >= 75
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                            : progressPercentage >= 50
                            ? 'bg-gradient-to-r from-blue-400 to-blue-500'
                            : 'bg-gradient-to-r from-blue-300 to-blue-400'
                        }`}
                        style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Información adicional */}
                  <div className="space-y-2 mb-4">
                    {!goal.is_completed && (
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="text-gray-600">Faltan:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(goal.remaining_amount, goal.currency || 'COP')}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Fecha objetivo:</span>
                      <span className="font-semibold text-gray-900">
                        {formatDate(goal.date)}
                      </span>
                    </div>
                    {daysRemaining > 0 && !goal.is_completed && (
                      <div className="text-xs text-gray-500">
                        {daysRemaining === 1
                          ? 'Queda 1 día'
                          : `Quedan ${daysRemaining} días`}
                      </div>
                    )}
                    {daysRemaining <= 0 && !goal.is_completed && (
                      <div className="text-xs text-amber-600 font-semibold">
                        ⚠️ Fecha objetivo pasada
                      </div>
                    )}
                  </div>

                  {goal.is_completed && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded-lg">
                      <p className="text-sm font-semibold text-green-800 text-center">
                        🎉 ¡Meta alcanzada!
                      </p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(goal)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(goal)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewGoalModal && (
        <NewGoalModal
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          goalToEdit={goalToEdit || undefined}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="warning"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default Goals;

