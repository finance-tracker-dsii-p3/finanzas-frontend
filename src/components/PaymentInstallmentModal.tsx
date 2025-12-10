import React, { useState, useEffect } from 'react';
import { XCircle, AlertCircle, DollarSign, Calendar } from 'lucide-react';
import { creditCardPlanService, InstallmentPlan, InstallmentPayment, RecordPaymentData } from '../services/creditCardPlanService';
import { accountService, Account } from '../services/accountService';
import { formatMoneyFromPesos, Currency } from '../utils/currencyUtils';
import './PaymentInstallmentModal.css';

interface PaymentInstallmentModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  plan: InstallmentPlan;
  installment: InstallmentPayment;
}

const PaymentInstallmentModal: React.FC<PaymentInstallmentModalProps> = ({
  onClose,
  onSuccess,
  plan,
  installment,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceAccounts, setSourceAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [formData, setFormData] = useState({
    sourceAccountId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    loadSourceAccounts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSourceAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const accounts = await accountService.getAllAccounts();
      const assetAccounts = accounts.filter(
        acc => acc.account_type === 'asset' && 
               acc.category !== 'credit_card' && 
               acc.is_active !== false
      );
      
      const creditCard = accounts.find(acc => acc.id === plan.credit_card_account);
      
      const compatibleAccounts = creditCard
        ? assetAccounts.filter(acc => acc.currency === creditCard.currency)
        : assetAccounts;
      
      setSourceAccounts(compatibleAccounts);
      
      if (compatibleAccounts.length > 0) {
        setFormData(prev => ({ ...prev, sourceAccountId: compatibleAccounts[0].id!.toString() }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const validateForm = (): string | null => {
    if (!formData.sourceAccountId) {
      return 'Debes seleccionar una cuenta origen';
    }

    if (!formData.paymentDate) {
      return 'Debes seleccionar una fecha de pago';
    }

    if (installment.status === 'completed') {
      return 'Esta cuota ya está pagada';
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

      const paymentData: RecordPaymentData = {
        installment_number: installment.installment_number,
        payment_date: formData.paymentDate,
        source_account_id: parseInt(formData.sourceAccountId),
        notes: formData.notes.trim() || undefined,
      };

      await creditCardPlanService.recordPayment(plan.id, paymentData);

      window.dispatchEvent(new Event('installmentPaymentRecorded'));

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = sourceAccounts.find(acc => acc.id?.toString() === formData.sourceAccountId);
  const installmentAmountInPesos = installment.installment_amount / 100;
  const principalAmountInPesos = installment.principal_amount / 100;
  const interestAmountInPesos = installment.interest_amount / 100;
  const currency = selectedAccount?.currency || 'COP';

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
                Registrar Pago de Cuota
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Cuota {installment.installment_number} de {plan.number_of_installments}
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
            <h4 className="font-semibold text-blue-900 mb-3">Información de la cuota</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-blue-700">Fecha de vencimiento:</p>
                <p className="font-semibold text-blue-900">
                  {new Date(installment.due_date).toLocaleDateString('es-CO', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Valor total de la cuota:</p>
                <p className="font-semibold text-blue-900">
                  {formatMoneyFromPesos(installmentAmountInPesos, currency as Currency)}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Capital:</p>
                <p className="font-semibold text-blue-900">
                  {formatMoneyFromPesos(principalAmountInPesos, currency as Currency)}
                </p>
              </div>
              <div>
                <p className="text-blue-700">Interés:</p>
                <p className="font-semibold text-amber-600">
                  {formatMoneyFromPesos(interestAmountInPesos, currency as Currency)}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="source-account" className="block text-sm font-medium text-gray-700 mb-2">
                Cuenta origen (desde donde pagas) *
              </label>
              {isLoadingAccounts ? (
                <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500">
                  Cargando cuentas...
                </div>
              ) : sourceAccounts.length === 0 ? (
                <div className="px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-800">
                  No hay cuentas disponibles con la misma moneda que la tarjeta de crédito.
                </div>
              ) : (
                <select
                  id="source-account"
                  value={formData.sourceAccountId}
                  onChange={(e) => setFormData({ ...formData, sourceAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccionar cuenta...</option>
                  {sourceAccounts.map((account) => {
                    const accountInfo = account.account_type === 'liability'
                      ? `Crédito disponible: ${formatMoneyFromPesos(
                          (account.credit_limit || 0) + (account.current_balance || 0),
                          account.currency
                        )}`
                      : `Saldo: ${formatMoneyFromPesos(account.current_balance || 0, account.currency)}`;
                    return (
                      <option key={account.id} value={account.id}>
                        {account.name} - {accountInfo} ({account.currency})
                      </option>
                    );
                  })}
                </select>
              )}
              <p className="text-xs text-gray-500 mt-1">
                El pago se registrará como transferencia desde esta cuenta a la tarjeta de crédito.
                Los intereses se registrarán como gasto en la categoría "Financiamiento".
              </p>
            </div>

            <div>
              <label htmlFor="payment-date" className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de pago *
              </label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  id="payment-date"
                  type="date"
                  value={formData.paymentDate}
                  onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 500) {
                    setFormData({ ...formData, notes: value });
                  }
                }}
                placeholder="Ej: Pago realizado mediante transferencia bancaria"
                rows={3}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes.length}/500 caracteres
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Resumen del pago</h4>
              </div>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-700">Transferencia (capital):</span>
                  <span className="font-semibold text-green-900">
                    {formatMoneyFromPesos(principalAmountInPesos, currency as Currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Gasto (interés):</span>
                  <span className="font-semibold text-green-900">
                    {formatMoneyFromPesos(interestAmountInPesos, currency as Currency)}
                  </span>
                </div>
                <div className="pt-2 border-t border-green-200 flex justify-between">
                  <span className="text-green-700 font-semibold">Total:</span>
                  <span className="font-bold text-green-900">
                    {formatMoneyFromPesos(installmentAmountInPesos, currency as Currency)}
                  </span>
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
                disabled={isSubmitting || isLoadingAccounts || sourceAccounts.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Registrando pago...' : 'Registrar Pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentInstallmentModal;

