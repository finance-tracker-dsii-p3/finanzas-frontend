import React, { useState, useEffect, useRef } from 'react';
import { XCircle } from 'lucide-react';
import { goalService, CreateGoalData, UpdateGoalData, Goal } from '../services/goalService';
import { formatMoney, Currency } from '../utils/currencyUtils';
import './NewGoalModal.css';

interface NewGoalModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  goalToEdit?: Goal;
}

const NewGoalModal: React.FC<NewGoalModalProps> = ({ onClose, onSuccess, goalToEdit }) => {
  const isEdit = !!goalToEdit;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  const getInitialFormData = () => {
    if (goalToEdit) {
      return {
        name: goalToEdit.name,
        target_amount: (goalToEdit.target_amount / 100).toString(),
        date: goalToEdit.date,
        description: goalToEdit.description || '',
        currency: goalToEdit.currency || 'COP',
      };
    }
    
    return {
      name: '',
      target_amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      currency: 'COP' as Currency,
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    if (goalToEdit) {
      setFormData({
        name: goalToEdit.name,
        target_amount: (goalToEdit.target_amount / 100).toString(),
        date: goalToEdit.date,
        description: goalToEdit.description || '',
        currency: goalToEdit.currency || 'COP',
      });
    }
  }, [goalToEdit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return formatMoney(Math.round(numAmount * 100), formData.currency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre de la meta es requerido');
      return;
    }

    if (!formData.target_amount || parseFloat(formData.target_amount) <= 0) {
      setError('El monto objetivo debe ser mayor a cero');
      return;
    }

    if (!formData.date) {
      setError('La fecha objetivo es requerida');
      return;
    }

    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('La fecha objetivo no puede ser en el pasado');
      return;
    }

    try {
      setIsSubmitting(true);

      const targetAmountInCents = Math.round(parseFloat(formData.target_amount) * 100);

      if (isEdit && goalToEdit) {
        const updateData: UpdateGoalData = {
          name: formData.name.trim(),
          target_amount: targetAmountInCents,
          date: formData.date,
          description: formData.description.trim() || null,
          currency: formData.currency,
        };
        await goalService.update(goalToEdit.id, updateData);
      } else {
        const createData: CreateGoalData = {
          name: formData.name.trim(),
          target_amount: targetAmountInCents,
          date: formData.date,
          description: formData.description.trim() || null,
          currency: formData.currency,
        };
        await goalService.create(createData);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar la meta';
      setError(errorMessage);
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 id="modal-title" className="text-xl font-bold text-gray-900">
              {isEdit ? 'Editar meta' : 'Nueva meta de ahorro'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar modal"
              type="button"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div 
              ref={errorRef}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex items-start gap-2">
                <span className="font-semibold">⚠️ Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="goal-name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre de la meta *
              </label>
              <input
                id="goal-name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Viaje a San Andrés"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                maxLength={100}
                aria-required="true"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="goal-target-amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Monto objetivo *
                </label>
                <input
                  id="goal-target-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  onWheel={handleWheel}
                  aria-required="true"
                />
                {formData.target_amount && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(parseFloat(formData.target_amount) || 0)}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="goal-date" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha objetivo *
                </label>
                <input
                  id="goal-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  aria-required="true"
                />
              </div>
            </div>

            <div>
              <label htmlFor="goal-currency" className="block text-sm font-medium text-gray-700 mb-2">
                Moneda *
              </label>
              <select
                id="goal-currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                aria-required="true"
              >
                <option value="COP">Pesos Colombianos (COP)</option>
                <option value="USD">Dólares (USD)</option>
                <option value="EUR">Euros (EUR)</option>
              </select>
            </div>

            <div>
              <label htmlFor="goal-description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <textarea
                id="goal-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Agrega una descripción para tu meta..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={500}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                aria-label="Cancelar y cerrar el formulario"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar meta' : 'Crear meta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewGoalModal;

