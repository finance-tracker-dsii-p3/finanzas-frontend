import React, { useState } from 'react';
import { XCircle, TrendingDown, TrendingUp, ArrowRight, CreditCard } from 'lucide-react';

interface NewMovementModalProps {
  onClose: () => void;
}

const NewMovementModal: React.FC<NewMovementModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    account: '',
    amount: '',
    base: '',
    taxRate: 19,
    paymentMethod: 'debit',
    installments: 1,
    status: 'confirmed',
    accountFrom: '',
    accountTo: '',
    isCardPurchase: false,
    isCardPayment: false
  });

  const [calculationMode, setCalculationMode] = useState<'total' | 'base'>('total');

  const categories = ['Alimentación', 'Transporte', 'Vivienda', 'Entretenimiento', 'Salud', 'Ingreso', 'Sin clasificar'];
  const accounts = ['Bancolombia', 'Nequi', 'Tarjeta Crédito Visa', 'Efectivo'];

  const handleAmountChange = (value: string, mode: 'total' | 'base') => {
    if (mode === 'total') {
      const total = parseFloat(value) || 0;
      const base = total / (1 + formData.taxRate / 100);
      setFormData({ ...formData, amount: value, base: base.toFixed(2) });
    } else {
      const base = parseFloat(value) || 0;
      const iva = base * (formData.taxRate / 100);
      const total = base + iva;
      setFormData({ ...formData, base: value, amount: total.toFixed(2) });
    }
  };

  const suggestedCategory = (): string => {
    const desc = formData.description.toLowerCase();
    if (desc.includes('uber') || desc.includes('taxi') || desc.includes('gasolina')) return 'Transporte';
    if (desc.includes('supermercado') || desc.includes('restaurante') || desc.includes('comida')) return 'Alimentación';
    if (desc.includes('arriendo') || desc.includes('alquiler') || desc.includes('luz') || desc.includes('agua')) return 'Vivienda';
    if (desc.includes('netflix') || desc.includes('cine') || desc.includes('spotify')) return 'Entretenimiento';
    if (desc.includes('farmacia') || desc.includes('doctor') || desc.includes('medicina')) return 'Salud';
    return 'Sin clasificar';
  };

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
            <h3 className="text-xl font-bold text-gray-900">Nuevo movimiento</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de movimiento</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'expense'
                      ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <TrendingDown className="w-5 h-5 inline mr-2" />
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'income'
                      ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 inline mr-2" />
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'transfer' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <ArrowRight className="w-5 h-5 inline mr-2" />
                  Transferencia
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'confirmed' | 'pending' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="confirmed">Confirmado</option>
                  <option value="pending">Pendiente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Supermercado Éxito"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {formData.description && !formData.category && (
                <p className="text-xs text-blue-600 mt-1">
                  💡 Sugerencia: {suggestedCategory()}
                </p>
              )}
            </div>

            {formData.type === 'transfer' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta origen</label>
                  <select
                    value={formData.accountFrom}
                    onChange={(e) => setFormData({ ...formData, accountFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {accounts.filter(acc => acc !== formData.accountTo).map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta destino</label>
                  <select
                    value={formData.accountTo}
                    onChange={(e) => setFormData({ ...formData, accountTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {accounts.filter(acc => acc !== formData.accountFrom).map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cuenta</label>
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar...</option>
                    {accounts.map(acc => (
                      <option key={acc} value={acc}>{acc}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {formData.type === 'expense' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Método de pago</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['debit', 'credit', 'cash', 'transfer'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        const isCredit = method === 'credit';
                        setFormData({ 
                          ...formData, 
                          paymentMethod: method as 'debit' | 'credit' | 'cash' | 'transfer',
                          isCardPurchase: isCredit ? true : false,
                          isCardPayment: false
                        });
                      }}
                      className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                        formData.paymentMethod === method
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {method === 'debit' ? 'Débito' : method === 'credit' ? 'Crédito' : method === 'cash' ? 'Efectivo' : 'Transfer.'}
                    </button>
                  ))}
                </div>
                {formData.paymentMethod === 'credit' && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    <label className="block text-sm font-medium text-purple-900 mb-2">Tipo de transacción</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isCardPurchase: true, isCardPayment: false })}
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          formData.isCardPurchase
                            ? 'border-purple-600 bg-purple-100 text-purple-700 font-medium'
                            : 'border-purple-200 hover:border-purple-300'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 inline mr-1" />
                        Compra
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, isCardPurchase: false, isCardPayment: true, installments: 1 })}
                        className={`px-3 py-2 rounded-lg border transition-colors text-sm ${
                          formData.isCardPayment
                            ? 'border-purple-600 bg-purple-100 text-purple-700 font-medium'
                            : 'border-purple-200 hover:border-purple-300'
                        }`}
                      >
                        <ArrowRight className="w-4 h-4 inline mr-1" />
                        Pago
                      </button>
                    </div>
                    <p className="text-xs text-purple-700 mt-2">
                      {formData.isCardPurchase 
                        ? 'Esta es una compra con tarjeta de crédito. Se registrará como gasto y se puede dividir en cuotas.'
                        : formData.isCardPayment
                        ? 'Este es un pago de tarjeta. No se contará como gasto adicional para evitar doble conteo.'
                        : 'Selecciona si es una compra o un pago de tarjeta'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {formData.type === 'expense' && formData.paymentMethod === 'credit' && formData.isCardPurchase && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Número de cuotas</label>
                <input
                  type="number"
                  min="1"
                  max="48"
                  value={formData.installments}
                  onChange={(e) => setFormData({ ...formData, installments: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-600 mt-1">
                  {formData.installments > 1 && `Se creará un plan de cuotas con ${formData.installments} pagos mensuales. El sistema calculará automáticamente el desglose de capital e intereses.`}
                </p>
                {formData.installments > 1 && formData.amount && (
                  <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-blue-900 mb-1">Proyección del plan:</p>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p>Total: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(parseFloat(formData.amount) || 0)}</p>
                      <p>Cuota mensual aproximada: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format((parseFloat(formData.amount) || 0) / formData.installments)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Monto</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCalculationMode('total')}
                    className={`px-2 py-1 text-xs rounded ${
                      calculationMode === 'total' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('base')}
                    className={`px-2 py-1 text-xs rounded ${
                      calculationMode === 'base' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    Base + IVA
                  </button>
                </div>
              </div>

              {calculationMode === 'total' ? (
                <>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => handleAmountChange(e.target.value, 'total')}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                  />
                  {formData.amount && formData.taxRate > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Base: {formatCurrency(parseFloat(formData.base) || 0)} + IVA ({formData.taxRate}%): {formatCurrency((parseFloat(formData.amount) || 0) - (parseFloat(formData.base) || 0))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-600">Base gravable</label>
                    <input
                      type="number"
                      value={formData.base}
                      onChange={(e) => handleAmountChange(e.target.value, 'base')}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600">IVA:</label>
                    <select
                      value={formData.taxRate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value);
                        setFormData({ ...formData, taxRate: newRate });
                        if (formData.base) {
                          handleAmountChange(formData.base, 'base');
                        }
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="0">0%</option>
                      <option value="5">5%</option>
                      <option value="19">19%</option>
                    </select>
                  </div>
                  <div className="pt-2 border-t">
                    <label className="text-xs text-gray-600">Total</label>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Guardar movimiento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewMovementModal;

