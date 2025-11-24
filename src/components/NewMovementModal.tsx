import React, { useMemo, useState, useEffect } from 'react';
import { XCircle, TrendingDown, TrendingUp, ArrowRight, Tag } from 'lucide-react';
import './NewMovementModal.css';
import { useCategories } from '../context/CategoryContext';
import { transactionService, CreateTransactionData, TransactionType, Transaction } from '../services/transactionService';
import { accountService, Account } from '../services/accountService';

interface NewMovementModalProps {
  onClose: () => void;
  onSuccess?: () => void;
  transactionToEdit?: Transaction;
  transactionToDuplicate?: Transaction;
}

const NewMovementModal: React.FC<NewMovementModalProps> = ({ onClose, onSuccess, transactionToEdit, transactionToDuplicate }) => {
  const { getActiveCategoriesByType, createCategory } = useCategories();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Determinar si es edición o duplicación
  const isEdit = !!transactionToEdit;
  const isDuplicate = !!transactionToDuplicate;
  const sourceTransaction = transactionToEdit || transactionToDuplicate;

  const getInitialFormData = () => {
    if (sourceTransaction) {
      const type = sourceTransaction.type === 1 ? 'income' : sourceTransaction.type === 2 ? 'expense' : sourceTransaction.type === 3 ? 'transfer' : 'expense';
      const baseAmount = sourceTransaction.base_amount || 0;
      const taxRate = sourceTransaction.tax_percentage || 0;
      const totalAmount = sourceTransaction.total_amount || baseAmount;
      
      return {
        type: type as 'income' | 'expense' | 'transfer',
        date: isDuplicate ? new Date().toISOString().split('T')[0] : (sourceTransaction.date || new Date().toISOString().split('T')[0]),
        note: isDuplicate ? (sourceTransaction.note ? `${sourceTransaction.note} (duplicado)` : 'Duplicado') : (sourceTransaction.note || ''),
        tag: sourceTransaction.tag || '',
        category: sourceTransaction.category?.toString() || '',
        originAccount: sourceTransaction.origin_account?.toString() || '',
        destinationAccount: sourceTransaction.destination_account?.toString() || '',
        amount: totalAmount.toString(),
        base: baseAmount.toString(),
        taxRate: taxRate || 0,
      };
    }
    
    return {
      type: 'expense' as 'income' | 'expense' | 'transfer',
    date: new Date().toISOString().split('T')[0],
      note: '',
      tag: '',
    category: '',
      originAccount: '',
      destinationAccount: '',
    amount: '',
    base: '',
      taxRate: 0, // Por defecto sin IVA
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());
  const [calculationMode, setCalculationMode] = useState<'total' | 'base'>('total');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    // Actualizar formulario cuando cambien las props
    const sourceTransaction = transactionToEdit || transactionToDuplicate;
    if (sourceTransaction) {
      const type = sourceTransaction.type === 1 ? 'income' : sourceTransaction.type === 2 ? 'expense' : sourceTransaction.type === 3 ? 'transfer' : 'expense';
      const baseAmount = sourceTransaction.base_amount || 0;
      const taxRate = sourceTransaction.tax_percentage || 0;
      const totalAmount = sourceTransaction.total_amount || baseAmount;
      
      setFormData({
        type: type as 'income' | 'expense' | 'transfer',
        date: isDuplicate ? new Date().toISOString().split('T')[0] : (sourceTransaction.date || new Date().toISOString().split('T')[0]),
        note: isDuplicate ? (sourceTransaction.note ? `${sourceTransaction.note} (duplicado)` : 'Duplicado') : (sourceTransaction.note || ''),
        tag: sourceTransaction.tag || '',
        category: sourceTransaction.category?.toString() || '',
        originAccount: sourceTransaction.origin_account?.toString() || '',
        destinationAccount: sourceTransaction.destination_account?.toString() || '',
        amount: totalAmount.toString(),
        base: baseAmount.toString(),
        taxRate: taxRate || 0,
      });
    }
  }, [transactionToEdit, transactionToDuplicate, isDuplicate]);

  // Manejo de teclado: Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const accountsData = await accountService.getAllAccounts();
      // Filtrar solo cuentas activas
      const activeAccounts = accountsData.filter(acc => acc.is_active !== false);
      setAccounts(activeAccounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cuentas');
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const getAccountAvailableBalance = (accountId: string): { available: number; isCredit: boolean; limit?: number } | null => {
    const account = accounts.find(acc => acc.id?.toString() === accountId);
    if (!account) return null;

    if (account.account_type === 'liability') {
      // Para tarjetas de crédito: crédito disponible = límite - deuda actual
      const limit = account.credit_limit || 0;
      const debt = Math.abs(account.current_balance); // La deuda es negativa, tomamos el valor absoluto
      const available = limit - debt;
      return { available, isCredit: true, limit };
    } else {
      // Para activos: saldo disponible = saldo actual
      return { available: account.current_balance, isCredit: false };
    }
  };

  const validateAccountBalance = (accountId: string, amount: number, isExpense: boolean): string | null => {
    const accountInfo = getAccountAvailableBalance(accountId);
    if (!accountInfo) return null;

    if (accountInfo.isCredit) {
      // Validación para tarjetas de crédito
      if (isExpense && amount > accountInfo.available) {
        return `El monto excede el crédito disponible. Crédito disponible: ${formatCurrency(accountInfo.available)}, Límite: ${formatCurrency(accountInfo.limit || 0)}`;
      }
    } else {
      // Validación para cuentas de activo
      if (isExpense && amount > accountInfo.available) {
        return `El monto excede el saldo disponible. Saldo disponible: ${formatCurrency(accountInfo.available)}`;
      }
    }

    return null;
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsCreatingCategory(true);
      const categoryType = formData.type === 'income' ? 'income' : 'expense';
      const payload = {
        name: newCategoryName.trim(),
        type: categoryType as 'income' | 'expense',
      };
      await createCategory(payload);
      setNewCategoryName('');
      setShowNewCategoryForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear categoría');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const availableCategories = useMemo(() => {
    if (formData.type === 'transfer') {
      return [];
    }
    const type = formData.type === 'income' ? 'income' : 'expense';
    return getActiveCategoriesByType(type);
  }, [formData.type, getActiveCategoriesByType]);

  const getTransactionType = (): TransactionType => {
    if (formData.type === 'income') return 1;
    if (formData.type === 'expense') return 2;
    return 3; // transfer
  };

  const handleAmountChange = (value: string, mode: 'total' | 'base') => {
    if (mode === 'total') {
      const total = parseFloat(value) || 0;
      // Si no hay IVA, base = total
      const base = formData.taxRate > 0 ? total / (1 + formData.taxRate / 100) : total;
      setFormData({ ...formData, amount: value, base: base.toFixed(2) });
    } else {
      const base = parseFloat(value) || 0;
      // Si no hay IVA, total = base
      const iva = formData.taxRate > 0 ? base * (formData.taxRate / 100) : 0;
      const total = base + iva;
      setFormData({ ...formData, base: value, amount: total.toFixed(2) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!formData.originAccount) {
      setError('Debes seleccionar una cuenta origen');
      return;
    }

    // Validar que la cuenta origen esté activa
    const originAccount = accounts.find(acc => acc.id?.toString() === formData.originAccount);
    if (!originAccount || originAccount.is_active === false) {
      setError('La cuenta origen seleccionada no está activa');
      return;
    }

    if (formData.type === 'transfer') {
      if (!formData.destinationAccount) {
        setError('Las transferencias requieren una cuenta destino');
        return;
      }

      // Validar que la cuenta destino esté activa
      const destinationAccount = accounts.find(acc => acc.id?.toString() === formData.destinationAccount);
      if (!destinationAccount || destinationAccount.is_active === false) {
        setError('La cuenta destino seleccionada no está activa');
        return;
      }

      if (formData.originAccount === formData.destinationAccount) {
        setError('Las cuentas origen y destino deben ser diferentes');
        return;
      }
    }

    const baseAmount = parseFloat(formData.base) || parseFloat(formData.amount) || 0;
    if (baseAmount <= 0) {
      setError('El monto debe ser mayor a cero');
      return;
    }

    // Validar categoría para ingresos y gastos
    if (formData.type !== 'transfer' && !formData.category) {
      setError('Debes seleccionar una categoría para ingresos y gastos');
      return;
    }

    // Validación preventiva de saldos (el backend también validará)
    if (formData.type === 'expense' && formData.originAccount) {
      const balanceWarning = validateAccountBalance(formData.originAccount, baseAmount, true);
      if (balanceWarning) {
        // Mostrar advertencia pero permitir intentar (el backend validará definitivamente)
        if (!window.confirm(`${balanceWarning}\n\n¿Deseas continuar de todas formas? El backend validará el límite.`)) {
          return;
        }
      }
    }

    try {
      setIsSubmitting(true);
      
      // Construir el objeto de datos según lo que el backend espera
      const transactionData: CreateTransactionData = {
        origin_account: Number(formData.originAccount),
        type: getTransactionType(),
        base_amount: baseAmount,
        date: formData.date,
      };

      // Agregar categoría solo para ingresos y gastos (no para transferencias)
      if (formData.type !== 'transfer' && formData.category) {
        transactionData.category = Number(formData.category);
      }

      // Solo agregar destination_account si es una transferencia
      if (formData.type === 'transfer' && formData.destinationAccount) {
        transactionData.destination_account = Number(formData.destinationAccount);
      }

      // Solo agregar tax_percentage si es mayor a 0
      if (formData.taxRate > 0) {
        transactionData.tax_percentage = formData.taxRate;
      }

      // Agregar tag y note solo si tienen valor
      const tagValue = formData.tag.trim();
      const noteValue = formData.note.trim();
      if (tagValue) {
        transactionData.tag = tagValue;
      }
      if (noteValue) {
        transactionData.note = noteValue;
      }

      if (isEdit && transactionToEdit) {
        await transactionService.update(transactionToEdit.id, transactionData);
      } else {
        await transactionService.create(transactionData);
      }

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar el movimiento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 id="modal-title" className="text-xl font-bold text-gray-900">
              {isEdit ? 'Editar movimiento' : isDuplicate ? 'Duplicar movimiento' : 'Nuevo movimiento'}
            </h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600"
              aria-label="Cerrar modal"
              type="button"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de movimiento</label>
              <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de movimiento">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'expense'
                      ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-pressed={formData.type === 'expense'}
                >
                  <TrendingDown className="w-5 h-5 inline mr-2" aria-hidden="true" />
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'income'
                      ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-pressed={formData.type === 'income'}
                >
                  <TrendingUp className="w-5 h-5 inline mr-2" aria-hidden="true" />
                  Ingreso
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'transfer', category: '' })}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.type === 'transfer'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  aria-pressed={formData.type === 'transfer'}
                >
                  <ArrowRight className="w-5 h-5 inline mr-2" aria-hidden="true" />
                  Transferencia
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="movement-date" className="block text-sm font-medium text-gray-700 mb-2">Fecha</label>
                <input
                  id="movement-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-required="true"
                />
              </div>

            </div>

            <div>
              <label htmlFor="movement-note" className="block text-sm font-medium text-gray-700 mb-2">Nota (opcional)</label>
              <input
                id="movement-note"
                type="text"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                placeholder="Ej: Almuerzo con amigos"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-describedby="note-description"
              />
              <p id="note-description" className="sr-only">Campo opcional para agregar una nota descriptiva al movimiento</p>
            </div>

            <div>
              <label htmlFor="movement-tag" className="block text-sm font-medium text-gray-700 mb-2">Etiqueta (opcional)</label>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-gray-400" aria-hidden="true" />
                <input
                  id="movement-tag"
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="Ej: #hogar, #viaje"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  aria-describedby="tag-description"
                />
              </div>
              <p id="tag-description" className="text-xs text-gray-500 mt-1">Usa etiquetas para filtrar tus movimientos fácilmente</p>
            </div>

            {formData.type === 'transfer' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="transfer-origin-account" className="block text-sm font-medium text-gray-700 mb-2">Cuenta origen *</label>
                  {isLoadingAccounts ? (
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                      Cargando cuentas...
                    </div>
                  ) : (
                  <select
                      id="transfer-origin-account"
                      value={formData.originAccount}
                      onChange={(e) => setFormData({ ...formData, originAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                  >
                    <option value="">Seleccionar...</option>
                      {accounts.filter(acc => acc.id?.toString() !== formData.destinationAccount).map(acc => {
                        const accountInfo = getAccountAvailableBalance(acc.id?.toString() || '');
                        const displayName = accountInfo?.isCredit 
                          ? `${acc.name} (Crédito: ${formatCurrency(accountInfo.available)})`
                          : `${acc.name} (Saldo: ${formatCurrency(acc.current_balance)})`;
                        return (
                          <option key={acc.id} value={acc.id}>{displayName}</option>
                        );
                      })}
                  </select>
                  )}
                </div>
                <div>
                  <label htmlFor="transfer-destination-account" className="block text-sm font-medium text-gray-700 mb-2">Cuenta destino *</label>
                  {isLoadingAccounts ? (
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                      Cargando cuentas...
                    </div>
                  ) : (
                  <select
                      id="transfer-destination-account"
                      value={formData.destinationAccount}
                      onChange={(e) => setFormData({ ...formData, destinationAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                  >
                    <option value="">Seleccionar...</option>
                      {accounts.filter(acc => acc.id?.toString() !== formData.originAccount).map(acc => {
                        const accountInfo = getAccountAvailableBalance(acc.id?.toString() || '');
                        const displayName = accountInfo?.isCredit 
                          ? `${acc.name} (Crédito: ${formatCurrency(accountInfo.available)})`
                          : `${acc.name} (Saldo: ${formatCurrency(acc.current_balance)})`;
                        return (
                          <option key={acc.id} value={acc.id}>{displayName}</option>
                        );
                      })}
                  </select>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="movement-category" className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                  {availableCategories.length === 0 ? (
                    <div className="px-3 py-2 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-800 space-y-1" role="alert">
                      <p>No hay categorías activas para este tipo.</p>
                      <button
                        type="button"
                        onClick={() => setShowNewCategoryForm(true)}
                        className="text-xs text-amber-900 underline hover:text-amber-700"
                        aria-describedby="category-empty-description"
                      >
                        Crear nueva categoría
                      </button>
                      <p id="category-empty-description" className="sr-only">Botón para crear una nueva categoría para este tipo de movimiento</p>
                    </div>
                  ) : (
                    <select
                      id="movement-category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                    >
                      <option value="">Seleccionar...</option>
                      {availableCategories.map((cat) => (
                        <option key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {showNewCategoryForm && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg" role="region" aria-label="Formulario de nueva categoría">
                      <label htmlFor="new-category-name" className="sr-only">Nombre de la categoría</label>
                      <input
                        id="new-category-name"
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Nombre de la categoría"
                        className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm mb-2"
                        aria-required="true"
                      />
                      <div className="flex gap-2">
                      <button
                        type="button"
                          onClick={handleCreateCategory}
                          disabled={isCreatingCategory || !newCategoryName.trim()}
                          className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                          aria-busy={isCreatingCategory}
                        >
                          {isCreatingCategory ? 'Creando...' : 'Crear'}
                      </button>
                      <button
                        type="button"
                          onClick={() => {
                            setShowNewCategoryForm(false);
                            setNewCategoryName('');
                          }}
                          className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
                        >
                          Cancelar
                      </button>
                      </div>
                  </div>
                )}
              </div>
              <div>
                  <label htmlFor="movement-account" className="block text-sm font-medium text-gray-700 mb-2">Cuenta *</label>
                  {isLoadingAccounts ? (
                    <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-500" aria-live="polite" aria-busy="true">
                      Cargando cuentas...
                    </div>
                  ) : (
                    <>
                      <select
                        id="movement-account"
                        value={formData.originAccount}
                        onChange={(e) => setFormData({ ...formData, originAccount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                        aria-required="true"
                      >
                        <option value="">Seleccionar...</option>
                        {accounts.map(acc => {
                          const accountInfo = getAccountAvailableBalance(acc.id?.toString() || '');
                          const displayName = accountInfo?.isCredit 
                            ? `${acc.name} (Crédito disponible: ${formatCurrency(accountInfo.available)})`
                            : `${acc.name} (Saldo: ${formatCurrency(acc.current_balance)})`;
                          return (
                            <option key={acc.id} value={acc.id}>{displayName}</option>
                          );
                        })}
                      </select>
                      {formData.originAccount && formData.type === 'expense' && (() => {
                        const accountInfo = getAccountAvailableBalance(formData.originAccount);
                        if (!accountInfo) return null;
                        const isLow = accountInfo.isCredit 
                          ? accountInfo.available < 100000 
                          : accountInfo.available < 50000;
                        if (isLow) {
                          return (
                            <p className="text-xs text-amber-600 mt-1" role="alert">
                              ⚠️ {accountInfo.isCredit ? 'Crédito disponible bajo' : 'Saldo bajo'}: {formatCurrency(accountInfo.available)}
                            </p>
                          );
                        }
                        return null;
                      })()}
                    </>
                  )}
                  </div>
              </div>
            )}


            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-medium text-gray-700">Monto *</label>
                <div className="flex gap-2" role="radiogroup" aria-label="Modo de cálculo de monto">
                  <button
                    type="button"
                    onClick={() => {
                      setCalculationMode('total');
                      // Si cambiamos a modo "sin IVA", resetear IVA a 0 y hacer base = amount
                      if (formData.amount) {
                        setFormData({ ...formData, taxRate: 0, base: formData.amount });
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      calculationMode === 'total' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                    aria-pressed={calculationMode === 'total'}
                  >
                    Sin IVA
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalculationMode('base')}
                    className={`px-3 py-1 text-xs rounded ${
                      calculationMode === 'base' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}
                    aria-pressed={calculationMode === 'base'}
                  >
                    Con IVA
                  </button>
                </div>
              </div>

              {calculationMode === 'total' ? (
                <>
                  <label htmlFor="movement-amount-total" className="block text-xs text-gray-600 mb-1">Monto pagado (sin IVA)</label>
                  <input
                    id="movement-amount-total"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      // En modo "sin IVA", el monto es el total y la base es igual
                      setFormData({ ...formData, amount: value, base: value, taxRate: 0 });
                    }}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
                    required
                    aria-required="true"
                    aria-describedby="amount-total-description"
                  />
                  <p id="amount-total-description" className="mt-2 text-xs text-gray-500">
                    Ingresa el monto total que pagaste. No se aplicará IVA.
                  </p>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="movement-base-amount" className="block text-xs text-gray-600 mb-1">Base gravable *</label>
                    <input
                      id="movement-base-amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.base}
                      onChange={(e) => handleAmountChange(e.target.value, 'base')}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                      aria-required="true"
                    />
                  </div>
                  <div>
                    <label htmlFor="movement-tax-rate" className="block text-xs text-gray-600 mb-1">IVA (%)</label>
                    <input
                      id="movement-tax-rate"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.taxRate}
                      onChange={(e) => {
                        const newRate = parseFloat(e.target.value) || 0;
                        const updatedFormData = { ...formData, taxRate: newRate };
                        setFormData(updatedFormData);
                        if (updatedFormData.base) {
                          // Usar el nuevo taxRate para el cálculo
                          const base = parseFloat(updatedFormData.base) || 0;
                          const iva = newRate > 0 ? base * (newRate / 100) : 0;
                          const total = base + iva;
                          setFormData({ ...updatedFormData, amount: total.toFixed(2) });
                        }
                      }}
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      aria-describedby="tax-rate-description"
                    />
                    <p id="tax-rate-description" className="mt-1 text-xs text-gray-500">
                      Ingresa el porcentaje de IVA (ej: 0, 5, 19)
                    </p>
                  </div>
                  <div className="pt-2 border-t">
                    <label className="block text-xs text-gray-600 mb-1">Total a pagar</label>
                    <p className="text-lg font-bold text-gray-900" aria-live="polite" id="total-amount-display" data-testid="total-amount-display">
                      {formatCurrency(parseFloat(formData.amount) || 0)}
                    </p>
                    {formData.base && formData.taxRate > 0 && (
                      <p className="text-xs text-gray-500 mt-1" aria-label="Desglose del total">
                        Base: {formatCurrency(parseFloat(formData.base) || 0)} + IVA ({formData.taxRate}%): {formatCurrency((parseFloat(formData.amount) || 0) - (parseFloat(formData.base) || 0))}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                aria-label="Cancelar y cerrar el formulario"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isLoadingAccounts}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                aria-busy={isSubmitting}
                aria-disabled={isSubmitting || isLoadingAccounts}
              >
                {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar movimiento' : 'Guardar movimiento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewMovementModal;

