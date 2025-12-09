import React, { useState } from 'react';
import { XCircle, AlertCircle, Calculator, Calendar, Info } from 'lucide-react';
import { creditCardPlanService, InstallmentPlan, UpdatePlanData } from '../services/creditCardPlanService';
import { formatMoneyFromPesos, Currency } from '../utils/currencyUtils';
import './EditInstallmentPlanModal.css';

interface EditInstallmentPlanModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  plan: InstallmentPlan;
}

const EditInstallmentPlanModal: React.FC<EditInstallmentPlanModalProps> = ({
  onClose,
  onSuccess,
  plan,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    numberOfInstallments: plan.number_of_installments,
    interestRate: parseFloat(plan.interest_rate).toFixed(2),
    startDate: plan.start_date,
    description: plan.description || '',
  });

  const paidInstallments = plan.payments.filter(p => p.status === 'completed').length;
  const minInstallments = paidInstallments;

  const validateForm = (): string | null => {
    if (formData.numberOfInstallments < minInstallments) {
      return `No puedes reducir las cuotas a menos de ${minInstallments} (ya hay ${paidInstallments} cuotas pagadas)`;
    }

    if (formData.numberOfInstallments > 120) {
      return 'El número de cuotas no puede ser mayor a 120';
    }

    const interestRateNum = parseFloat(formData.interestRate);
    if (isNaN(interestRateNum) || interestRateNum < 0 || interestRateNum > 100) {
      return 'La tasa de interés debe estar entre 0 y 100%';
    }

    if (!formData.startDate) {
      return 'Debes seleccionar una fecha de inicio';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const hasChanges =
      formData.numberOfInstallments !== plan.number_of_installments ||
      parseFloat(formData.interestRate) !== parseFloat(plan.interest_rate) ||
      formData.startDate !== plan.start_date ||
      formData.description !== (plan.description || '');

    if (!hasChanges) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData: UpdatePlanData = {};

      if (formData.numberOfInstallments !== plan.number_of_installments) {
        updateData.number_of_installments = formData.numberOfInstallments;
      }

      if (parseFloat(formData.interestRate) !== parseFloat(plan.interest_rate)) {
        updateData.interest_rate = parseFloat(formData.interestRate).toFixed(2);
      }

      if (formData.startDate !== plan.start_date) {
        updateData.start_date = formData.startDate;
      }

      if (formData.description !== (plan.description || '')) {
        updateData.description = formData.description.trim() || undefined;
      }

      await creditCardPlanService.updatePlan(plan.id, updateData);

      window.dispatchEvent(new Event('installmentPlanUpdated'));

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar el plan de cuotas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const purchaseAmountInPesos = plan.purchase_amount / 100;
  const totalAmountInPesos = plan.total_amount / 100;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 id="modal-title" className="text-xl font-bold text-gray-900">
                Editar Plan de Cuotas
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {plan.description || `Plan #${plan.id}`}
              </p>
            </div>
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
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {paidInstallments > 0 && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
              <div className="flex items-start gap-2">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Cuotas ya pagadas</p>
                  <p>
                    Este plan tiene {paidInstallments} cuota(s) pagada(s). Solo se recalcularán las cuotas futuras.
                    Las cuotas pagadas se mantendrán sin cambios.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">Información actual del plan</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Monto de compra:</p>
                <p className="font-semibold text-blue-900">
                  {formatMoneyFromPesos(purchaseAmountInPesos, 'COP' as Currency)}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Total del plan:</p>
                <p className="font-semibold text-blue-900">
                  {formatMoneyFromPesos(totalAmountInPesos, 'COP' as Currency)}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Cuotas pagadas:</p>
                <p className="font-semibold text-blue-900">
                  {paidInstallments} / {plan.number_of_installments}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Estado:</p>
                <p className="font-semibold text-blue-900 capitalize">{plan.status}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de cuotas *
                </label>
                <input
                  id="installments"
                  type="number"
                  min={minInstallments}
                  max="120"
                  value={formData.numberOfInstallments}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      const numValue = value === '' ? minInstallments : parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= minInstallments && numValue <= 120) {
                        setFormData({ ...formData, numberOfInstallments: numValue });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo: {minInstallments} (ya pagadas)
                </p>
              </div>

              <div>
                <label htmlFor="interest-rate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tasa de interés mensual (%) *
                </label>
                <input
                  id="interest-rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      const numValue = parseFloat(value);
                      if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 100)) {
                        setFormData({ ...formData, interestRate: value });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Ej: 2.00 para 2% mensual</p>
              </div>
            </div>

            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de inicio *
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  id="start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                La primera cuota vencerá un mes después de esta fecha
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <input
                id="description"
                type="text"
                value={formData.description}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 200) {
                    setFormData({ ...formData, description: value });
                  }
                }}
                placeholder="Ej: Compra de electrodomésticos"
                maxLength={200}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.description.length}/200 caracteres
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Resumen del plan actualizado</h4>
              </div>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-green-700">Monto de compra:</span>
                  <span className="font-semibold text-green-900">
                    {formatMoneyFromPesos(purchaseAmountInPesos, 'COP' as Currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Número de cuotas:</span>
                  <span className="font-semibold text-green-900">{formData.numberOfInstallments}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Tasa de interés:</span>
                  <span className="font-semibold text-green-900">{formData.interestRate}% mensual</span>
                </div>
                <div className="pt-2 border-t border-green-200">
                  <p className="text-xs text-green-600">
                    El sistema recalculará automáticamente el valor de cada cuota futura al guardar los cambios.
                    {paidInstallments > 0 && ` Las ${paidInstallments} cuota(s) ya pagada(s) se mantendrán sin cambios.`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Actualizando plan...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditInstallmentPlanModal;

