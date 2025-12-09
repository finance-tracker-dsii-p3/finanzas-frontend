import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Eye } from 'lucide-react';
import { ruleService, Rule, RuleCreate, RulePreview, RulePreviewResponse } from '../services/ruleService';
import { useCategories } from '../context/CategoryContext';
import './RuleForm.css';

interface RuleFormProps {
  onClose: () => void;
  ruleToEdit?: Rule | null;
  onSave: () => void;
}

const RuleForm: React.FC<RuleFormProps> = ({ onClose, ruleToEdit, onSave }) => {
  const { categories } = useCategories();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RulePreviewResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const [formData, setFormData] = useState<RuleCreate>({
    name: '',
    criteria_type: 'description_contains',
    keyword: '',
    target_transaction_type: null,
    action_type: 'assign_category',
    target_category: null,
    target_tag: '',
    is_active: true,
    order: 1,
  });

  useEffect(() => {
    if (ruleToEdit) {
      setFormData({
        name: ruleToEdit.name,
        criteria_type: ruleToEdit.criteria_type,
        keyword: ruleToEdit.keyword || '',
        target_transaction_type: ruleToEdit.target_transaction_type || null,
        action_type: ruleToEdit.action_type,
        target_category: ruleToEdit.target_category || null,
        target_tag: ruleToEdit.target_tag || '',
        is_active: ruleToEdit.is_active,
        order: ruleToEdit.order,
      });
    }
  }, [ruleToEdit]);

  const handlePreview = async () => {
    if (formData.criteria_type === 'description_contains' && !formData.keyword?.trim()) {
      setError('Ingresa una palabra clave para previsualizar');
      return;
    }

    if (formData.criteria_type === 'transaction_type' && !formData.target_transaction_type) {
      setError('Selecciona un tipo de transacción para previsualizar');
      return;
    }

    setIsPreviewing(true);
    setError(null);
    setPreview(null);

    try {
      const previewData: RulePreview = {};
      if (formData.criteria_type === 'description_contains') {
        previewData.description = formData.keyword || '';
      } else {
        previewData.transaction_type = formData.target_transaction_type || undefined;
      }

      const result = await ruleService.previewRule(previewData);
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al previsualizar regla');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre de la regla es requerido');
      return;
    }

    if (formData.criteria_type === 'description_contains' && !formData.keyword?.trim()) {
      setError('La palabra clave es requerida');
      return;
    }

    if (formData.criteria_type === 'transaction_type' && !formData.target_transaction_type) {
      setError('El tipo de transacción es requerido');
      return;
    }

    if (formData.action_type === 'assign_category' && !formData.target_category) {
      setError('La categoría objetivo es requerida');
      return;
    }

    if (formData.action_type === 'assign_tag' && !formData.target_tag?.trim()) {
      setError('La etiqueta objetivo es requerida');
      return;
    }

    setIsSubmitting(true);

    try {
      const ruleData: RuleCreate = {
        name: formData.name.trim(),
        criteria_type: formData.criteria_type,
        action_type: formData.action_type,
        is_active: formData.is_active,
        order: formData.order || 1,
      };

      if (formData.criteria_type === 'description_contains') {
        ruleData.keyword = formData.keyword?.trim() || null;
      } else {
        ruleData.target_transaction_type = formData.target_transaction_type || null;
      }

      if (formData.action_type === 'assign_category') {
        ruleData.target_category = formData.target_category || null;
        ruleData.target_tag = null;
      } else {
        ruleData.target_tag = formData.target_tag?.trim() || null;
        ruleData.target_category = null;
      }

      if (ruleToEdit) {
        await ruleService.updateRule(ruleToEdit.id, ruleData);
      } else {
        await ruleService.createRule(ruleData);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar la regla');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableCategories = categories.filter(cat => {
    if (formData.criteria_type === 'transaction_type') {
      if (formData.target_transaction_type === 1) {
        return cat.type === 'income';
      }
      if (formData.target_transaction_type === 2) {
        return cat.type === 'expense';
      }
    }
    return true;
  });

  return (
    <div className="rule-form-overlay" onClick={onClose}>
      <div className="rule-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="rule-form-header">
          <h2>{ruleToEdit ? 'Editar Regla' : 'Crear Regla Automática'}</h2>
          <button className="close-button" onClick={onClose} type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rule-form-content">
          {error && (
            <div className="error-message">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Nombre de la regla *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Ej: Uber automático"
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="criteria_type">Tipo de criterio *</label>
            <select
              id="criteria_type"
              value={formData.criteria_type}
              onChange={(e) => {
                const newCriteria = e.target.value as 'description_contains' | 'transaction_type';
                setFormData({
                  ...formData,
                  criteria_type: newCriteria,
                  keyword: newCriteria === 'description_contains' ? formData.keyword : '',
                  target_transaction_type: newCriteria === 'transaction_type' ? formData.target_transaction_type : null,
                });
              }}
            >
              <option value="description_contains">Descripción contiene texto</option>
              <option value="transaction_type">Tipo de transacción</option>
            </select>
          </div>

          {formData.criteria_type === 'description_contains' && (
            <div className="form-group">
              <label htmlFor="keyword">Palabra clave *</label>
              <input
                id="keyword"
                type="text"
                value={formData.keyword || ''}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                required
                placeholder="Ej: uber"
                maxLength={100}
              />
              <small>La regla se aplicará si la descripción contiene este texto (insensible a mayúsculas)</small>
            </div>
          )}

          {formData.criteria_type === 'transaction_type' && (
            <div className="form-group">
              <label htmlFor="target_transaction_type">Tipo de transacción *</label>
              <select
                id="target_transaction_type"
                value={formData.target_transaction_type || ''}
                onChange={(e) => setFormData({ ...formData, target_transaction_type: e.target.value ? parseInt(e.target.value) : null })}
                required
              >
                <option value="">Selecciona...</option>
                <option value="1">Ingresos</option>
                <option value="2">Gastos</option>
                <option value="3">Transferencias</option>
                <option value="4">Ahorros</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="action_type">Tipo de acción *</label>
            <select
              id="action_type"
              value={formData.action_type}
              onChange={(e) => {
                const newAction = e.target.value as 'assign_category' | 'assign_tag';
                setFormData({
                  ...formData,
                  action_type: newAction,
                  target_category: newAction === 'assign_category' ? formData.target_category : null,
                  target_tag: newAction === 'assign_tag' ? formData.target_tag : '',
                });
              }}
            >
              <option value="assign_category">Asignar categoría</option>
              <option value="assign_tag">Asignar etiqueta</option>
            </select>
          </div>

          {formData.action_type === 'assign_category' && (
            <div className="form-group">
              <label htmlFor="target_category">Categoría objetivo *</label>
              <select
                id="target_category"
                value={formData.target_category || ''}
                onChange={(e) => setFormData({ ...formData, target_category: e.target.value ? parseInt(e.target.value) : null })}
                required
              >
                <option value="">Selecciona una categoría...</option>
                {availableCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}

          {formData.action_type === 'assign_tag' && (
            <div className="form-group">
              <label htmlFor="target_tag">Etiqueta objetivo *</label>
              <input
                id="target_tag"
                type="text"
                value={formData.target_tag || ''}
                onChange={(e) => setFormData({ ...formData, target_tag: e.target.value })}
                required
                placeholder="Ej: transporte"
                maxLength={50}
              />
            </div>
          )}

          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Regla activa</span>
            </label>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isPreviewing || isSubmitting}
              className="preview-button"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Previsualizando...
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Previsualizar
                </>
              )}
            </button>
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting || isPreviewing}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {ruleToEdit ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                ruleToEdit ? 'Actualizar' : 'Crear'
              )}
            </button>
          </div>

          {preview && (
            <div className={`preview-result ${preview.would_match ? 'preview-match' : 'preview-no-match'}`}>
              <h3>Previsualización</h3>
              {preview.would_match ? (
                <div>
                  <p className="preview-success">✅ La regla se aplicaría:</p>
                  <p><strong>{preview.matching_rule?.name}</strong></p>
                  <p>{preview.message}</p>
                  {preview.matching_rule?.changes && (
                    <ul>
                      {Object.entries(preview.matching_rule.changes).map(([key, value]) => (
                        <li key={key}>
                          <strong>{key === 'category' ? 'Categoría' : 'Etiqueta'}:</strong> {value}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <div>
                  <p className="preview-warning">❌ Ninguna regla coincidiría con esta transacción.</p>
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default RuleForm;

