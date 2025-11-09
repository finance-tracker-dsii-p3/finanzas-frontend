import React, { useState } from 'react';
import { Search, Filter, Download, Plus, Edit2, Trash2, MoreVertical, AlertCircle, FileText, CreditCard, Percent, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import MovementDetailModal from '../../components/MovementDetailModal';
import NewMovementModal from '../../components/NewMovementModal';
import './movements.css';

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

interface MovementsProps {
  showTaxes: boolean;
  setShowTaxes: (value: boolean) => void;
  onBack: () => void;
}

const Movements: React.FC<MovementsProps> = ({ showTaxes, setShowTaxes, onBack }) => {
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [movements] = useState<Movement[]>([]);
  const [summary] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    iva: 0,
    gmf: 0
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  return (
    <div className="space-y-6">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Volver al Dashboard</span>
      </button>

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar movimientos..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button 
            onClick={() => setShowNewMovementModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo movimiento
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200 transition-colors">
          <input 
            type="checkbox" 
            checked={showTaxes}
            onChange={(e) => setShowTaxes(e.target.checked)}
            className="w-3 h-3 text-blue-600 rounded"
          />
          Mostrar desglose fiscal
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <p className="text-xs font-medium text-gray-600">Mayor Gasto</p>
          </div>
          <p className="text-xl font-bold text-red-600">
            {summary.expenses > 0 ? formatCurrency(summary.expenses) : 'Sin gastos'}
          </p>
          {summary.expenses > 0 && (
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-gray-600">Mayor Ingreso</p>
          </div>
          <p className="text-xl font-bold text-green-600">
            {summary.income > 0 ? formatCurrency(summary.income) : 'Sin ingresos'}
          </p>
          {summary.income > 0 && (
            <p className="text-xs text-gray-500 mt-1">Este mes</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-purple-600" />
            <p className="text-xs font-medium text-gray-600">Total Gastado</p>
          </div>
          <p className="text-xl font-bold text-purple-600">{formatCurrency(summary.expenses)}</p>
          <p className="text-xs text-gray-500 mt-1">Período actual</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-medium text-gray-600">Total Recibido</p>
          </div>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(summary.income)}</p>
          <p className="text-xs text-gray-500 mt-1">Período actual</p>
        </div>
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
              {showTaxes && (
                <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA</th>
                </>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {movements.length === 0 ? (
              <tr>
                <td colSpan={showTaxes ? 9 : 7} className="px-6 py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Comencemos a registrar tus movimientos!</h3>
                    <p className="text-gray-600 mb-4">No hay movimientos registrados aún</p>
                    <button
                      onClick={() => setShowNewMovementModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar tu primer movimiento
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              movements.map((mov) => (
              <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(mov.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{mov.description}</div>
                  {mov.paymentMethod === 'credit' && mov.installment && (
                    <div className="flex items-center gap-1 mt-1">
                      <CreditCard className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600">{mov.installment}</span>
                    </div>
                  )}
                  {mov.isGMF && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-orange-600">
                      <Percent className="w-3 h-3" />
                      GMF
                    </span>
                  )}
                  {mov.isInterest && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      Intereses
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200 transition-colors">
                    {mov.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{mov.account}</td>
                {showTaxes && (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {formatCurrency(mov.base)}
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 text-right">
                      {mov.iva !== 0 ? formatCurrency(mov.iva) : '-'}
                    </td>
                  </>
                )}
                <td className={`px-6 py-4 text-sm font-semibold text-right ${mov.type === 'income' ? 'text-green-600' : mov.type === 'transfer' ? 'text-gray-600' : 'text-red-600'}`}>
                  {mov.type === 'income' ? '+' : mov.type === 'transfer' ? '' : '-'}{formatCurrency(mov.amount)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    mov.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {mov.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setSelectedMovement(mov)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                      <Trash2 className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {movements.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">¡Comencemos a registrar tus movimientos!</h3>
            <p className="text-gray-600 mb-4">No hay movimientos registrados aún</p>
            <button
              onClick={() => setShowNewMovementModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar tu primer movimiento
            </button>
          </div>
        ) : (
          movements.map((mov) => (
          <div 
            key={mov.id} 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedMovement(mov)}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{mov.description}</h4>
                <p className="text-sm text-gray-600">{mov.date}</p>
              </div>
              <p className={`text-lg font-semibold ${mov.type === 'income' ? 'text-green-600' : mov.type === 'transfer' ? 'text-gray-600' : 'text-red-600'}`}>
                {mov.type === 'income' ? '+' : mov.type === 'transfer' ? '' : '-'}{formatCurrency(mov.amount)}
              </p>
            </div>
            
            {showTaxes && mov.iva !== 0 && (
              <div className="text-xs text-gray-600 mb-2">
                Base: {formatCurrency(mov.base)} + IVA: {formatCurrency(mov.iva)}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {mov.category}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                mov.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {mov.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {mov.account}
              </span>
              {mov.paymentMethod === 'credit' && mov.installment && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <CreditCard className="w-3 h-3" />
                  {mov.installment}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando <span className="font-medium">{movements.length > 0 ? 1 : 0}</span> de <span className="font-medium">{movements.length}</span> movimientos
        </p>
        <div className="flex gap-2">
        </div>
      </div>

      {selectedMovement && (
        <MovementDetailModal 
          movement={selectedMovement} 
          onClose={() => setSelectedMovement(null)} 
        />
      )}

      {showNewMovementModal && (
        <NewMovementModal onClose={() => setShowNewMovementModal(false)} />
      )}
    </div>
  );
};

export default Movements;

