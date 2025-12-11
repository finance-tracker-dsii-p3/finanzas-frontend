import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Edit, UserCheck, UserX, Filter, X, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import { userAdminService, AdminUser, EditUserData } from '../../services/userAdminService';
import './AdminUsers.css';

interface EditUserModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface AuditLogEntry {
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<EditUserData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    identification: '',
    is_active: true,
    is_verified: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [lastLoadedUserId, setLastLoadedUserId] = useState<number | null>(null);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      // Solo cargar datos si es un usuario diferente o si no se han cargado
      if (lastLoadedUserId !== user.id) {
        setIsLoading(true);
        setError(null);
        // Obtener detalles completos del usuario
        userAdminService.getUserDetail(user.id)
          .then((detail) => {
            setFormData({
              first_name: detail.first_name || '',
              last_name: detail.last_name || '',
              email: detail.email,
              phone: detail.phone || '',
              identification: detail.identification,
              is_active: detail.is_active,
              is_verified: detail.is_verified,
            });
            setLastLoadedUserId(user.id);
            setError(null);
          })
          .catch((err) => {
            setError(err.message || 'Error al cargar datos del usuario');
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    } else if (!isOpen) {
      // Limpiar cuando se cierra el modal
      setAuditLog([]);
      setError(null);
      setLastLoadedUserId(null);
      // Limpiar timeout si existe
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    }
  }, [user, isOpen, lastLoadedUserId]);

  const validateForm = (): string | null => {
    if (!formData.first_name?.trim()) {
      return 'El nombre es requerido';
    }
    if (!formData.last_name?.trim()) {
      return 'El apellido es requerido';
    }
    if (!formData.email?.trim()) {
      return 'El correo electrónico es requerido';
    }
    // Validar formato de email básico
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return 'El formato del correo electrónico no es válido';
    }
    if (!formData.identification?.trim()) {
      return 'La identificación es requerida';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validar formulario antes de enviar
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    setAuditLog([]);

    try {
      // Asegurar que NO se envíe el campo role (solo backend puede cambiarlo)
      const dataToSend: EditUserData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        identification: formData.identification,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
      };
      // Explicitamente NO incluir role

      const response = await userAdminService.editUser(user.id, dataToSend);
      
      // Mostrar auditoría si está disponible
      if (response.audit_log && response.audit_log.length > 0) {
        setAuditLog(response.audit_log);
      }
      
      // Recargar lista de usuarios
      onSave();
      setIsSaving(false);
      
      // Cerrar modal después de un breve delay para que el usuario vea el éxito
      // Si hay auditoría, esperar un poco más para que se vea
      const closeDelay = (response.audit_log && response.audit_log.length > 0) ? 2000 : 1000;
      
      // Limpiar timeout anterior si existe
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      
      closeTimeoutRef.current = setTimeout(() => {
        onClose();
        setAuditLog([]);
        closeTimeoutRef.current = null;
      }, closeDelay);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content admin-user-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Editar Usuario: {user.username}</h2>
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading && (
          <div className="modal-loading">
            <p>Cargando datos del usuario...</p>
          </div>
        )}

        {error && (
          <div className="modal-error">
            <p>{error}</p>
          </div>
        )}

        {auditLog.length > 0 && (
          <div className="audit-log-preview">
            <h3 className="text-sm font-semibold mb-2 text-green-700">✓ Cambios guardados exitosamente:</h3>
            <ul className="space-y-1">
              {auditLog.map((log, idx) => (
                <li key={idx} className="text-xs text-gray-600">
                  <strong>{log.field}</strong>: {log.old_value || 'N/A'} → {log.new_value || 'N/A'}
                  <span className="text-gray-400 ml-2">({log.changed_by})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name" className="form-label">
                Nombre *
              </label>
              <input
                type="text"
                id="first_name"
                className="form-input"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name" className="form-label">
                Apellido *
              </label>
              <input
                type="text"
                id="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Correo Electrónico *
            </label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="identification" className="form-label">
                Identificación *
              </label>
              <input
                type="text"
                id="identification"
                className="form-input"
                value={formData.identification}
                onChange={(e) => setFormData({ ...formData, identification: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Teléfono
              </label>
              <input
                type="text"
                id="phone"
                className="form-input"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                Usuario Activo
              </label>
            </div>

            <div className="form-group">
              <label className="form-label flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_verified}
                  onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                  className="mr-2"
                />
                Usuario Verificado
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="modal-btn modal-btn-secondary"
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-btn modal-btn-primary"
              disabled={isSaving || isLoading}
            >
              {isSaving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Filtros
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await userAdminService.listUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = [...users];

    // Búsqueda por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          user.full_name.toLowerCase().includes(term) ||
          user.identification.toLowerCase().includes(term)
      );
    }

    // Filtro por rol
    if (filterRole !== 'all') {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    // Filtro por estado activo/inactivo
    if (filterStatus !== 'all') {
      filtered = filtered.filter((user) =>
        filterStatus === 'active' ? user.is_active : !user.is_active
      );
    }

    // Filtro por verificación
    if (filterVerified !== 'all') {
      filtered = filtered.filter((user) =>
        filterVerified === 'verified' ? user.is_verified : !user.is_verified
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, filterRole, filterStatus, filterVerified]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleEdit = (user: AdminUser) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await userAdminService.editUser(user.id, {
        is_active: !user.is_active,
      });
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar usuario');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterVerified('all');
  };

  if (isLoading) {
    return (
      <div className="admin-users-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div className="header-left">
          <h1 className="page-title">Administración de Usuarios</h1>
          <p className="page-subtitle">Gestiona usuarios registrados en el sistema</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-label">Total</span>
            <span className="stat-value">{users.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Activos</span>
            <span className="stat-value stat-value-active">
              {users.filter((u) => u.is_active).length}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Inactivos</span>
            <span className="stat-value stat-value-inactive">
              {users.filter((u) => !u.is_active).length}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      <div className="admin-users-controls">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o identificación..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtros
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label className="filter-label">Rol</label>
            <select
              className="filter-select"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'user')}
            >
              <option value="all">Todos</option>
              <option value="admin">Administrador</option>
              <option value="user">Usuario</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Estado</label>
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Verificación</label>
            <select
              className="filter-select"
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value as 'all' | 'verified' | 'unverified')}
            >
              <option value="all">Todos</option>
              <option value="verified">Verificado</option>
              <option value="unverified">No Verificado</option>
            </select>
          </div>

          <button onClick={clearFilters} className="clear-filters-btn">
            Limpiar Filtros
          </button>
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Fecha Creación</th>
              <th>Último Acceso</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  {searchTerm || filterRole !== 'all' || filterStatus !== 'all' || filterVerified !== 'all'
                    ? 'No se encontraron usuarios con los filtros aplicados'
                    : 'No hay usuarios registrados'}
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{user.full_name || user.username}</div>
                      <div className="user-username">@{user.username}</div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role_display}
                    </span>
                  </td>
                  <td>
                    <div className="status-cell">
                      {user.is_active ? (
                        <span className="status-badge status-active">
                          <CheckCircle className="w-4 h-4" />
                          Activo
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">
                          <XCircle className="w-4 h-4" />
                          Inactivo
                        </span>
                      )}
                      {user.is_verified && (
                        <span className="verified-badge" title="Usuario verificado">
                          ✓
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(user.date_joined)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="date-cell">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(user.last_login)}</span>
                    </div>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button
                        onClick={() => handleEdit(user)}
                        className="action-btn action-edit"
                        title="Editar usuario"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(user)}
                        className={`action-btn ${user.is_active ? 'action-deactivate' : 'action-activate'}`}
                        title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                      >
                        {user.is_active ? (
                          <UserX className="w-4 h-4" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <EditUserModal
        user={selectedUser}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedUser(null);
        }}
        onSave={loadUsers}
      />
    </div>
  );
};

export default AdminUsers;

