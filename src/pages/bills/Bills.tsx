import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, AlertCircle, CheckCircle, XCircle, DollarSign, FileText, Filter, X, Loader2, Clock } from 'lucide-react';
import { billService, Bill, CreateBillData, BillPaymentData } from '../../services/billService';
import { accountService, Account } from '../../services/accountService';
import { useCategories } from '../../context/CategoryContext';
import ConfirmModal from '../../components/ConfirmModal';
import './bills.css';

const Bills: React.FC = () => {
  const { categories } = useCategories();
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Bill | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [filterDueDateFrom, setFilterDueDateFrom] = useState<string>('');
  const [filterDueDateTo, setFilterDueDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [billsData, accountsData] = await Promise.all([
        billService.listBills(),
        accountService.getAllAccounts(),
      ]);
      setBills(billsData);
      setAccounts(accountsData.filter(acc => acc.is_active && acc.account_type === 'asset'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBill = async (data: CreateBillData) => {
    try {
      await billService.createBill(data);
      await loadData();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear factura');
    }
  };

  const handleUpdateBill = async (billId: number, data: CreateBillData) => {
    try {
      await billService.updateBill(billId, data);
      await loadData();
      setEditingBill(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar factura');
    }
  };

  const handleDeleteBill = (bill: Bill) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Factura',
      message: `Â¿EstÃ¡s seguro de que deseas eliminar la factura de ${bill.provider}? Esta acciÃ³n no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await billService.deleteBill(bill.id);
          await loadData();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al eliminar factura');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRegisterPayment = async (billId: number, data: BillPaymentData) => {
    try {
      await billService.registerPayment(billId, data);
      await loadData();
      setShowPaymentModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago');
    }
  };

  const handleApplyFilters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const filters: {
        status?: 'pending' | 'paid' | 'overdue';
        provider?: string;
        due_date_from?: string;
        due_date_to?: string;
      } = {};
      if (filterStatus !== 'all') filters.status = filterStatus;
      if (filterProvider) filters.provider = filterProvider;
      if (filterDueDateFrom) filters.due_date_from = filterDueDateFrom;
      if (filterDueDateTo) filters.due_date_to = filterDueDateTo;

      const billsData = await billService.listBills(filters);
      setBills(billsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al filtrar facturas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearFilters = async () => {
    setFilterStatus('all');
    setFilterProvider('');
    setFilterDueDateFrom('');
    setFilterDueDateTo('');
    await loadData();
  };

  const getStatusBadge = (status: Bill['status']) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      pending: {
        label: 'Pendiente',
        className: 'badge-warning',
        icon: <Clock className="w-3 h-3" />,
      },
      paid: {
        label: 'Pagada',
        className: 'badge-success',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      overdue: {
        label: 'Atrasada',
        className: 'badge-danger',
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`badge ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (isLoading && bills.length === 0) {
    return (
      <div className="bills-page">
        <div className="loading-container">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Cargando facturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bills-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <FileText className="w-6 h-6" />
            Facturas
          </h1>
          <div className="header-actions">
            <button
              className="btn btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="w-4 h-4" />
              Nueva Factura
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Ã—</button>
        </div>
      )}

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'pending' | 'paid' | 'overdue')}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagada</option>
              <option value="overdue">Atrasada</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Proveedor</label>
            <input
              type="text"
              value={filterProvider}
              onChange={(e) => setFilterProvider(e.target.value)}
              placeholder="Buscar proveedor..."
            />
          </div>

          <div className="filter-group">
            <label>Vence desde</label>
            <input
              type="date"
              value={filterDueDateFrom}
              onChange={(e) => setFilterDueDateFrom(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Vence hasta</label>
            <input
              type="date"
              value={filterDueDateTo}
              onChange={(e) => setFilterDueDateTo(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button
              className="btn btn-primary btn-sm"
              onClick={handleApplyFilters}
            >
              Aplicar
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
            >
              <X className="w-4 h-4" />
              Limpiar
            </button>
          </div>
        </div>
      )}

      {bills.length === 0 ? (
        <div className="empty-state">
          <FileText className="w-16 h-16 text-gray-400" />
          <h2>No hay facturas registradas</h2>
          <p>Comienza agregando tu primera factura</p>
          <button
            className="btn btn-primary action-button"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Agregar Factura
          </button>
        </div>
      ) : (
        <div className="bills-grid">
          {bills.map((bill, index) => (
            <div key={bill.id} className="bill-card stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="bill-card-header">
                <div className="bill-info">
                  <h3 className="bill-provider">{bill.provider}</h3>
                  {bill.is_recurring && (
                    <span className="bill-recurring-badge">Recurrente</span>
                  )}
                </div>
                <div className="bill-status">
                  {getStatusBadge(bill.status)}
                </div>
              </div>

              <div className="bill-details">
                <div className="bill-detail-item">
                  <DollarSign className="w-4 h-4" />
                  <div>
                    <span className="detail-label">Monto:</span>
                    <span className="detail-value">{bill.amount_formatted}</span>
                  </div>
                </div>

                <div className="bill-detail-item">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <span className="detail-label">Vence:</span>
                    <span className="detail-value">
                      {new Date(bill.due_date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                {bill.days_until_due !== null && bill.days_until_due !== undefined && (
                  <div className="bill-detail-item">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                      <span className="detail-label">Días restantes:</span>
                      <span className={`detail-value ${bill.days_until_due <= 3 && bill.days_until_due >= 0 ? 'text-warning' : ''} ${bill.days_until_due < 0 ? 'text-danger' : ''}`}>
                        {bill.days_until_due > 0
                          ? `${bill.days_until_due} días`
                          : bill.days_until_due === 0
                          ? 'Vence hoy'
                          : `Vencida hace ${Math.abs(bill.days_until_due)} dÃ­as`}
                      </span>
                    </div>
                  </div>
                )}

                {bill.is_paid && bill.payment_info && (
                  <div className="bill-detail-item">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <span className="detail-label">Pagada:</span>
                      <span className="detail-value">
                        {new Date(bill.payment_info.date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                )}

                {bill.suggested_account_info && (
                  <div className="bill-detail-item">
                    <DollarSign className="w-4 h-4" />
                    <div>
                      <span className="detail-label">Cuenta sugerida:</span>
                      <span className="detail-value">{bill.suggested_account_info.name}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bill-actions">
                {!bill.is_paid && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowPaymentModal(bill)}
                  >
                    <DollarSign className="w-4 h-4" />
                    Registrar Pago
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingBill(bill)}
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteBill(bill)}
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <BillModal
          accounts={accounts}
          categories={categories}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateBill}
        />
      )}

      {editingBill && (
        <BillModal
          bill={editingBill}
          accounts={accounts}
          categories={categories}
          onClose={() => setEditingBill(null)}
          onSave={(data) => handleUpdateBill(editingBill.id, data)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          bill={showPaymentModal}
          accounts={accounts}
          onClose={() => setShowPaymentModal(null)}
          onSave={(data) => handleRegisterPayment(showPaymentModal.id, data)}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        type={confirmModal.type}
      />
    </div>
  );
};

interface BillModalProps {
  bill?: Bill;
  accounts: Account[];
  categories: Array<{ id: number; name: string; type?: string }>;
  onClose: () => void;
  onSave: (data: CreateBillData) => void;
}

const BillModal: React.FC<BillModalProps> = ({ bill, accounts, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreateBillData>({
    provider: bill?.provider || '',
    amount: bill?.amount || 0,
    due_date: bill?.due_date || new Date().toISOString().split('T')[0],
    suggested_account: bill?.suggested_account || undefined,
    category: bill?.category || undefined,
    reminder_days_before: bill?.reminder_days_before || 3,
    description: bill?.description || '',
    is_recurring: bill?.is_recurring || false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.provider.trim()) {
      setError('El proveedor es requerido');
      return;
    }

    if (!formData.amount || formData.amount <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }

    if (!formData.due_date) {
      setError('La fecha de vencimiento es requerida');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar factura');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{bill ? 'Editar Factura' : 'Nueva Factura'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="provider">Proveedor *</label>
            <input
              id="provider"
              type="text"
              value={formData.provider}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 100) {
                  setFormData({ ...formData, provider: value });
                }
              }}
              placeholder="Netflix, EPM, Claro, etc."
              maxLength={100}
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Monto (COP) *</label>
            <input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*\.?\d*$/.test(value)) {
                  const numValue = parseFloat(value) || 0;
                  if (value === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 999999999999)) {
                    setFormData({ ...formData, amount: numValue });
                  }
                }
              }}
              required
              min="0"
              max="999999999999"
              step="0.01"
              aria-required="true"
            />
            <small className="form-help">El monto se ingresa en pesos colombianos (ej: 95000)</small>
          </div>

          <div className="form-group">
            <label htmlFor="due_date">Fecha de Vencimiento *</label>
            <input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="suggested_account">Cuenta Sugerida</label>
            <select
              id="suggested_account"
              value={formData.suggested_account || ''}
              onChange={(e) => setFormData({ ...formData, suggested_account: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Ninguna</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency}) - ${acc.current_balance?.toLocaleString() || '0'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              value={formData.category || ''}
              onChange={(e) => setFormData({ ...formData, category: e.target.value ? parseInt(e.target.value) : undefined })}
            >
              <option value="">Ninguna</option>
              {categories.filter(cat => cat.type === 'expense').map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reminder_days_before">Días antes del vencimiento</label>
            <input
              id="reminder_days_before"
              type="number"
              value={formData.reminder_days_before}
              onChange={(e) => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) || 3 })}
              min="1"
              max="365"
            />
            <small className="form-help">Días antes del vencimiento para crear recordatorio</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 500) {
                  setFormData({ ...formData, description: value });
                }
              }}
              rows={3}
              placeholder="Notas adicionales sobre la factura"
              maxLength={500}
            />
            <small className="form-help">/500 caracteres</small>
          </div>

          <div className="form-group checkbox-group">
            <label htmlFor="is_recurring">
              <input
                type="checkbox"
                id="is_recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                disabled={isSaving}
                className="mr-2"
              />
              Factura Recurrente (mensual)
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PaymentModalProps {
  bill: Bill;
  accounts: Account[];
  onClose: () => void;
  onSave: (data: BillPaymentData) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ bill, accounts, onClose, onSave }) => {
  const [formData, setFormData] = useState<BillPaymentData>({
    account_id: bill.suggested_account || accounts[0]?.id || 0,
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.account_id) {
      setError('Debes seleccionar una cuenta');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Registrar Pago de Factura</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="payment-info">
          <p><strong>Proveedor:</strong> {bill.provider}</p>
          <p><strong>Monto:</strong> {bill.amount_formatted}</p>
          <p><strong>Vence:</strong> {new Date(bill.due_date).toLocaleDateString('es-ES')}</p>
        </div>

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="account_id">Cuenta *</label>
            <select
              id="account_id"
              value={formData.account_id}
              onChange={(e) => setFormData({ ...formData, account_id: parseInt(e.target.value) })}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency}) - {acc.current_balance ? `$${acc.current_balance.toLocaleString()}` : '$0'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="payment_date">Fecha de Pago *</label>
            <input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notas adicionales del pago"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? 'Registrando...' : 'Registrar Pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Bills;


