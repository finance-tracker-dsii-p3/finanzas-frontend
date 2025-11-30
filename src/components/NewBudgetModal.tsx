import React, { useMemo, useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { useBudgets } from '../context/BudgetContext';
import { useCategories } from '../context/CategoryContext';
import { accountService } from '../services/accountService';
import { BudgetListItem, CalculationMode } from '../services/budgetService';
import './NewBudgetModal.css';

interface NewBudgetModalProps {
  onClose: () => void;
  budgetToEdit?: BudgetListItem | null;
}

const NewBudgetModal: React.FC<NewBudgetModalProps> = ({ onClose, budgetToEdit }) => {
  const { createBudget, updateBudget, getCategoriesWithoutBudget } = useBudgets();
  const { getActiveCategoriesByType } = useCategories();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: number; name: string; color: string; icon: string }>>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    currency: 'COP' as 'COP' | 'USD' | 'EUR',
    calculation_mode: 'base' as CalculationMode,
    alert_threshold: '80',
    is_active: true,
  });
  const [availableCurrencies, setAvailableCurrencies] = useState<Array<'COP' | 'USD' | 'EUR'>>(['COP']);

  const expenseCategories = useMemo(() => getActiveCategoriesByType('expense'), [getActiveCategoriesByType]);

  useEffect(() => {
    const loadAvailableCategories = async () => {
      setIsLoadingCategories(true);
      try {
        // Cargar cuentas para obtener monedas disponibles
        const accounts = await accountService.getAllAccounts();
        const currencies = Array.from(new Set(accounts.filter(acc => acc.is_active !== false).map(acc => acc.currency))) as Array<'COP' | 'USD' | 'EUR'>;
        setAvailableCurrencies(currencies.length > 0 ? currencies : ['COP']);

        if (budgetToEdit) {
          setAvailableCategories(expenseCategories.map((cat) => ({
            id: cat.id,
            name: cat.name,
            color: cat.color,
            icon: cat.icon || '',
          })));
          setFormData({
            category: budgetToEdit.category.toString(),
            amount: budgetToEdit.amount,
            currency: ('currency' in budgetToEdit && typeof budgetToEdit.currency === 'string') ? budgetToEdit.currency as 'COP' | 'USD' | 'EUR' : 'COP',
            calculation_mode: budgetToEdit.calculation_mode,
            alert_threshold: budgetToEdit.alert_threshold,
            is_active: budgetToEdit.is_active,
          });
        } else {
          const response = await getCategoriesWithoutBudget('monthly');
          setAvailableCategories(response.categories);
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
        setAvailableCategories(expenseCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          color: cat.color,
          icon: cat.icon || '',
        })));
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadAvailableCategories();
  }, [budgetToEdit, getCategoriesWithoutBudget, expenseCategories]);

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) || 0 : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(numAmount));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.category || !formData.amount) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('El monto debe ser mayor a cero');
      return;
    }

    const alertThreshold = parseFloat(formData.alert_threshold);
    if (isNaN(alertThreshold) || alertThreshold < 0 || alertThreshold > 100) {
      setError('El umbral de alerta debe estar entre 0 y 100');
      return;
    }

    setIsSubmitting(true);
    try {
      if (budgetToEdit) {
        await updateBudget(budgetToEdit.id, {
          amount: formData.amount,
          currency: formData.currency,
          calculation_mode: formData.calculation_mode,
          alert_threshold: formData.alert_threshold,
          is_active: formData.is_active,
        });
      } else {
        await createBudget({
          category: parseInt(formData.category),
          amount: formData.amount,
          currency: formData.currency,
          calculation_mode: formData.calculation_mode,
          period: 'monthly',
          alert_threshold: formData.alert_threshold,
          is_active: formData.is_active,
        });
      }
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar el presupuesto';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = useMemo(() => {
    if (!formData.category) return null;
    const categoryId = parseInt(formData.category);
    return availableCategories.find((cat) => cat.id === categoryId) || expenseCategories.find((cat) => cat.id === categoryId);
  }, [formData.category, availableCategories, expenseCategories]);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {budgetToEdit ? 'Editar presupuesto' : 'Nuevo presupuesto'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría <span className="text-red-500">*</span>
            </label>
            {isLoadingCategories ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cargando categorías...
              </div>
            ) : availableCategories.length === 0 && !budgetToEdit ? (
              <div className="px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-800">
                No hay categorías disponibles sin presupuesto. Todas las categorías de gasto ya tienen un presupuesto mensual.
              </div>
            ) : (
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={!!budgetToEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                required
              >
                <option value="">Seleccionar categoría...</option>
                {availableCategories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {selectedCategory && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: selectedCategory.color }}
              >
                {selectedCategory.icon ? (
                  <i className={`fa-solid ${selectedCategory.icon}`} aria-hidden="true"></i>
                ) : (
                  selectedCategory.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedCategory.name}</p>
                <p className="text-xs text-gray-500">Categoría seleccionada</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Límite mensual <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            {formData.amount && (
              <p className="text-xs text-gray-600 mt-1">{formatCurrency(formData.amount)}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as 'COP' | 'USD' | 'EUR' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {availableCurrencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr === 'COP' ? 'Pesos Colombianos (COP)' : curr === 'USD' ? 'Dólares (USD)' : 'Euros (EUR)'}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Solo se contarán transacciones de cuentas con esta moneda
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modo de cálculo <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.calculation_mode}
              onChange={(e) => setFormData({ ...formData, calculation_mode: e.target.value as CalculationMode })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="base">Base (sin impuestos)</option>
              <option value="total">Total (con impuestos)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              {formData.calculation_mode === 'base'
                ? 'El presupuesto se calculará solo sobre el monto base, sin incluir impuestos.'
                : 'El presupuesto se calculará sobre el monto total, incluyendo impuestos.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Umbral de alerta (%)
            </label>
            <input
              type="number"
              value={formData.alert_threshold}
              onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
              placeholder="80"
              min="0"
              max="100"
              step="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Se activará una alerta cuando el gasto alcance este porcentaje del límite (0-100%).
            </p>
          </div>

          {budgetToEdit && (
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Presupuesto activo</span>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableCategories.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {budgetToEdit ? 'Guardar cambios' : 'Crear presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBudgetModal;
