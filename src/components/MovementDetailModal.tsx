import React from 'react';
import { XCircle, Edit2, Trash2, CreditCard, Receipt, Percent, AlertCircle } from 'lucide-react';
import './MovementDetailModal.css';

interface Movement {
  id: number;
  date: string;
  description: string;
  category: string;
  account: string;
  amount: number;
  base: number;
  iva: number;
  taxRate: number;
  status: 'confirmed' | 'pending';
  type: 'income' | 'expense' | 'transfer';
  paymentMethod: 'debit' | 'credit' | 'cash' | 'transfer';
  installment?: string;
  totalInstallments?: number;
  isGMF?: boolean;
  isInterest?: boolean;
}

interface MovementDetailModalProps {
  movement: Movement | null;
  onClose: () => void;
}

const MovementDetailModal: React.FC<MovementDetailModalProps> = ({ movement, onClose }) => {
  if (!movement) return null;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Detalle del movimiento</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-600">Descripción</p>
                <p className="text-lg font-semibold text-gray-900">{movement.description}</p>
              </div>
              <p className={`text-2xl font-bold ${movement.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {movement.type === 'income' ? '+' : '-'}{formatCurrency(movement.amount)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-medium">{new Date(movement.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Cuenta</p>
                <p className="font-medium">{movement.account}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Categoría</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {movement.category}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Método de pago</p>
                <p className="font-medium capitalize">{movement.paymentMethod === 'credit' ? 'Crédito' : movement.paymentMethod === 'debit' ? 'Débito' : movement.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}</p>
              </div>
            </div>

            {movement.paymentMethod === 'credit' && movement.installment && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-blue-900">Pago en cuotas</p>
                </div>
                <p className="text-sm text-blue-800">Cuota {movement.installment} de {movement.totalInstallments}</p>
              </div>
            )}

            {(movement.iva > 0 || movement.taxRate > 0) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-5 h-5 text-gray-600" />
                  <p className="font-semibold text-gray-900">Desglose fiscal</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base gravable:</span>
                    <span className="font-medium">{formatCurrency(movement.base)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA ({movement.taxRate}%):</span>
                    <span className="font-medium">{formatCurrency(movement.iva)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold">{formatCurrency(movement.amount)}</span>
                  </div>
                </div>
              </div>
            )}

            {movement.isGMF && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Percent className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">Gravamen a los Movimientos Financieros (GMF)</p>
                    <p className="text-sm text-amber-800">4×1000 aplicado por transacción bancaria</p>
                  </div>
                </div>
              </div>
            )}

            {movement.isInterest && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-red-900">Intereses y comisiones</p>
                    <p className="text-sm text-red-800">Costo financiero de la tarjeta de crédito</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetailModal;

