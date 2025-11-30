import React, { useState, useEffect } from 'react';
import { Search, Download, Plus, Edit2, Trash2, Copy, FileText, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import MovementDetailModal from '../../components/MovementDetailModal';
import NewMovementModal from '../../components/NewMovementModal';
import ConfirmModal from '../../components/ConfirmModal';
import { transactionService, Transaction } from '../../services/transactionService';
import { accountService, Account } from '../../services/accountService';
import { useBudgets } from '../../context/BudgetContext';
import './movements.css';

interface Movement {
  id: number;
  date: string;
  note?: string | null;
  tag?: string | null;
  origin_account: number;
  origin_account_name?: string;
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
}

interface MovementsProps {
  showTaxes: boolean;
  setShowTaxes: (value: boolean) => void;
  onBack: () => void;
}

const Movements: React.FC<MovementsProps> = ({ showTaxes, setShowTaxes, onBack }) => {
  const { refreshBudgets } = useBudgets();
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
  const [showNewMovementModal, setShowNewMovementModal] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<Transaction | null>(null);
  const [movementToDuplicate, setMovementToDuplicate] = useState<Transaction | null>(null);
  const [movements, setMovements] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<1 | 2 | 3 | 4 | 'all'>('all');
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
  
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
  });

  useEffect(() => {
    setCurrentPage(1);
    loadData();
  }, [filterType]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      let paginatedResponse;
      try {
        paginatedResponse = await transactionService.listPaginated({ 
          ordering: '-date',
          page: currentPage,
          page_size: pageSize,
          ...(filterType !== 'all' && { type: filterType as 1 | 2 | 3 | 4 })
        });
      } catch {
        paginatedResponse = await transactionService.listPaginated({ 
          page: currentPage,
          page_size: pageSize,
          ...(filterType !== 'all' && { type: filterType as 1 | 2 | 3 | 4 })
        });
        if (Array.isArray(paginatedResponse.results)) {
          paginatedResponse.results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      
      setMovements(transactionsData);
      const activeAccounts = accountsData.filter(acc => acc.is_active !== false);
      setAccounts(activeAccounts);
      
      const income = transactionsData
        .filter(t => t && t.type === 1 && typeof t.total_amount === 'number')
        .reduce((sum, t) => sum + t.total_amount, 0);
      const expenses = transactionsData
        .filter(t => t && t.type === 2 && typeof t.total_amount === 'number')
        .reduce((sum, t) => sum + t.total_amount, 0);
      
      setSummary({
        income,
        expenses,
        balance: income - expenses,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar movimientos';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

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
        // Intentionally empty
      }
      try {
        await refreshBudgets({ active_only: true, period: 'monthly' });
      } catch {
        // Intentionally empty
      }
      
      setTimeout(async () => {
        try {
          await refreshBudgets({ active_only: true, period: 'monthly' });
        } catch {
          // Intentionally empty
        }
      }, 2000);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al eliminar el movimiento');
    }
  };

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
    } catch {
      // Intentionally empty
    }
    try {
      await refreshBudgets({ active_only: true, period: 'monthly' });
    } catch {
      // Intentionally empty
    }
    
    setTimeout(async () => {
      try {
        await refreshBudgets({ active_only: true, period: 'monthly' });
      } catch {
        // Intentionally empty
      }
    }, 2000);
  };

  const getAccountName = (accountId: number | null): string => {
    if (!accountId) return '';
    const account = accounts.find(a => a.id === accountId);
    return account?.name || `Cuenta ${accountId}`;
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

  const filteredMovements = Array.isArray(movements) ? movements.filter(mov => {
    if (!mov) return false;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const note = mov.note?.toLowerCase() || '';
      const tag = mov.tag?.toLowerCase() || '';
      const accountName = getAccountName(mov.origin_account).toLowerCase();
      return note.includes(searchLower) || tag.includes(searchLower) || accountName.includes(searchLower);
    }
    return true;
  }) : [];
  
  useEffect(() => {
    if (searchTerm && currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, currentPage]);

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
            placeholder="Buscar por nota, etiqueta o cuenta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 1 | 2 | 3 | 4 | 'all')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <option value="all">Todos</option>
            <option value={1}>Ingresos</option>
            <option value={2}>Gastos</option>
            <option value={3}>Transferencias</option>
            <option value={4}>Ahorros</option>
          </select>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nota</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuenta</th>
              {showTaxes && (
                <>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">IVA</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">GMF</th>
                </>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={showTaxes ? 10 : 7} className="px-6 py-12">
                  <div className="text-center">
                    <p className="text-gray-600">Cargando movimientos...</p>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={showTaxes ? 10 : 7} className="px-6 py-12">
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
                <td colSpan={showTaxes ? 10 : 7} className="px-6 py-12">
                  <div className="text-center">
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
                </td>
              </tr>
            ) : (
              filteredMovements.map((mov) => (
              <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(mov.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {mov.note || getTypeLabel(mov.type)}
                    </div>
                  {mov.tag && (
                    <span className="inline-flex items-center gap-1 mt-1 text-xs text-blue-600">
                      {mov.tag}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
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
                <td className="px-6 py-4 text-sm text-gray-600">
                  {mov.type === 3 ? (
                    <span>{getAccountName(mov.origin_account)} → {getAccountName(mov.destination_account)}</span>
                  ) : (
                    getAccountName(mov.origin_account)
                  )}
                </td>
                {showTaxes && (
                  <>
                    <td className="px-6 py-4 text-sm text-gray-600 text-right">
                      {formatCurrency(mov.base_amount)}
                    </td>
                    <td className="px-6 py-4 text-sm text-amber-600 text-right">
                      {mov.tax_percentage && mov.tax_percentage > 0 
                        ? formatCurrency(mov.taxed_amount ?? (mov.total_amount - mov.base_amount - (mov.gmf_amount || 0)))
                        : '-'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-600 text-right">
                      {mov.gmf_amount && mov.gmf_amount > 0 ? formatCurrency(mov.gmf_amount) : '-'}
                    </td>
                  </>
                )}
                <td className={`px-6 py-4 text-sm font-semibold text-right ${getTypeColor(mov.type)}`}>
                  {mov.type === 1 ? '+' : mov.type === 2 ? '-' : ''}{formatCurrency(mov.total_amount)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Confirmado
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedMovement(mov);
                      }}
                      className="p-2 hover:bg-blue-50 rounded transition-colors border border-gray-200 hover:border-blue-300"
                      title="Ver detalle"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                    </button>
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
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
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
                {mov.type === 1 ? '+' : mov.type === 2 ? '-' : ''}{formatCurrency(mov.total_amount)}
              </p>
            </div>
            
            {mov.type === 3 && mov.destination_account && (mov.capital_amount || mov.interest_amount) && (
              <div className="text-xs mb-2 space-y-1">
                {mov.capital_amount && mov.capital_amount > 0 && (
                  <div className="text-green-600">Capital: {formatCurrency(mov.capital_amount)}</div>
                )}
                {mov.interest_amount && mov.interest_amount > 0 && (
                  <div className="text-amber-600">Intereses: {formatCurrency(mov.interest_amount)}</div>
                )}
              </div>
            )}
            
            {showTaxes && ((mov.tax_percentage && mov.tax_percentage > 0) || mov.gmf_amount) && (
              <div className="text-xs text-gray-600 mb-2 space-y-1">
                <div>Base: {formatCurrency(mov.base_amount)}</div>
                {mov.tax_percentage && mov.tax_percentage > 0 && (
                  <div>IVA: {formatCurrency(mov.taxed_amount ?? (mov.total_amount - mov.base_amount - (mov.gmf_amount || 0)))}</div>
                )}
                {mov.gmf_amount && mov.gmf_amount > 0 && (
                  <div className="text-blue-600">GMF: {formatCurrency(mov.gmf_amount)}</div>
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

