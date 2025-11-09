import React from 'react';
import { XCircle, DollarSign, Percent, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import './InstallmentCalendar.css';

interface Installment {
  id: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
}

interface InstallmentPlan {
  id: number;
  purchaseId: number;
  purchaseDescription: string;
  purchaseDate: string;
  totalAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  monthlyAmount: number;
  interestRate: number;
  principalAmount: number;
  interestAmount: number;
  status: 'active' | 'completed' | 'cancelled';
}

interface InstallmentCalendarProps {
  plan: InstallmentPlan;
  onClose: () => void;
  currency: string;
}

const InstallmentCalendar: React.FC<InstallmentCalendarProps> = ({ plan, onClose, currency }) => {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-CO', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const installments: Installment[] = [];
  const startDate = new Date(plan.purchaseDate);
  
  for (let i = 0; i < plan.totalInstallments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i + 1);
    
    installments.push({
      id: i + 1,
      installmentNumber: i + 1,
      dueDate: dueDate.toISOString(),
      principalAmount: plan.principalAmount / plan.totalInstallments,
      interestAmount: plan.interestAmount / plan.totalInstallments,
      totalAmount: plan.monthlyAmount,
      status: i < plan.paidInstallments ? 'paid' : 'pending'
    });
  }

  const totalPaid = installments
    .filter(inst => inst.status === 'paid')
    .reduce((sum, inst) => sum + inst.totalAmount, 0);
  
  const totalPending = installments
    .filter(inst => inst.status === 'pending')
    .reduce((sum, inst) => sum + inst.totalAmount, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Calendario de cuotas</h3>
              <p className="text-sm text-gray-600 mt-1">{plan.purchaseDescription}</p>
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
              <p className="text-xl font-bold text-blue-900">{formatCurrency(plan.totalAmount)}</p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-900">Pagado</p>
              </div>
              <p className="text-xl font-bold text-green-900">{formatCurrency(totalPaid)}</p>
              <p className="text-xs text-green-700 mt-1">{plan.paidInstallments} de {plan.totalInstallments} cuotas</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">Pendiente</p>
              </div>
              <p className="text-xl font-bold text-amber-900">{formatCurrency(totalPending)}</p>
              <p className="text-xs text-amber-700 mt-1">{plan.totalInstallments - plan.paidInstallments} cuotas restantes</p>
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
                <p className="font-semibold text-gray-900">{formatCurrency(plan.principalAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Intereses totales</p>
                <p className="font-semibold text-amber-600">{formatCurrency(plan.interestAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Tasa de interés</p>
                <p className="font-semibold text-gray-900">{plan.interestRate}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Cuota mensual</p>
                <p className="font-semibold text-blue-600">{formatCurrency(plan.monthlyAmount)}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Detalle de cuotas</h4>
            <div className="space-y-2">
              {installments.map((installment) => (
                <div
                  key={installment.id}
                  className={`border rounded-lg p-4 ${
                    installment.status === 'paid'
                      ? 'bg-green-50 border-green-200'
                      : installment.status === 'overdue'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        installment.status === 'paid'
                          ? 'bg-green-500'
                          : installment.status === 'overdue'
                          ? 'bg-red-500'
                          : 'bg-gray-300'
                      }`}>
                        {installment.status === 'paid' ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : installment.status === 'overdue' ? (
                          <AlertCircle className="w-6 h-6 text-white" />
                        ) : (
                          <Clock className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Cuota {installment.installmentNumber} de {plan.totalInstallments}
                        </p>
                        <p className="text-sm text-gray-600">
                          Vence: {formatDate(installment.dueDate)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(installment.totalAmount)}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>Capital: {formatCurrency(installment.principalAmount)}</span>
                        <span>•</span>
                        <span>Interés: {formatCurrency(installment.interestAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallmentCalendar;

