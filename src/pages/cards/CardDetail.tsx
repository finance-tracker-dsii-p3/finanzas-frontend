import React, { useState } from 'react';
import { ArrowLeft, CreditCard, TrendingUp, TrendingDown, Calendar, AlertCircle, DollarSign, Percent, Clock, CheckCircle, XCircle } from 'lucide-react';
import InstallmentCalendar from '../../components/InstallmentCalendar';
import './card-detail.css';

interface CardAccount {
  id: number;
  name: string;
  bankName: string;
  accountNumber: string;
  limit: number;
  available: number;
  used: number;
  currency: string;
  color: string;
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

interface CardDetailProps {
  card: CardAccount;
  onBack: () => void;
}

const CardDetail: React.FC<CardDetailProps> = ({ card, onBack }) => {
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [currentMonthInterest, setCurrentMonthInterest] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);

  const formatCurrency = (amount: number, currency: string = 'COP'): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const usagePercentage = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
  const availablePercentage = card.limit > 0 ? (card.available / card.limit) * 100 : 0;

  const getUsageStatus = () => {
    if (usagePercentage >= 90) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', message: 'Límite casi alcanzado' };
    if (usagePercentage >= 70) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', message: 'Uso moderado' };
    return { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', message: 'Uso normal' };
  };

  const status = getUsageStatus();

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Volver a Cuentas</span>
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white"
              style={{ backgroundColor: card.color }}
            >
              <CreditCard className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{card.name}</h2>
              <p className="text-gray-600">{card.bankName}</p>
              <p className="text-sm text-gray-500 font-mono">•••• {card.accountNumber.slice(-4)}</p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border ${status.bg} ${status.border}`}>
            <p className={`text-sm font-medium ${status.color}`}>{status.message}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-medium text-blue-900">Límite de crédito</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(card.limit, card.currency)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">Disponible</p>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(card.available, card.currency)}</p>
            <p className="text-xs text-green-700 mt-1">{availablePercentage.toFixed(1)}% del límite</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">Utilizado</p>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(card.used, card.currency)}</p>
            <p className="text-xs text-red-700 mt-1">{usagePercentage.toFixed(1)}% del límite</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Uso del crédito</span>
            <span className="text-sm font-medium text-gray-900">{usagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                usagePercentage >= 90 ? 'bg-red-500' : 
                usagePercentage >= 70 ? 'bg-amber-500' : 
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Percent className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Intereses del mes</h3>
          </div>
          <p className="text-3xl font-bold text-amber-900 mb-2">
            {formatCurrency(currentMonthInterest, card.currency)}
          </p>
          <p className="text-sm text-gray-600">Intereses acumulados en el período actual</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Pagos pendientes</h3>
          </div>
          <p className="text-3xl font-bold text-purple-900 mb-2">
            {pendingPayments}
          </p>
          <p className="text-sm text-gray-600">Cuotas pendientes de pago</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Planes de cuotas activos</h3>
          </div>
          <span className="text-sm text-gray-600">{installmentPlans.length} planes</span>
        </div>

        {installmentPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay planes de cuotas activos</h4>
            <p className="text-gray-600">Las compras a cuotas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {installmentPlans.map((plan) => (
              <div 
                key={plan.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{plan.purchaseDescription}</h4>
                    <p className="text-sm text-gray-600">
                      {new Date(plan.purchaseDate).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    plan.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {plan.status === 'active' ? 'Activo' : plan.status === 'completed' ? 'Completado' : 'Cancelado'}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Total</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(plan.totalAmount, card.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Cuota mensual</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(plan.monthlyAmount, card.currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Progreso</p>
                    <p className="font-semibold text-gray-900">
                      {plan.paidInstallments} / {plan.totalInstallments}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Interés</p>
                    <p className="font-semibold text-amber-600">{plan.interestRate}%</p>
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full rounded-full transition-all"
                    style={{ width: `${(plan.paidInstallments / plan.totalInstallments) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPlan && (
        <InstallmentCalendar
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          currency={card.currency}
        />
      )}
    </div>
  );
};

export default CardDetail;

