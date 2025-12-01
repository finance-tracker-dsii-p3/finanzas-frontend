import React from 'react';
import { XCircle, Edit2, Trash2, CreditCard, Receipt, Sparkles } from 'lucide-react';
import './MovementDetailModal.css';

interface Movement {
  id: number;
  date: string;
  note?: string | null;
  tag?: string | null;
  origin_account: number;
  origin_account_name?: string;
  destination_account?: number | null;
  destination_account_name?: string;
  type: 1 | 2 | 3 | 4;
  category?: number | null;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  base_amount?: number;
  base?: number;
  tax_percentage?: number | null;
  total_amount?: number;
  amount?: number;
  capital_amount?: number | null;
  interest_amount?: number | null;
  gmf_amount?: number | null;
  taxed_amount?: number | null;
  applied_rule?: number | null;
  applied_rule_name?: string | null;
}

interface MovementDetailModalProps {
  movement: Movement | null;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MovementDetailModal: React.FC<MovementDetailModalProps> = ({ movement, onClose, onEdit, onDelete }) => {
  if (!movement) return null;

  const formatCurrency = (amount: number | undefined): string => {
    if (amount === undefined) return '$0';
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
                <p className="text-sm text-gray-600">Nota</p>
                <p className="text-lg font-semibold text-gray-900">{movement.note || 'Sin nota'}</p>
                {movement.tag && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {movement.tag}
                  </span>
                )}
              </div>
              <p className={`text-2xl font-bold ${
                movement.type === 1 ? 'text-green-600' : 
                movement.type === 2 ? 'text-red-600' : 
                movement.type === 3 ? 'text-gray-600' : 
                'text-blue-600'
              }`}>
                {movement.type === 1 ? '+' : movement.type === 2 ? '-' : ''}{formatCurrency(movement.total_amount || movement.amount)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Fecha</p>
                <p className="font-medium">{new Date(movement.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {movement.type === 1 ? 'Ingreso' : movement.type === 2 ? 'Gasto' : movement.type === 3 ? 'Transferencia' : 'Ahorro'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {movement.category_name && (
                <div>
                  <p className="text-sm text-gray-600">Categoría</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {movement.category_name}
                  </span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Cuenta origen</p>
                <p className="font-medium">{movement.origin_account_name || `Cuenta ${movement.origin_account}`}</p>
              </div>
              {movement.type === 3 && movement.destination_account && (
                <div>
                  <p className="text-sm text-gray-600">Cuenta destino</p>
                  <p className="font-medium">{movement.destination_account_name || `Cuenta ${movement.destination_account}`}</p>
                </div>
              )}
            </div>

            {movement.applied_rule_name && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-blue-900">Regla automática aplicada</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-blue-700 font-medium">Regla: {movement.applied_rule_name}</p>
                  </div>
                  {movement.category_name && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700">✅ Categoría asignada automáticamente:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {movement.category_name}
                      </span>
                    </div>
                  )}
                  {movement.tag && (
                    <div className="flex items-center gap-2">
                      <span className="text-blue-700">✅ Etiqueta asignada automáticamente:</span>
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                        {movement.tag}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}


            {/* Desglose de pago a tarjeta de crédito (capital e intereses) */}
            {movement.type === 3 && movement.destination_account && 
             (movement.capital_amount || movement.interest_amount) && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <p className="font-semibold text-purple-900">Desglose de pago a tarjeta de crédito</p>
                </div>
                <div className="space-y-2 text-sm">
                  {movement.capital_amount && movement.capital_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">Capital pagado:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(movement.capital_amount)}
                        <span className="ml-2 text-xs text-purple-600">(reduce deuda)</span>
                      </span>
                    </div>
                  )}
                  {movement.interest_amount && movement.interest_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-purple-700">Intereses pagados:</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(movement.interest_amount)}
                        <span className="ml-2 text-xs text-purple-600">(no reduce deuda)</span>
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-purple-300">
                    <span className="font-semibold text-purple-900">Total pagado:</span>
                    <span className="font-bold text-purple-900">
                      {formatCurrency(movement.total_amount || movement.amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Desglose fiscal (IVA y GMF) - HU-15 */}
            {((movement.tax_percentage && movement.tax_percentage > 0) || movement.gmf_amount) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Receipt className="w-5 h-5 text-gray-600" />
                  <p className="font-semibold text-gray-900">Desglose fiscal</p>
                </div>
                <div className="space-y-2 text-sm">
                  {movement.base_amount !== undefined && movement.base_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base calculada:</span>
                      <span className="font-medium">{formatCurrency(movement.base_amount || movement.base || 0)}</span>
                    </div>
                  )}
                  {movement.tax_percentage && movement.tax_percentage > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">IVA ({movement.tax_percentage}%):</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(
                          movement.taxed_amount ?? 
                          ((movement.total_amount || movement.amount || 0) - (movement.base_amount || movement.base || 0) - (movement.gmf_amount || 0))
                        )}
                      </span>
                    </div>
                  )}
                  {movement.gmf_amount && movement.gmf_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">GMF (4x1000):</span>
                      <span className="font-medium text-blue-600">{formatCurrency(movement.gmf_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Total final:</span>
                    <span className="font-bold">{formatCurrency(movement.total_amount || movement.amount || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {onEdit && (
                <button 
                  onClick={onEdit}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
              )}
              {onDelete && (
                <button 
                  onClick={onDelete}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovementDetailModal;

