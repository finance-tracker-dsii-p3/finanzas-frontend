import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CreditCard, TrendingUp, TrendingDown, Calendar, DollarSign, Percent, Clock, Loader2, Edit2 } from 'lucide-react';
import InstallmentCalendar from '../../components/InstallmentCalendar';
import EditInstallmentPlanModal from '../../components/EditInstallmentPlanModal';
import { creditCardPlanService, InstallmentPlan } from '../../services/creditCardPlanService';
import { formatMoneyFromPesos, Currency } from '../../utils/currencyUtils';
import './card-detail.css';

interface CardAccount {
  id: number;
  name: string;
  bankName: string;
  accountNumber: string;
  limit: number;
  available: number;
  used: number;
  currentDebt?: number;
  totalPaid?: number;
  utilizationPercentage?: number;
  currency: string;
  color: string;
}

interface CardDetailProps {
  card: CardAccount;
  onBack: () => void;
}

const CardDetail: React.FC<CardDetailProps> = ({ card, onBack }) => {
  const [installmentPlans, setInstallmentPlans] = useState<InstallmentPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [currentMonthInterest, setCurrentMonthInterest] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<InstallmentPlan | null>(null);
  const [planToEdit, setPlanToEdit] = useState<InstallmentPlan | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      setIsLoadingPlans(true);
      const allPlans = await creditCardPlanService.listPlans();

      const cardPlans = allPlans.filter(plan => plan.credit_card_account === card.id);
      setInstallmentPlans(cardPlans);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      let monthInterest = 0;
      let pendingCount = 0;
      
      cardPlans.forEach(plan => {
        plan.payments.forEach(payment => {
          const dueDate = new Date(payment.due_date);
          if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
            if (payment.status === 'pending' || payment.status === 'overdue') {
              monthInterest += payment.interest_amount;
              pendingCount++;
            }
          }
        });
      });
      
      setCurrentMonthInterest(monthInterest / 100);
      setPendingPayments(pendingCount);
    } catch (error) {
      console.error('Error al cargar planes:', error);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [card.id]);

  useEffect(() => {
    loadPlans();
    
    const handleUpdate = () => {
      loadPlans();
    };
    
    window.addEventListener('installmentPlanCreated', handleUpdate);
    window.addEventListener('installmentPlanUpdated', handleUpdate);
    window.addEventListener('installmentPaymentRecorded', handleUpdate);
    
    return () => {
      window.removeEventListener('installmentPlanCreated', handleUpdate);
      window.removeEventListener('installmentPlanUpdated', handleUpdate);
      window.removeEventListener('installmentPaymentRecorded', handleUpdate);
    };
  }, [loadPlans]);

  const formatCurrency = (amount: number, currency: Currency = 'COP'): string => {
    return formatMoneyFromPesos(amount, currency);
  };

  const usagePercentage = card.utilizationPercentage ?? (card.limit > 0 ? (card.used / card.limit) * 100 : 0);
  const availablePercentage = card.limit > 0 ? (card.available / card.limit) * 100 : 0;
  const currentDebt = card.currentDebt ?? -card.used;
  const totalPaid = card.totalPaid ?? 0;

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
            <p className="text-2xl font-bold text-blue-900">{formatCurrency(card.limit, card.currency as Currency)}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-green-900">Disponible</p>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(card.available, card.currency as Currency)}</p>
            <p className="text-xs text-green-700 mt-1">{availablePercentage.toFixed(1)}% del límite</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium text-red-900">Utilizado</p>
            </div>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(card.used, card.currency as Currency)}</p>
            <p className="text-xs text-red-700 mt-1">{usagePercentage.toFixed(1)}% del límite</p>
          </div>
        </div>

        {}
        {(currentDebt !== undefined || totalPaid !== undefined) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <p className="text-sm font-medium text-amber-900">Lo que se debe</p>
              </div>
              <p className="text-2xl font-bold text-amber-900">{formatCurrency(Math.abs(currentDebt), card.currency as Currency)}</p>
              <p className="text-xs text-amber-700 mt-1">Deuda actual</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <p className="text-sm font-medium text-purple-900">Total pagado</p>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {formatCurrency(totalPaid, card.currency as Currency)}
                {totalPaid > card.limit && (
                  <span className="ml-2 text-xs text-purple-600">(incluye intereses)</span>
                )}
              </p>
              <p className="text-xs text-purple-700 mt-1">
                {totalPaid > card.limit 
                  ? `Ha pagado más que el límite debido a intereses`
                  : `Total histórico de pagos`
                }
              </p>
            </div>
          </div>
        )}

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
            {formatCurrency(currentMonthInterest, card.currency as Currency)}
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

        {isLoadingPlans ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Cargando planes...</span>
          </div>
        ) : installmentPlans.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No hay planes de cuotas activos</h4>
            <p className="text-gray-600">Las compras a cuotas aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {installmentPlans.map((plan) => {
              const paidInstallments = plan.payments.filter(p => p.status === 'completed').length;
              const progressPercentage = (paidInstallments / plan.number_of_installments) * 100;
              
              return (
                <div 
                  key={plan.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedPlan(plan)}>
                      <h4 className="font-semibold text-gray-900 mb-1">{plan.description || `Plan #${plan.id}`}</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(plan.start_date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToEdit(plan);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar plan"
                      >
                        <Edit2 className="w-4 h-4 text-gray-600" />
                      </button>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        plan.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        plan.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {plan.status === 'active' ? 'Activo' : plan.status === 'completed' ? 'Completado' : 'Cancelado'}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Total</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(plan.total_amount / 100, card.currency as Currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Cuota mensual</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(plan.installment_amount / 100, card.currency as Currency)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Progreso</p>
                      <p className="font-semibold text-gray-900">
                        {paidInstallments} / {plan.number_of_installments}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Interés</p>
                      <p className="font-semibold text-amber-600">{plan.interest_rate}%</p>
                    </div>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPlan && (
        <InstallmentCalendar
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          currency={card.currency as Currency}
          onPaymentRecorded={loadPlans}
        />
      )}

      {planToEdit && (
        <EditInstallmentPlanModal
          plan={planToEdit}
          onClose={() => setPlanToEdit(null)}
          onSuccess={() => {
            setPlanToEdit(null);
            loadPlans();
          }}
        />
      )}
    </div>
  );
};

export default CardDetail;

