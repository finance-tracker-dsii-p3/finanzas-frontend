import React, { useState, useEffect, useCallback } from 'react';
import { XCircle, AlertCircle, Calculator, Calendar } from 'lucide-react';
import { creditCardPlanService, CreatePlanData } from '../services/creditCardPlanService';
import { accountService, Account } from '../services/accountService';
import { Transaction } from '../services/transactionService';
import { ensureFinancingCategory } from '../utils/financingCategoryUtils';
import { formatMoneyFromPesos, Currency } from '../utils/currencyUtils';
import './CreateInstallmentPlanModal.css';

interface CreateInstallmentPlanModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  purchaseTransaction: Transaction;
}

const CreateInstallmentPlanModal: React.FC<CreateInstallmentPlanModalProps> = ({
  onClose,
  onSuccess,
  purchaseTransaction,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditCards, setCreditCards] = useState<Account[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(true);
  const [formData, setFormData] = useState({
    creditCardId: '',
    numberOfInstallments: 12,
    interestRate: '2.00',
    startDate: new Date().toISOString().split('T')[0],
    description: '',
  });

  const loadCreditCards = useCallback(async () => {
    try {
      setIsLoadingCards(true);
      const accounts = await accountService.getAllAccounts();
      const creditCardAccounts = accounts.filter(
        acc => acc.category === 'credit_card' && acc.is_active !== false
      );
      setCreditCards(creditCardAccounts);
      
      if (purchaseTransaction.origin_account) {
        const matchingCard = creditCardAccounts.find(
          acc => acc.id === purchaseTransaction.origin_account
        );
        if (matchingCard) {
          setFormData(prev => ({ ...prev, creditCardId: matchingCard.id!.toString() }));
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tarjetas de crédito');
    } finally {
      setIsLoadingCards(false);
    }
  }, [purchaseTransaction.origin_account]);

  useEffect(() => {
    loadCreditCards();
  }, [loadCreditCards]);

  const validateForm = (): string | null => {
    if (!formData.creditCardId) {
      return 'Debes seleccionar una tarjeta de crédito';
    }

    if (formData.numberOfInstallments < 1 || formData.numberOfInstallments > 120) {
      return 'El número de cuotas debe estar entre 1 y 120';
    }

    const interestRateNum = parseFloat(formData.interestRate);
    if (isNaN(interestRateNum) || interestRateNum < 0 || interestRateNum > 100) {
      return 'La tasa de interés debe estar entre 0 y 100%';
    }

    if (!formData.startDate) {
      return 'Debes seleccionar una fecha de inicio';
    }

    if (purchaseTransaction.type !== 2) {
      return 'Solo se pueden crear planes de cuotas para gastos';
    }

    const selectedCard = creditCards.find(card => card.id?.toString() === formData.creditCardId);
    if (selectedCard && purchaseTransaction.origin_account !== selectedCard.id) {
      return 'La transacción debe pertenecer a la tarjeta seleccionada';
    }

    if (selectedCard && purchaseTransaction.origin_account) {
      void selectedCard;
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

    try {
      setIsSubmitting(true);

      const financingCategory = await ensureFinancingCategory();

      const planData: CreatePlanData = {
        credit_card_account_id: parseInt(formData.creditCardId),
        purchase_transaction_id: purchaseTransaction.id,
        financing_category_id: financingCategory.id,
        number_of_installments: formData.numberOfInstallments,
        interest_rate: parseFloat(formData.interestRate).toFixed(2),
        start_date: formData.startDate,
        description: formData.description.trim() || undefined,
      };

      await creditCardPlanService.createPlan(planData);

      window.dispatchEvent(new Event('installmentPlanCreated'));

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el plan de cuotas');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCard = creditCards.find(card => card.id?.toString() === formData.creditCardId);
  const purchaseAmount = purchaseTransaction.total_amount || purchaseTransaction.base_amount || 0;
  const purchaseAmountInPesos = purchaseAmount / 100;
  const transactionCurrency = selectedCard?.currency || 'COP';

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
                Crear Plan de Cuotas
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Convierte esta compra en un plan de cuotas con intereses
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

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Información de la compra</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Monto:</p>
                <p className="font-semibold text-blue-900">
                  {formatMoneyFromPesos(purchaseAmountInPesos, transactionCurrency as Currency)}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Fecha:</p>
                <p className="font-semibold text-blue-900">
                  {new Date(purchaseTransaction.date).toLocaleDateString('es-CO')}
                </p>
              </div>
              {purchaseTransaction.category_name && (
                <div>
                  <p className="text-blue-700">Categoría:</p>
                  <p className="font-semibold text-blue-900">{purchaseTransaction.category_name}</p>
                </div>
              )}
              {purchaseTransaction.note && (
                <div>
                  <p className="text-blue-700">Nota:</p>
                  <p className="font-semibold text-blue-900">{purchaseTransaction.note}</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="credit-card" className="block text-sm font-medium text-gray-700 mb-2">
                Tarjeta de crédito *
              </label>
              {isLoadingCards ? (
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Cargando tarjetas...
                </div>
              ) : (
                <select
                  id="credit-card"
                  value={formData.creditCardId}
                  onChange={(e) => setFormData({ ...formData, creditCardId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar tarjeta...</option>
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} {card.bank_name ? `- ${card.bank_name}` : ''} ({card.currency})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-2">
                  Número de cuotas *
                </label>
                <input
                  id="installments"
                  type="number"
                  min="1"
                  max="120"
                  value={formData.numberOfInstallments}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      const numValue = value === '' ? 1 : parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 1 && numValue <= 120) {
                        setFormData({ ...formData, numberOfInstallments: numValue });
                      }
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Entre 1 y 120 cuotas</p>
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

            {selectedCard && formData.numberOfInstallments > 0 && parseFloat(formData.interestRate) >= 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Calculator className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Resumen del plan</h4>
                </div>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-green-700">Monto de compra:</span>
                    <span className="font-semibold text-green-900">
                      {formatMoneyFromPesos(purchaseAmountInPesos, selectedCard.currency)}
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
                      El sistema calculará automáticamente el valor de cada cuota (capital e interés) al crear el plan.
                    </p>
                  </div>
                </div>
              </div>
            )}

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
                disabled={isSubmitting || isLoadingCards}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creando plan...' : 'Crear Plan de Cuotas'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateInstallmentPlanModal;

