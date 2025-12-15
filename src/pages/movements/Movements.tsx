import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Plus, Edit2, Trash2, Copy, FileText, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Calendar, X, CreditCard } from 'lucide-react';
import MovementDetailModal from '../../components/MovementDetailModal';
import NewMovementModal from '../../components/NewMovementModal';
import CreateInstallmentPlanModal from '../../components/CreateInstallmentPlanModal';
import ConfirmModal from '../../components/ConfirmModal';
import { transactionService, Transaction } from '../../services/transactionService';
import { accountService, Account } from '../../services/accountService';
import { useBudgets } from '../../context/BudgetContext';
import { useCategories } from '../../context/CategoryContext';
import { formatMoney, Currency } from '../../utils/currencyUtils';
import './movements.css';

interface Movement {
  id: number;
  date: string;
  note?: string | null;
  tag?: string | null;
  origin_account: number;
  origin_account_name?: string;
  origin_account_currency?: Currency;
  destination_account: number | null;
  destination_account_name?: string;
  type: 1 | 2 | 3 | 4;
  type_display?: string;
  base_amount: number;
  tax_percentage: number | null;
  total_amount: number;
  capital_amount?: number | null;
  interest_amount?: number | null;
  gmf_amount?: number | null;
  taxed_amount?: number | null;

  transaction_currency?: Currency | null;
  exchange_rate?: number | null;
  original_amount?: number | null;
  base_currency?: Currency;
  base_equivalent_amount?: number | null;
  base_exchange_rate?: number | null;
  base_exchange_rate_warning?: string | null;
}

interface MovementsProps {
  showTaxes: boolean;
  setShowTaxes: (value: boolean) => void;
  onBack: () => void;
}

const Movements: React.FC<MovementsProps> = ({ showTaxes, setShowTaxes, onBack }) => {
  const { refreshBudgets } = useBudgets();
  const { categories } = useCategories();
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<Transaction | null>(null);
  const [movementToDuplicate, setMovementToDuplicate] = useState<Transaction | null>(null);
  const [transactionForPlan, setTransactionForPlan] = useState<Transaction | null>(null);
  const [movements, setMovements] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<1 | 2 | 3 | 4 | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [filterAccount, setFilterAccount] = useState<number | ''>('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterCurrency, setFilterCurrency] = useState<Currency | 'all'>('COP');
  const [filterCurrencyTable, setFilterCurrencyTable] = useState<Currency | 'all'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });
  
  const [summary, setSummary] = useState<{
    income: number;
    expenses: number;
    maxIncome: number;
    maxExpense: number;
    balance: number;
    currency: Currency;
  }>({
    income: 0,
    expenses: 0,
    maxIncome: 0,
    maxExpense: 0,
    balance: 0,
    currency: 'COP',
  });

  const [summaryByCurrency, setSummaryByCurrency] = useState<Record<Currency, {
    income: number;
    expenses: number;
    maxIncome: number;
    maxExpense: number;
    balance: number;
  }>>({
    COP: { income: 0, expenses: 0, maxIncome: 0, maxExpense: 0, balance: 0 },
    USD: { income: 0, expenses: 0, maxIncome: 0, maxExpense: 0, balance: 0 },
    EUR: { income: 0, expenses: 0, maxIncome: 0, maxExpense: 0, balance: 0 },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [filterType, filterCategory, filterAccount, filterStartDate, filterEndDate, filterCurrencyTable, debouncedSearchTerm]);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const filters: {
        ordering: string;
        page: number;
        page_size: number;
        type?: 1 | 2 | 3 | 4;
        search?: string;
        category?: number;
        origin_account?: number;
        start_date?: string;
        end_date?: string;
      } = {
        ordering: '-created_at',
        page: currentPage,
        page_size: pageSize,
      };

      if (filterType !== 'all') {
        filters.type = filterType as 1 | 2 | 3 | 4;
      }
      if (debouncedSearchTerm.trim()) {
        filters.search = debouncedSearchTerm.trim();
      }
      if (filterCategory) {
        filters.category = filterCategory;
      }
      if (filterAccount) {
        filters.origin_account = filterAccount;
      }
      if (filterStartDate) {
        filters.start_date = filterStartDate;
      }
      if (filterEndDate) {
        filters.end_date = filterEndDate;
      }
      
      let paginatedResponse;
      try {
        paginatedResponse = await transactionService.listPaginated(filters);
      } catch {
        paginatedResponse = await transactionService.listPaginated(filters);
        if (Array.isArray(paginatedResponse.results)) {

          paginatedResponse.results.sort((a, b) => {
            const dateA = new Date(a.created_at || a.date).getTime();
            const dateB = new Date(b.created_at || b.date).getTime();
            return dateB - dateA;
          });
        }
      }
      
      if (!Array.isArray(paginatedResponse.results)) {
        paginatedResponse.results = [];
      }
      
      const transactionsData = paginatedResponse.results;
      
      const total = paginatedResponse.count || 0;
      const pages = Math.ceil(total / pageSize);
      setTotalPages(pages);
      setTotalCount(total);
      
      const accountsData = await accountService.getAllAccounts();

      const getTransactionCurrency = (t: Transaction): Currency => {
        if (t.origin_account_currency) {
          return t.origin_account_currency;
        }
        const account = accountsData.find(acc => acc.id === t.origin_account);
        return account?.currency || 'COP';
      };

      let filteredTransactionsData = transactionsData;
      if (filterCurrencyTable !== 'all') {
        filteredTransactionsData = transactionsData.filter(t => getTransactionCurrency(t) === filterCurrencyTable);
      }
      
      setMovements(filteredTransactionsData);
      const activeAccounts = accountsData.filter(acc => acc.is_active !== false);
      setAccounts(activeAccounts);

      const dataForSummary = filterCurrencyTable !== 'all' ? filteredTransactionsData : transactionsData;
      
      const summariesByCurrency: Record<Currency, { 
        income: number; 
        expenses: number; 
        maxIncome: number;
        maxExpense: number;
        balance: number;
      }> = {
        COP: { income: 0, expenses: 0, maxIncome: 0, maxExpense: 0, balance: 0 },
        USD: { income: 0, expenses: 0, maxIncome: 0, maxExpense: 0, balance: 0 },
        EUR: { income: 0, expenses: 0, maxIncome: 0, maxExpense: 0, balance: 0 },
      };
      
      dataForSummary.forEach(t => {
        if (!t || typeof t.total_amount !== 'number') return;
        
        const currency = getTransactionCurrency(t);
        const amountInPesos = t.total_amount / 100;
        
        if (t.type === 1) {
          summariesByCurrency[currency].income += amountInPesos;

          if (amountInPesos > summariesByCurrency[currency].maxIncome) {
            summariesByCurrency[currency].maxIncome = amountInPesos;
          }
        } else if (t.type === 2) {
          summariesByCurrency[currency].expenses += amountInPesos;

          if (amountInPesos > summariesByCurrency[currency].maxExpense) {
            summariesByCurrency[currency].maxExpense = amountInPesos;
          }
        }
      });

      Object.keys(summariesByCurrency).forEach(currency => {
        const summary = summariesByCurrency[currency as Currency];
        summary.balance = summary.income - summary.expenses;
      });
      
      setSummaryByCurrency(summariesByCurrency);

      if (filterCurrency === 'all') {

        setSummary({
          income: summariesByCurrency.COP.income,
          expenses: summariesByCurrency.COP.expenses,
          maxIncome: summariesByCurrency.COP.maxIncome,
          maxExpense: summariesByCurrency.COP.maxExpense,
          balance: summariesByCurrency.COP.balance,
          currency: 'COP',
        });
      } else {

        const selectedSummary = summariesByCurrency[filterCurrency];
        setSummary({
          income: selectedSummary.income,
          expenses: selectedSummary.expenses,
          maxIncome: selectedSummary.maxIncome,
          maxExpense: selectedSummary.maxExpense,
          balance: selectedSummary.balance,
          currency: filterCurrency,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar movimientos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterType, filterCategory, filterAccount, filterStartDate, filterEndDate, filterCurrencyTable, debouncedSearchTerm, filterCurrency, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar este movimiento? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        await performDelete(id);
      },
    });
  };

  const performDelete = async (id: number) => {
    try {
      await transactionService.delete(id);
      
      window.dispatchEvent(new Event('transactionDeleted'));
      
      if (movements.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await loadData();
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const accountsData = await accountService.getAllAccounts();
        const activeAccounts = accountsData.filter(acc => acc.is_active !== false);
        setAccounts(activeAccounts);
      } catch {
        void 0;
      }
      try {
        await refreshBudgets({ active_only: true, period: 'monthly' });
      } catch {
        void 0;
      }
      
      setTimeout(async () => {
        try {
          await refreshBudgets({ active_only: true, period: 'monthly' });
        } catch (err) {
          void err;
        }
      }, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el movimiento');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(movements.map(m => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectTransaction = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) {
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Confirmar eliminación múltiple',
      message: `¿Estás seguro de que deseas eliminar ${selectedIds.length} movimiento(s)? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        await performBulkDelete();
      },
    });
  };

  const performBulkDelete = async () => {
    try {
      const result = await transactionService.bulkDelete(selectedIds);
      
      window.dispatchEvent(new Event('transactionDeleted'));
      
      setSelectedIds([]);
      
      if (movements.length <= selectedIds.length && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
      } else {
        await loadData();
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        const accountsData = await accountService.getAllAccounts();
        const activeAccounts = accountsData.filter(acc => acc.is_active !== false);
        setAccounts(activeAccounts);
      } catch {
        void 0;
      }
      try {
        await refreshBudgets({ active_only: true, period: 'monthly' });
      } catch {
        void 0;
      }
      
      setTimeout(async () => {
        try {
          await refreshBudgets({ active_only: true, period: 'monthly' });
        } catch (err) {
          void err;
        }
      }, 2000);

      if (result.errors && result.errors.length > 0) {
        alert(`Se eliminaron ${result.deleted_count} movimiento(s), pero hubo ${result.errors.length} error(es).`);
      } else {
        alert(`Se eliminaron ${result.deleted_count} movimiento(s) exitosamente.`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar los movimientos');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setFilterType('all');
    setFilterCategory('');
    setFilterAccount('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterCurrencyTable('all');
    setSelectedIds([]);
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filterType !== 'all' || filterCategory || filterAccount || filterStartDate || filterEndDate || filterCurrencyTable !== 'all';

  const handleDuplicate = (transaction: Transaction) => {
    setMovementToDuplicate(transaction);
    setShowNewMovementModal(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setMovementToEdit(transaction);
    setShowNewMovementModal(true);
  };

  const handleModalClose = () => {
    setShowNewMovementModal(false);
    setMovementToEdit(null);
    setMovementToDuplicate(null);
  };

  const handleModalSuccess = async () => {
    await loadData();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const accountsData = await accountService.getAllAccounts();
      const activeAccounts = accountsData.filter(acc => acc.is_active !== false);
      setAccounts(activeAccounts);
    } catch (err) {
      void err;
    }
    try {
      await refreshBudgets({ active_only: true, period: 'monthly' });
    } catch (err) {
      void err;
    }
    
    setTimeout(async () => {
      try {
        await refreshBudgets({ active_only: true, period: 'monthly' });
      } catch {
        void 0;
      }
    }, 2000);
  };

  const getAccountName = (accountId: number | null): string => {
    if (!accountId) return '';
    const account = accounts.find(a => a.id === accountId);
    return account?.name || `Cuenta ${accountId}`;
  };

  const getAccountCurrency = (accountId: number | null): Currency => {
    if (!accountId) return 'COP';
    const account = accounts.find(a => a.id === accountId);
    return (account?.currency as Currency) || 'COP';
  };

  const isCreditCardAccount = (accountId: number | null): boolean => {
    if (!accountId) return false;
    const account = accounts.find(a => a.id === accountId);
    return account?.category === 'credit_card' || false;
  };

  const getTypeLabel = (type: number): string => {
    switch (type) {
      case 1: return 'Ingreso';
      case 2: return 'Gasto';
      case 3: return 'Transferencia';
      case 4: return 'Ahorro';
      default: return 'Desconocido';
    }
  };

  const getTypeColor = (type: number): string => {
    switch (type) {
      case 1: return 'text-green-600';
      case 2: return 'text-red-600';
      case 3: return 'text-gray-600';
      case 4: return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const filteredMovements = movements;

  const formatCurrency = (amount: number, currency: Currency = 'COP'): string => {
    return formatMoney(Math.abs(amount), currency);
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

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 space-y-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar (tag, descripción, nota, categoría)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 1 | 2 | 3 | 4 | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos los tipos</option>
            <option value={1}>Ingresos</option>
            <option value={2}>Gastos</option>
            <option value={3}>Transferencias</option>
            <option value={4}>Ahorros</option>
          </select>
          
          <select
            value={filterCurrencyTable}
            onChange={(e) => setFilterCurrencyTable(e.target.value as Currency | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas las monedas</option>
            <option value="COP">COP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.filter(cat => cat.is_active !== false).map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value ? Number(e.target.value) : '')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las cuentas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              placeholder="Fecha desde"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              placeholder="Fecha hasta"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <span className="text-sm text-gray-600">
              {totalCount} movimiento(s) encontrado(s)
            </span>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Limpiar filtros
            </button>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-200 bg-blue-50 p-3 rounded-lg">
            <span className="text-sm font-medium text-blue-900">
              {selectedIds.length} movimiento(s) seleccionado(s)
            </span>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar seleccionados
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <label className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200 transition-colors">
          <input 
            type="checkbox" 
            checked={showTaxes}
            onChange={(e) => setShowTaxes(e.target.checked)}
            className="w-3 h-3 text-blue-600 rounded"
          />
          Mostrar desglose fiscal
        </label>
        
        {}
        <div className="flex items-center gap-2 px-3 py-1 bg-white border border-gray-300 rounded-full text-sm">
          <span className="text-gray-600 font-medium">Moneda:</span>
          <select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value as Currency | 'all')}
            className="bg-transparent border-none outline-none text-gray-700 font-medium cursor-pointer"
          >
            <option value="all">Todas</option>
            <option value="COP">COP</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          </select>
        </div>
      </div>

      {}
      {filterCurrency === 'all' ? (

        (['COP', 'USD', 'EUR'] as Currency[]).map(currency => {
          const currencySummary = summaryByCurrency[currency];
          const hasData = currencySummary.income > 0 || currencySummary.expenses > 0;
          
          if (!hasData) return null;
          
          return (
            <div key={currency} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">{currency} - Resumen</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <p className="text-xs font-medium text-gray-600">Mayor Gasto</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">
                    {currencySummary.maxExpense > 0 ? formatCurrency(Math.round(currencySummary.maxExpense * 100), currency) : 'Sin gastos'}
                  </p>
                  {currencySummary.maxExpense > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Este mes</p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-xs font-medium text-gray-600">Mayor Ingreso</p>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    {currencySummary.maxIncome > 0 ? formatCurrency(Math.round(currencySummary.maxIncome * 100), currency) : 'Sin ingresos'}
                  </p>
                  {currencySummary.maxIncome > 0 && (
                    <p className="text-xs text-gray-500 mt-1">Este mes</p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-purple-600" />
                    <p className="text-xs font-medium text-gray-600">Total Gastado</p>
                  </div>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(Math.round(currencySummary.expenses * 100), currency)}</p>
                  <p className="text-xs text-gray-500 mt-1">Período actual</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <p className="text-xs font-medium text-gray-600">Total Recibido</p>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(Math.round(currencySummary.income * 100), currency)}</p>
                  <p className="text-xs text-gray-500 mt-1">Período actual</p>
                </div>
              </div>
            </div>
          );
        })
      ) : (

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <p className="text-xs font-medium text-gray-600">Mayor Gasto</p>
            </div>
            <p className="text-xl font-bold text-red-600">
              {summary.maxExpense > 0 ? formatCurrency(Math.round(summary.maxExpense * 100), summary.currency) : 'Sin gastos'}
            </p>
            {summary.maxExpense > 0 && (
              <p className="text-xs text-gray-500 mt-1">Este mes</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs font-medium text-gray-600">Mayor Ingreso</p>
            </div>
            <p className="text-xl font-bold text-green-600">
              {summary.maxIncome > 0 ? formatCurrency(Math.round(summary.maxIncome * 100), summary.currency) : 'Sin ingresos'}
            </p>
            {summary.maxIncome > 0 && (
              <p className="text-xs text-gray-500 mt-1">Este mes</p>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-medium text-gray-600">Total Gastado</p>
            </div>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(Math.round(summary.expenses * 100), summary.currency)}</p>
            <p className="text-xs text-gray-500 mt-1">Período actual</p>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <p className="text-xs font-medium text-gray-600">Total Recibido</p>
            </div>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(Math.round(summary.income * 100), summary.currency)}</p>
            <p className="text-xs text-gray-500 mt-1">Período actual</p>
          </div>
        </div>
      )}

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto movements-table-container">
          <table className="w-full min-w-[1000px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12 sticky left-0 bg-gray-50 z-10 border-r border-gray-200">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredMovements.length && filteredMovements.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Nota</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Categoría</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[150px]">Cuenta</th>
              {showTaxes && (
                <>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Base</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">IVA</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">GMF</th>
                </>
              )}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Total</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">En moneda base</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap sticky right-0 bg-gray-50 z-10 border-l border-gray-200">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={showTaxes ? 12 : 9} className="px-4 py-12">
                  <div className="text-center">
                    <p className="text-gray-600">Cargando movimientos...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={showTaxes ? 12 : 9} className="px-4 py-12">
                  <div className="text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                      onClick={loadData}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Reintentar
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={showTaxes ? 12 : 9} className="px-4 py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {hasActiveFilters ? 'No se encontraron movimientos' : '¡Comencemos a registrar tus movimientos!'}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {hasActiveFilters ? 'Intenta con otros filtros de búsqueda' : 'No hay movimientos registrados aún'}
                    </p>
                    {!searchTerm && filterType === 'all' && (
                    <button
                      onClick={() => setShowNewMovementModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar tu primer movimiento
                    </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredMovements.map((mov) => (
              <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 text-center sticky left-0 bg-white z-10 border-r border-gray-200 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(mov.id)}
                    onChange={(e) => handleSelectTransaction(mov.id, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                  {new Date(mov.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {mov.note || getTypeLabel(mov.type)}
                    </div>
                  {mov.tag && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
                      {mov.tag}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {mov.category_name ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {mov.category_name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getTypeLabel(mov.type)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-600">
                  {mov.type === 3 ? (
                    <span>{getAccountName(mov.origin_account)} → {getAccountName(mov.destination_account)}</span>
                  ) : (
                    getAccountName(mov.origin_account)
                  )}
                </td>
                {showTaxes && (
                  <>
                    <td className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                      {formatCurrency(mov.base_amount, getAccountCurrency(mov.origin_account))}
                    </td>
                    <td className="px-4 py-4 text-sm text-amber-600 text-right whitespace-nowrap">
                      {mov.tax_percentage && mov.tax_percentage > 0 
                        ? formatCurrency(mov.taxed_amount ?? (mov.total_amount - mov.base_amount - (mov.gmf_amount || 0)), getAccountCurrency(mov.origin_account))
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-4 text-sm text-blue-600 text-right whitespace-nowrap">
                      {mov.gmf_amount && mov.gmf_amount > 0 ? formatCurrency(mov.gmf_amount, getAccountCurrency(mov.origin_account)) : '-'}
                    </td>
                  </>
                )}
                <td className={`px-4 py-4 text-sm font-semibold text-right whitespace-nowrap ${getTypeColor(mov.type)}`}>
                  {mov.type === 1 ? '+' : mov.type === 2 ? '-' : ''}{formatCurrency(mov.total_amount, getAccountCurrency(mov.origin_account))}
                  <span className="ml-1 text-xs text-gray-500">({getAccountCurrency(mov.origin_account)})</span>
                </td>
                <td className="px-4 py-4 text-sm text-gray-600 text-right whitespace-nowrap">
                  {mov.base_currency && mov.base_equivalent_amount !== null && mov.base_equivalent_amount !== undefined ? (
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-indigo-600">
                        {formatCurrency(mov.base_equivalent_amount, mov.base_currency)}
                      </span>
                      {mov.base_exchange_rate && mov.base_exchange_rate !== 1 && (
                        <span className="text-xs text-gray-500">
                          TC: {mov.base_exchange_rate.toFixed(4)}
                        </span>
                      )}
                      {mov.base_exchange_rate_warning && (
                        <span className="text-xs text-amber-600" title={mov.base_exchange_rate_warning}>
                          ⚠️
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Confirmado
                  </span>
                </td>
                <td className="px-4 py-4 text-right sticky right-0 bg-white z-10 border-l border-gray-200 hover:bg-gray-50">
                  <div className="flex items-center justify-end gap-2">
                    {mov.type === 2 && isCreditCardAccount(mov.origin_account) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTransactionForPlan(mov);
                        }}
                        className="p-2 hover:bg-blue-50 rounded transition-colors border border-gray-200 hover:border-blue-300"
                        title="Crear plan de cuotas"
                      >
                        <CreditCard className="w-4 h-4 text-blue-600" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(mov);
                      }}
                      className="p-2 hover:bg-green-50 rounded transition-colors border border-gray-200 hover:border-green-300"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-green-600" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(mov);
                      }}
                      className="p-2 hover:bg-purple-50 rounded transition-colors border border-gray-200 hover:border-purple-300"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4 text-purple-600" />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(mov.id);
                      }}
                      className="p-2 hover:bg-red-50 rounded transition-colors border border-red-200 hover:border-red-300"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <p className="text-gray-600">Cargando movimientos...</p>
          </div>
        ) : error ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              Reintentar
            </button>
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'No se encontraron movimientos' : '¡Comencemos a registrar tus movimientos!'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' ? 'Intenta con otros filtros de búsqueda' : 'No hay movimientos registrados aún'}
            </p>
            {!searchTerm && filterType === 'all' && (
            <button
              onClick={() => setShowNewMovementModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar tu primer movimiento
            </button>
            )}
          </div>
        ) : (
          filteredMovements.map((mov) => (
          <div 
            key={mov.id} 
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3 mb-2">
              <input
                type="checkbox"
                checked={selectedIds.includes(mov.id)}
                onChange={(e) => handleSelectTransaction(mov.id, e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => setSelectedMovement(mov)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{mov.note || getTypeLabel(mov.type)}</h4>
                    <p className="text-sm text-gray-600">{new Date(mov.date).toLocaleDateString('es-CO')}</p>
                    {mov.tag && (
                      <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
                        {mov.tag}
                      </span>
                    )}
                  </div>
                  <p className={`text-lg font-semibold ${getTypeColor(mov.type)}`}>
                    {mov.type === 1 ? '+' : mov.type === 2 ? '-' : ''}{formatCurrency(mov.total_amount, getAccountCurrency(mov.origin_account))}
                  </p>
                </div>
              </div>
            </div>
            
            {mov.type === 3 && mov.destination_account && (mov.capital_amount || mov.interest_amount) && (
              <div className="text-xs mb-2 space-y-1">
                {mov.capital_amount && mov.capital_amount > 0 && (
                  <div className="text-green-600">Capital: {formatCurrency(mov.capital_amount, getAccountCurrency(mov.origin_account))}</div>
                )}
                {mov.interest_amount && mov.interest_amount > 0 && (
                  <div className="text-amber-600">Intereses: {formatCurrency(mov.interest_amount, getAccountCurrency(mov.origin_account))}</div>
                )}
              </div>
            )}
            
            {showTaxes && ((mov.tax_percentage && mov.tax_percentage > 0) || mov.gmf_amount) && (
              <div className="text-xs text-gray-600 mb-2 space-y-1">
                <div>Base: {formatCurrency(mov.base_amount, getAccountCurrency(mov.origin_account))}</div>
                {mov.tax_percentage && mov.tax_percentage > 0 && (
                  <div>IVA: {formatCurrency(mov.taxed_amount ?? (mov.total_amount - mov.base_amount - (mov.gmf_amount || 0)), getAccountCurrency(mov.origin_account))}</div>
                )}
                {mov.gmf_amount && mov.gmf_amount > 0 && (
                  <div className="text-blue-600">GMF: {formatCurrency(mov.gmf_amount, getAccountCurrency(mov.origin_account))}</div>
                )}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2 mb-3">
              {mov.category_name ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {mov.category_name}
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {getTypeLabel(mov.type)}
              </span>
              )}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Confirmado
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {mov.type === 3 ? `${getAccountName(mov.origin_account)} → ${getAccountName(mov.destination_account)}` : getAccountName(mov.origin_account)}
              </span>
            </div>
            
            <div className="flex gap-2">
              {mov.type === 2 && isCreditCardAccount(mov.origin_account) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setTransactionForPlan(mov);
                  }}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Crear plan de cuotas"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(mov);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Editar
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDuplicate(mov);
                }}
                className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                title="Duplicar"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(mov.id);
                }}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-medium">
                {movements.length > 0 ? ((currentPage - 1) * pageSize + 1) : 0}
              </span> - <span className="font-medium">
                {Math.min(currentPage * pageSize, totalCount)}
              </span> de <span className="font-medium">{totalCount}</span> movimientos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    disabled={isLoading}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
      
      {totalPages <= 1 && totalCount > 0 && (
        <div className="flex items-center justify-center">
          <p className="text-sm text-gray-600">
            Mostrando <span className="font-medium">{totalCount}</span> movimiento{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {selectedMovement && (
        <MovementDetailModal 
          movement={selectedMovement} 
          onClose={() => setSelectedMovement(null)} 
          onEdit={() => {
            const mov = movements.find(m => m.id === selectedMovement.id);
            if (mov) {
              setSelectedMovement(null);
              handleEdit(mov);
            }
          }}
          onDelete={() => {
            if (selectedMovement) {
              setSelectedMovement(null);
              handleDelete(selectedMovement.id);
            }
          }}
        />
      )}

      {showNewMovementModal && (
        <NewMovementModal 
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
          transactionToEdit={movementToEdit || undefined}
          transactionToDuplicate={movementToDuplicate || undefined}
        />
      )}

      {transactionForPlan && (
        <CreateInstallmentPlanModal
          purchaseTransaction={transactionForPlan}
          onClose={() => setTransactionForPlan(null)}
          onSuccess={() => {
            setTransactionForPlan(null);
            loadData();
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.title === 'Error' ? 'Aceptar' : 'Eliminar'}
        cancelText={confirmModal.title === 'Error' ? undefined : 'Cancelar'}
        type={confirmModal.title === 'Error' ? 'danger' : 'warning'}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
      />
    </div>
  );
};

export default Movements;

