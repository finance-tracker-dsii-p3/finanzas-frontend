import React, { useState, useEffect } from 'react';
import { XCircle, DollarSign, Percent, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { creditCardPlanService, InstallmentPlan, ScheduleItem, InstallmentPayment } from '../services/creditCardPlanService';
import { formatMoneyFromPesos, Currency } from '../utils/currencyUtils';
import PaymentInstallmentModal from './PaymentInstallmentModal';
import './InstallmentCalendar.css';

interface InstallmentCalendarProps {
  plan: InstallmentPlan;
  onClose: () => void;
  currency: Currency;
  onPaymentRecorded?: () => void;
}

const InstallmentCalendar: React.FC<InstallmentCalendarProps> = ({ plan, onClose, currency, onPaymentRecorded }) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInstallment, setSelectedInstallment] = useState<{ plan: InstallmentPlan; installment: InstallmentPayment } | null>(null);

  useEffect(() => {
    loadSchedule();
    
    const handleUpdate = () => {
      loadSchedule();
      if (onPaymentRecorded) {
        onPaymentRecorded();
      }
    };
    
    window.addEventListener('installmentPaymentRecorded', handleUpdate);
    window.addEventListener('installmentPlanUpdated', handleUpdate);
    
    return () => {
      window.removeEventListener('installmentPaymentRecorded', handleUpdate);
      window.removeEventListener('installmentPlanUpdated', handleUpdate);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.id]);

  const loadSchedule = async () => {
    try {
      setIsLoading(true);
      const scheduleData = await creditCardPlanService.getSchedule(plan.id);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Error al cargar calendario:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return formatMoneyFromPesos(amount / 100, currency);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getInstallmentStatus = (installmentNumber: number): 'pending' | 'completed' | 'overdue' => {
    const payment = plan.payments.find(p => p.installment_number === installmentNumber);
    if (payment) {
      if (payment.status === 'completed') return 'completed';
      if (payment.status === 'overdue') return 'overdue';
    }
    const dueDate = new Date(schedule.find(s => s.installment_number === installmentNumber)?.due_date || '');
    if (dueDate < new Date() && !payment) return 'overdue';
    return 'pending';
  };

  const paidInstallments = plan.payments.filter(p => p.status === 'completed').length;
  const totalPaid = plan.payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.installment_amount, 0);
  
  const totalPending = schedule
    .filter(s => {
      const payment = plan.payments.find(p => p.installment_number === s.installment_number);
      return !payment || payment.status !== 'completed';
    })
    .reduce((sum, s) => sum + s.installment_amount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Calendario de cuotas</h3>
              <p className="text-sm text-gray-600 mt-1">{plan.description || `Plan #${plan.id}`}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <p className="text-sm font-medium text-blue-900">Total del plan</p>
              </div>
              <p className="text-xl font-bold text-blue-900">{formatCurrency(plan.total_amount)}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Pagado</p>
              </div>
              <p className="text-xl font-bold text-green-900">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-green-700 mt-1">{paidInstallments} de {plan.number_of_installments} cuotas</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">Pendiente</p>
              </div>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-amber-700 mt-1">{plan.number_of_installments - paidInstallments} cuotas restantes</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Desglose financiero</h4>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Capital</p>
                <p className="font-semibold text-gray-900">{formatCurrency(plan.total_principal)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Intereses totales</p>
                <p className="font-semibold text-amber-600">{formatCurrency(plan.total_interest)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Tasa de interés</p>
                <p className="font-semibold text-gray-900">{plan.interest_rate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Cuota mensual</p>
                <p className="font-semibold text-blue-600">{formatCurrency(plan.installment_amount)}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Detalle de cuotas</h4>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-600">Cargando calendario...</span>
              </div>
            ) : schedule.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No hay cuotas disponibles</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedule.map((scheduleItem) => {
                  const payment = plan.payments.find(p => p.installment_number === scheduleItem.installment_number);
                  const status = payment?.status || getInstallmentStatus(scheduleItem.installment_number);
                  const isClickable = status === 'pending' || status === 'overdue';
                  
                  return (
                    <div
                      key={scheduleItem.installment_number}
                      className={`border rounded-lg p-4 ${
                        status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : status === 'overdue'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-gray-200'
                      } ${isClickable ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''}`}
                      onClick={() => {
                        if (isClickable && payment) {
                          setSelectedInstallment({ plan, installment: payment });
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            status === 'completed'
                              ? 'bg-green-500'
                              : status === 'overdue'
                              ? 'bg-red-500'
                              : 'bg-gray-300'
                          }`}>
                            {status === 'completed' ? (
                              <CheckCircle className="w-6 h-6 text-white" />
                            ) : status === 'overdue' ? (
                              <AlertCircle className="w-6 h-6 text-white" />
                            ) : (
                              <Clock className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">
                              Cuota {scheduleItem.installment_number} de {plan.number_of_installments}
                            </p>
                            <p className="text-sm text-gray-600">
                              Vence: {formatDate(scheduleItem.due_date)}
                            </p>
                            {payment?.payment_date && (
                              <p className="text-xs text-green-600 mt-1">
                                Pagado: {formatDate(payment.payment_date)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">{formatCurrency(scheduleItem.installment_amount)}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span>Capital: {formatCurrency(scheduleItem.principal_amount)}</span>
                            <span>•</span>
                            <span>Interés: {formatCurrency(scheduleItem.interest_amount)}</span>
                          </div>
                          {isClickable && (
                            <p className="text-xs text-blue-600 mt-1">Click para registrar pago</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedInstallment && (
        <PaymentInstallmentModal
          plan={selectedInstallment.plan}
          installment={selectedInstallment.installment}
          onClose={() => setSelectedInstallment(null)}
          onSuccess={() => {
            setSelectedInstallment(null);
            loadSchedule();
          }}
        />
      )}
    </div>
  );
};

export default InstallmentCalendar;

