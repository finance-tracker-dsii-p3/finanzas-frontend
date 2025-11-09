import React, { useState } from 'react';
import { XCircle, Target, DollarSign } from 'lucide-react';

interface NewBudgetModalProps {
  onClose: () => void;
  selectedMonth: string;
}

const NewBudgetModal: React.FC<NewBudgetModalProps> = ({ onClose, selectedMonth }) => {
  const [formData, setFormData] = useState({
    category: '',
    limit: '',
    includeTaxes: false,
    color: '#3b82f6'
  });

  const categories = [
    'Alimentación',
    'Transporte',
    'Vivienda',
    'Entretenimiento',
    'Salud',
    'Educación',
    'Ropa',
    'Tecnología',
    'Servicios',
    'Otros'
  ];

  const categoryColors: { [key: string]: string } = {
    'Alimentación': '#10b981',
    'Transporte': '#3b82f6',
    'Vivienda': '#8b5cf6',
    'Entretenimiento': '#f59e0b',
    'Salud': '#ef4444',
    'Educación': '#06b6d4',
    'Ropa': '#ec4899',
    'Tecnología': '#6366f1',
    'Servicios': '#14b8a6',
    'Otros': '#6b7280'
  };

  const handleCategoryChange = (category: string) => {
    setFormData({
      ...formData,
      category,
      color: categoryColors[category] || '#3b82f6'
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.limit) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    console.log('Nuevo presupuesto:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Nuevo presupuesto</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                {new Date(selectedMonth + '-01').toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Seleccionar categoría...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Límite mensual <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="1000"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              {formData.limit && (
                <p className="text-xs text-gray-600 mt-1">
                  {formatCurrency(parseFloat(formData.limit) || 0)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full border-2 border-gray-300 cursor-pointer"
                  style={{ backgroundColor: formData.color }}
                ></div>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-600">{formData.color}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.includeTaxes}
                  onChange={(e) => setFormData({ ...formData, includeTaxes: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-blue-900">Incluir impuestos en el presupuesto</span>
                  <p className="text-xs text-blue-800 mt-1">
                    Si está activado, el límite incluirá el IVA. Si está desactivado, el límite será solo la base gravable.
                  </p>
                </div>
              </label>
            </div>

            {formData.includeTaxes && formData.limit && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Desglose del presupuesto</p>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base gravable:</span>
                    <span className="font-medium">{formatCurrency((parseFloat(formData.limit) || 0) / 1.19)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">IVA (19%):</span>
                    <span className="font-medium">{formatCurrency((parseFloat(formData.limit) || 0) - (parseFloat(formData.limit) || 0) / 1.19)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">Total límite:</span>
                    <span className="font-bold">{formatCurrency(parseFloat(formData.limit) || 0)}</span>
                  </div>
                </div>
              </div>
            )}

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
                Crear presupuesto
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewBudgetModal;

