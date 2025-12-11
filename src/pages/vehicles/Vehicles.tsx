import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Car, Calendar, AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { vehicleService, Vehicle, CreateVehicleData } from '../../services/vehicleService';
import ConfirmModal from '../../components/ConfirmModal';
import './vehicles.css';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
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
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await vehicleService.listVehicles();
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar vehículos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVehicle = async (data: CreateVehicleData) => {
    try {
      await vehicleService.createVehicle(data);
      await loadVehicles();
      setShowCreateModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear vehículo');
    }
  };

  const handleUpdateVehicle = async (vehicleId: number, data: CreateVehicleData) => {
    try {
      await vehicleService.updateVehicle(vehicleId, data);
      await loadVehicles();
      setEditingVehicle(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar vehículo');
    }
  };

  const handleDeleteVehicle = (vehicle: Vehicle) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Vehículo',
      message: `¿Estás seguro de que deseas eliminar el vehículo con placa ${vehicle.plate}? Esta acción no se puede deshacer.`,
      type: 'danger',
      onConfirm: async () => {
        try {
          await vehicleService.deleteVehicle(vehicle.id);
          await loadVehicles();
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al eliminar vehículo');
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const getStatusBadge = (soat: Vehicle['active_soat']) => {
    if (!soat) {
      return (
        <span className="badge badge-warning">
          <AlertCircle className="w-3 h-3" />
          Sin SOAT
        </span>
      );
    }

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

    const config = statusConfig[soat.status] || statusConfig.vigente;
    return (
      <span className={`badge ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="vehicles-page">
        <div className="loading-container">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p>Cargando vehículos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicles-page">
      <div className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <Car className="w-6 h-6" />
            Vehículos
          </h1>
          <button
            className="btn btn-primary action-button"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Nuevo Vehículo
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {vehicles.length === 0 ? (
        <div className="empty-state">
          <Car className="w-16 h-16 text-gray-400" />
          <h2>No hay vehículos registrados</h2>
          <p>Comienza agregando tu primer vehículo</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4" />
            Agregar Vehículo
          </button>
        </div>
      ) : (
        <div className="vehicles-grid">
          {vehicles.map((vehicle, index) => (
            <div key={vehicle.id} className="vehicle-card stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
              <div className="vehicle-card-header">
                <div className="vehicle-info">
                  <h3 className="vehicle-plate">{vehicle.plate}</h3>
                  {vehicle.brand && vehicle.model && (
                    <p className="vehicle-details">
                      {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </p>
                  )}
                </div>
                <div className="vehicle-actions">
                  <button
                    className="btn-icon"
                    onClick={() => setEditingVehicle(vehicle)}
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => handleDeleteVehicle(vehicle)}
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {vehicle.active_soat && (
                <div className="vehicle-soat-info">
                  <div className="soat-status">
                    {getStatusBadge(vehicle.active_soat)}
                  </div>
                  <div className="soat-details">
                    <p>
                      <Calendar className="w-4 h-4" />
                      Vence: {new Date(vehicle.active_soat.expiry_date).toLocaleDateString('es-ES')}
                    </p>
                    {vehicle.active_soat.days_until_expiry !== null && (
                      <p>
                        {vehicle.active_soat.days_until_expiry > 0
                          ? `${vehicle.active_soat.days_until_expiry} días restantes`
                          : vehicle.active_soat.days_until_expiry === 0
                          ? 'Vence hoy'
                          : `Vencido hace ${Math.abs(vehicle.active_soat.days_until_expiry)} días`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!vehicle.active_soat && (
                <div className="vehicle-no-soat">
                  <p>No hay SOAT activo registrado</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <VehicleModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateVehicle}
        />
      )}

      {editingVehicle && (
        <VehicleModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSave={(data) => handleUpdateVehicle(editingVehicle.id, data)}
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

interface VehicleModalProps {
  vehicle?: Vehicle;
  onClose: () => void;
  onSave: (data: CreateVehicleData) => void;
}

const VehicleModal: React.FC<VehicleModalProps> = ({ vehicle, onClose, onSave }) => {
  const [formData, setFormData] = useState<CreateVehicleData>({
    plate: vehicle?.plate || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    year: vehicle?.year || undefined,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.plate.trim()) {
      setError('La placa es requerida');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar vehículo');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{vehicle ? 'Editar Vehículo' : 'Nuevo Vehículo'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="plate">Placa *</label>
            <input
              id="plate"
              type="text"
              value={formData.plate}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (value.length <= 10) {
                  setFormData({ ...formData, plate: value });
                }
              }}
              placeholder="ABC123"
              maxLength={10}
              required
              aria-required="true"
            />
          </div>

          <div className="form-group">
            <label htmlFor="brand">Marca</label>
            <input
              id="brand"
              type="text"
              value={formData.brand}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  setFormData({ ...formData, brand: value });
                }
              }}
              placeholder="Toyota"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="model">Modelo</label>
            <input
              id="model"
              type="text"
              value={formData.model}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  setFormData({ ...formData, model: value });
                }
              }}
              placeholder="Corolla"
              maxLength={50}
            />
          </div>

          <div className="form-group">
            <label htmlFor="year">Año</label>
            <input
              id="year"
              type="number"
              value={formData.year || ''}
              onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
              placeholder="2020"
              min="1900"
              max={new Date().getFullYear() + 1}
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

export default Vehicles;

