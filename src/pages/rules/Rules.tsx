import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, GripVertical, X, Loader2, AlertCircle } from 'lucide-react';
import { ruleService, Rule, RuleFilters } from '../../services/ruleService';
import RuleForm from '../../components/RuleForm';
import ConfirmModal from '../../components/ConfirmModal';
import './rules.css';

interface RulesPageProps {
  onBack: () => void;
}

const Rules: React.FC<RulesPageProps> = ({ onBack }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<Rule | null>(null);
  const [filters, setFilters] = useState<RuleFilters>({
    active_only: false,
    search: '',
  });
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
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

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ruleService.getRules(filters);
      const sortedRules = [...response.results].sort((a, b) => a.order - b.order);
      setRules(sortedRules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reglas');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const handleCreate = () => {
    setRuleToEdit(null);
    setShowForm(true);
  };

  const handleEdit = (rule: Rule) => {
    setRuleToEdit(rule);
    setShowForm(true);
  };

  const handleDelete = (rule: Rule) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Regla',
      message: `¿Estás seguro de que deseas eliminar la regla "${rule.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        try {
          await ruleService.deleteRule(rule.id);
          await loadRules();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al eliminar regla');
        }
      },
    });
  };

  const handleToggleActive = async (rule: Rule) => {
    try {
      await ruleService.toggleActive(rule.id);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado de la regla');
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newRules = [...rules];
    const [removed] = newRules.splice(draggedIndex, 1);
    newRules.splice(dropIndex, 0, removed);

    const ruleOrders = newRules.map((rule, index) => ({
      id: rule.id,
      order: index + 1,
    }));

    try {
      await ruleService.reorderRules(ruleOrders);
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reordenar reglas');
    }

    setDraggedIndex(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setRuleToEdit(null);
    loadRules();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setRuleToEdit(null);
  };

  const getCriteriaDisplay = (rule: Rule): string => {
    if (rule.criteria_type === 'description_contains') {
      return `Descripción contiene: "${rule.keyword}"`;
    }
    const typeLabels: Record<number, string> = {
      1: 'Ingresos',
      2: 'Gastos',
      3: 'Transferencias',
      4: 'Ahorros',
    };
    return `Tipo: ${typeLabels[rule.target_transaction_type || 0] || 'Desconocido'}`;
  };

  const getActionDisplay = (rule: Rule): string => {
    if (rule.action_type === 'assign_category') {
      return `Asignar categoría: ${rule.target_category_name || 'N/A'}`;
    }
    return `Asignar etiqueta: "${rule.target_tag}"`;
  };

  const filteredRules = rules.filter(rule => {
    if (filters.active_only && !rule.is_active) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        rule.name.toLowerCase().includes(searchLower) ||
        rule.keyword?.toLowerCase().includes(searchLower) ||
        rule.target_category_name?.toLowerCase().includes(searchLower) ||
        rule.target_tag?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  return (
    <div className="rules-page">
      <div className="rules-header">
        <button onClick={onBack} className="back-button">
          <ArrowLeft className="w-5 h-5" />
          <span>Volver al Dashboard</span>
        </button>
        <div className="header-actions">
          <h1>Reglas Automáticas</h1>
          <button onClick={handleCreate} className="create-button">
            <Plus className="w-5 h-5" />
            Nueva Regla
          </button>
        </div>
      </div>

      <div className="rules-filters">
        <div className="search-container">
          <Search className="w-5 h-5 search-icon" />
          <input
            type="text"
            placeholder="Buscar reglas..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="search-input"
          />
          {filters.search && (
            <button
              onClick={() => setFilters({ ...filters, search: '' })}
              className="clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={filters.active_only || false}
            onChange={(e) => setFilters({ ...filters, active_only: e.target.checked })}
          />
          <span>Solo activas</span>
        </label>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="loading-state">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p>Cargando reglas...</p>
        </div>
      ) : filteredRules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <GripVertical className="w-12 h-12" />
          </div>
          <h3>No hay reglas configuradas</h3>
          <p>
            {filters.search || filters.active_only
              ? 'No se encontraron reglas con los filtros aplicados'
              : 'Crea tu primera regla automática para ahorrar tiempo al clasificar tus movimientos'}
          </p>
          {!filters.search && !filters.active_only && (
            <button onClick={handleCreate} className="create-first-button">
              <Plus className="w-5 h-5" />
              Crear Primera Regla
            </button>
          )}
        </div>
      ) : (
        <div className="rules-list">
          <div className="rules-table-header">
            <div className="header-cell order-cell">Orden</div>
            <div className="header-cell name-cell">Nombre</div>
            <div className="header-cell criteria-cell">Criterio</div>
            <div className="header-cell action-cell">Acción</div>
            <div className="header-cell applied-cell">Aplicada</div>
            <div className="header-cell status-cell">Estado</div>
            <div className="header-cell actions-cell">Acciones</div>
          </div>
          {filteredRules.map((rule, index) => (
            <div
              key={rule.id}
              className={`rule-item ${draggedIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="rule-cell order-cell">
                <GripVertical className="w-4 h-4 drag-handle" />
                <span>{rule.order}</span>
              </div>
              <div className="rule-cell name-cell">
                <strong>{rule.name}</strong>
              </div>
              <div className="rule-cell criteria-cell">
                <span className="criteria-text">{getCriteriaDisplay(rule)}</span>
              </div>
              <div className="rule-cell action-cell">
                <span className="action-text">{getActionDisplay(rule)}</span>
              </div>
              <div className="rule-cell applied-cell">
                <span className="applied-count">{rule.applied_count} veces</span>
              </div>
              <div className="rule-cell status-cell">
                <button
                  onClick={() => handleToggleActive(rule)}
                  className={`status-toggle ${rule.is_active ? 'active' : 'inactive'}`}
                  title={rule.is_active ? 'Desactivar' : 'Activar'}
                >
                  {rule.is_active ? (
                    <ToggleRight className="w-6 h-6" />
                  ) : (
                    <ToggleLeft className="w-6 h-6" />
                  )}
                  <span>{rule.is_active ? 'Activa' : 'Inactiva'}</span>
                </button>
              </div>
              <div className="rule-cell actions-cell">
                <button
                  onClick={() => handleEdit(rule)}
                  className="action-button edit-button"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(rule)}
                  className="action-button delete-button"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <RuleForm
          onClose={handleFormClose}
          ruleToEdit={ruleToEdit}
          onSave={handleFormSave}
        />
      )}

      {confirmModal.isOpen && (
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        />
      )}
    </div>
  );
};

export default Rules;

