import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, AlertCircle, CheckCircle, XCircle, DollarSign, Car, Filter, X, Loader2 } from 'lucide-react';
import { soatService, vehicleService, SOAT, CreateSOATData, SOATPaymentData, Vehicle } from '../../services/vehicleService';
import { accountService, Account } from '../../services/accountService';
import ConfirmModal from '../../components/ConfirmModal';
import './soats.css';

const SOATs: React.FC = () => {
  const [soats, setSoats] = useState<SOAT[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSOAT, setEditingSOAT] = useState<SOAT | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<SOAT | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
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
      const [soatsData, vehiclesData, accountsData] = await Promise.all([
        soatService.listSOATs(),
        vehicleService.listVehicles(),
        accountService.getAllAccounts(),
      ]);
      setSoats(soatsData);
      setVehicles(vehiclesData);
      setAccounts(accountsData.filter(acc => acc.is_active && acc.account_type === 'asset'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSOAT = async (data: CreateSOATData) => {
    try {
      await soatService.createSOAT(data);
      await loadData();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear SOAT');
    }
  };

  const handleUpdateSOAT = async (soatId: number, data: CreateSOATData) => {
    try {
      await soatService.updateSOAT(soatId, data);
      await loadData();
      setEditingSOAT(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar SOAT');
    }
  };

  const handleDeleteSOAT = (soat: SOAT) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar SOAT',
      message: `¿Estás seguro de que deseas eliminar el SOAT del vehículo ${soat.vehicle_plate}? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await soatService.deleteSOAT(soat.id);
          await loadData();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al eliminar SOAT');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRegisterPayment = async (soatId: number, data: SOATPaymentData) => {
    try {
      await soatService.registerPayment(soatId, data);
      await loadData();
      setShowPaymentModal(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar pago');
    }
  };

  const getStatusBadge = (status: SOAT['status']) => {
    const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      vigente: {
        label: 'Vigente',
        className: 'badge-success',
        icon: <CheckCircle className="w-3 h-3" />,
      },
      por_vencer: {
        label: 'Por vencer',
        className: 'badge-warning',
        icon: <AlertCircle className="w-3 h-3" />,
      },
      vencido: {
        label: 'Vencido',
        className: 'badge-danger',
        icon: <XCircle className="w-3 h-3" />,
      },
      pendiente_pago: {
        label: 'Pendiente pago',
        className: 'badge-warning',
        icon: <AlertCircle className="w-3 h-3" />,
      },
      atrasado: {
        label: 'Atrasado',
        className: 'badge-danger',
        icon: <XCircle className="w-3 h-3" />,
      },
    };

    const config = statusConfig[status] || statusConfig.vigente;
    return (
      <span className={`badge ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const filteredSOATs = soats.filter(soat => {
    if (filterStatus === 'all') return true;
    return soat.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="soats-page">
        <div className="loading-container">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Cargando SOATs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="soats-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <Car className="w-6 h-6" />
            SOATs
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
              Nuevo SOAT
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="vigente">Vigente</option>
              <option value="por_vencer">Por vencer</option>
              <option value="vencido">Vencido</option>
              <option value="pendiente_pago">Pendiente pago</option>
              <option value="atrasado">Atrasado</option>
            </select>
          </div>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilterStatus('all');
              setShowFilters(false);
            }}
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      )}

      {filteredSOATs.length === 0 ? (
        <div className="empty-state">
          <Car className="w-16 h-16 text-gray-400" />
          <h2>No hay SOATs registrados</h2>
          <p>Comienza agregando tu primer SOAT</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Agregar SOAT
          </button>
        </div>
      ) : (
        <div className="soats-grid">
          {filteredSOATs.map((soat) => (
            <div key={soat.id} className="soat-card">
              <div className="soat-card-header">
                <div className="soat-info">
                  <h3 className="soat-vehicle">{soat.vehicle_plate}</h3>
                  {soat.vehicle_info.brand && soat.vehicle_info.model && (
                    <p className="soat-vehicle-details">
                      {soat.vehicle_info.brand} {soat.vehicle_info.model}
                    </p>
                  )}
                </div>
                <div className="soat-status">
                  {getStatusBadge(soat.status)}
                </div>
              </div>

              <div className="soat-details">
                <div className="soat-detail-item">
                  <Calendar className="w-4 h-4" />
                  <div>
                    <span className="detail-label">Vence:</span>
                    <span className="detail-value">
                      {new Date(soat.expiry_date).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </div>

                <div className="soat-detail-item">
                  <DollarSign className="w-4 h-4" />
                  <div>
                    <span className="detail-label">Costo:</span>
                    <span className="detail-value">{soat.cost_formatted}</span>
                  </div>
                </div>

                {soat.days_until_expiry !== null && (
                  <div className="soat-detail-item">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                      <span className="detail-label">Días restantes:</span>
                      <span className={`detail-value ${soat.days_until_expiry <= 7 ? 'text-warning' : ''} ${soat.days_until_expiry < 0 ? 'text-danger' : ''}`}>
                        {soat.days_until_expiry > 0
                          ? `${soat.days_until_expiry} días`
                          : soat.days_until_expiry === 0
                          ? 'Vence hoy'
                          : `Vencido hace ${Math.abs(soat.days_until_expiry)} días`}
                      </span>
                    </div>
                  </div>
                )}

                {soat.is_paid && soat.payment_info && (
                  <div className="soat-detail-item">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                      <span className="detail-label">Pagado:</span>
                      <span className="detail-value">
                        {new Date(soat.payment_info.date).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="soat-actions">
                {!soat.is_paid && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowPaymentModal(soat)}
                  >
                    <DollarSign className="w-4 h-4" />
                    Registrar Pago
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditingSOAT(soat)}
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteSOAT(soat)}
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
        <SOATModal
          vehicles={vehicles}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateSOAT}
        />
      )}

      {editingSOAT && (
        <SOATModal
          soat={editingSOAT}
          vehicles={vehicles}
          onClose={() => setEditingSOAT(null)}
          onSave={(data) => handleUpdateSOAT(editingSOAT.id, data)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal
          soat={showPaymentModal}
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

interface SOATModalProps {
  soat?: SOAT;
  vehicles: Vehicle[];
  onClose: () => void;
  onSave: (data: CreateSOATData) => void;
}

const SOATModal: React.FC<SOATModalProps> = ({ soat, vehicles, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreateSOATData>({
    vehicle: soat?.vehicle || vehicles[0]?.id || 0,
    issue_date: soat?.issue_date || new Date().toISOString().split('T')[0],
    expiry_date: soat?.expiry_date || '',
    alert_days_before: soat?.alert_days_before || 7,
    cost: soat?.cost || 0,
    insurance_company: soat?.insurance_company || '',
    policy_number: soat?.policy_number || '',
    notes: soat?.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.vehicle) {
      setError('Debes seleccionar un vehículo');
      return;
    }

    if (!formData.expiry_date) {
      setError('La fecha de vencimiento es requerida');
      return;
    }

    if (formData.cost <= 0) {
      setError('El costo debe ser mayor a 0');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar SOAT');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{soat ? 'Editar SOAT' : 'Nuevo SOAT'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="vehicle">Vehículo *</label>
            <select
              id="vehicle"
              value={formData.vehicle}
              onChange={(e) => setFormData({ ...formData, vehicle: parseInt(e.target.value) })}
              required
              disabled={!!soat}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} {v.brand && v.model && `- ${v.brand} ${v.model}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="issue_date">Fecha de Emisión *</label>
            <input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="expiry_date">Fecha de Vencimiento *</label>
            <input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="alert_days_before">Días de Alerta</label>
            <input
              id="alert_days_before"
              type="number"
              value={formData.alert_days_before}
              onChange={(e) => setFormData({ ...formData, alert_days_before: parseInt(e.target.value) || 7 })}
              min="1"
              max="365"
            />
          </div>

          <div className="form-group">
            <label htmlFor="cost">Costo (centavos) *</label>
            <input
              id="cost"
              type="number"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: parseInt(e.target.value) || 0 })}
              required
              min="0"
            />
            <small className="form-help">El costo se ingresa en centavos (ej: 500000 = $5,000.00)</small>
          </div>

          <div className="form-group">
            <label htmlFor="insurance_company">Aseguradora</label>
            <input
              id="insurance_company"
              type="text"
              value={formData.insurance_company}
              onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
              placeholder="Nombre de la aseguradora"
            />
          </div>

          <div className="form-group">
            <label htmlFor="policy_number">Número de Póliza</label>
            <input
              id="policy_number"
              type="text"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              placeholder="Número de póliza"
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notas adicionales"
            />
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
  soat: SOAT;
  accounts: Account[];
  onClose: () => void;
  onSave: (data: SOATPaymentData) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ soat, accounts, onClose, onSave }) => {
  const [formData, setFormData] = useState<SOATPaymentData>({
    account_id: accounts[0]?.id || 0,
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
          <h2>Registrar Pago de SOAT</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="payment-info">
          <p><strong>Vehículo:</strong> {soat.vehicle_plate}</p>
          <p><strong>Costo:</strong> {soat.cost_formatted}</p>
          <p><strong>Vence:</strong> {new Date(soat.expiry_date).toLocaleDateString('es-ES')}</p>
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

export default SOATs;

