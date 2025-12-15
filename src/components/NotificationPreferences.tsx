import React, { useState, useEffect } from 'react';
import { Settings, Globe, Bell, Check, Loader2, AlertCircle } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { NotificationPreferences as NotificationPreferencesType } from '../services/notificationService';
import './NotificationPreferences.css';

const NotificationPreferences: React.FC = () => {
  const { preferences, refreshPreferences, updatePreferences } = useNotifications();
  const [formData, setFormData] = useState<Partial<NotificationPreferencesType>>({});
  const [timezones, setTimezones] = useState<Array<{ value: string; label: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await refreshPreferences();

        try {
          const { notificationService } = await import('../services/notificationService');
          const tz = await notificationService.getTimezones();
          setTimezones(tz);
        } catch {

          setTimezones([
            { value: 'America/Bogota', label: 'America/Bogota (Colombia)' },
            { value: 'America/Mexico_City', label: 'America/Mexico_City (México)' },
            { value: 'America/New_York', label: 'America/New_York (EE.UU. Este)' },
            { value: 'America/Los_Angeles', label: 'America/Los_Angeles (EE.UU. Oeste)' },
            { value: 'Europe/Madrid', label: 'Europe/Madrid (España)' },
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar preferencias');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [refreshPreferences]);

  useEffect(() => {
    if (preferences) {
      setFormData({
        timezone: preferences.timezone,
        language: preferences.language,
        enable_budget_alerts: preferences.enable_budget_alerts,
        enable_bill_reminders: preferences.enable_bill_reminders,
        enable_soat_reminders: preferences.enable_soat_reminders,
        enable_month_end_reminders: preferences.enable_month_end_reminders,
        enable_custom_reminders: preferences.enable_custom_reminders,
      });
    }
  }, [preferences]);

  const handleChange = (field: keyof NotificationPreferencesType, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      await updatePreferences(formData);
      setSuccess('Preferencias actualizadas correctamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar preferencias');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="preferences-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p>Cargando preferencias...</p>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="preferences-error">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <p>No se pudieron cargar las preferencias</p>
      </div>
    );
  }

  return (
    <div className="preferences-container">
      <div className="preferences-header">
        <Settings className="w-6 h-6 text-blue-600" />
        <div>
          <h2 className="preferences-title">Preferencias de Notificaciones</h2>
          <p className="preferences-subtitle">
            Configura cómo y cuándo recibir notificaciones
          </p>
        </div>
      </div>

      {error && (
        <div className="preferences-alert preferences-alert-error">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="preferences-alert preferences-alert-success">
          <Check className="w-5 h-5" />
          <p>{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="preferences-form">
        <div className="preferences-section">
          <div className="preferences-section-header">
            <Globe className="w-5 h-5 text-gray-600" />
            <h3 className="preferences-section-title">Configuración Regional</h3>
          </div>

          <div className="preferences-form-group">
            <label htmlFor="timezone" className="preferences-label">
              Zona Horaria
            </label>
            <select
              id="timezone"
              value={formData.timezone || ''}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="preferences-select"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <p className="preferences-help">
              Los recordatorios se enviarán según esta zona horaria
            </p>
          </div>

          <div className="preferences-form-group">
            <label htmlFor="language" className="preferences-label">
              Idioma
            </label>
            <select
              id="language"
              value={formData.language || 'es'}
              onChange={(e) => handleChange('language', e.target.value)}
              className="preferences-select"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
            <p className="preferences-help">
              Idioma en el que se mostrarán las notificaciones
            </p>
          </div>
        </div>

        <div className="preferences-section">
          <div className="preferences-section-header">
            <Bell className="w-5 h-5 text-gray-600" />
            <h3 className="preferences-section-title">Tipos de Notificaciones</h3>
          </div>

          <div className="preferences-toggle-group">
            <div className="preferences-toggle-item">
              <div className="preferences-toggle-info">
                <label htmlFor="enable_budget_alerts" className="preferences-toggle-label">
                  Alertas de Presupuesto
                </label>
                <p className="preferences-toggle-description">
                  Recibir alertas cuando alcances el 80% o 100% del presupuesto
                </p>
              </div>
              <label className="preferences-switch">
                <input
                  type="checkbox"
                  id="enable_budget_alerts"
                  checked={formData.enable_budget_alerts ?? true}
                  onChange={(e) => handleChange('enable_budget_alerts', e.target.checked)}
                />
                <span className="preferences-slider"></span>
              </label>
            </div>

            <div className="preferences-toggle-item">
              <div className="preferences-toggle-info">
                <label htmlFor="enable_bill_reminders" className="preferences-toggle-label">
                  Recordatorios de Facturas
                </label>
                <p className="preferences-toggle-description">
                  Recibir recordatorios de facturas próximas a vencer
                </p>
              </div>
              <label className="preferences-switch">
                <input
                  type="checkbox"
                  id="enable_bill_reminders"
                  checked={formData.enable_bill_reminders ?? true}
                  onChange={(e) => handleChange('enable_bill_reminders', e.target.checked)}
                />
                <span className="preferences-slider"></span>
              </label>
            </div>

            <div className="preferences-toggle-item">
              <div className="preferences-toggle-info">
                <label htmlFor="enable_soat_reminders" className="preferences-toggle-label">
                  Recordatorios de SOAT
                </label>
                <p className="preferences-toggle-description">
                  Recibir recordatorios de SOAT próximo a vencer o vencido
                </p>
              </div>
              <label className="preferences-switch">
                <input
                  type="checkbox"
                  id="enable_soat_reminders"
                  checked={formData.enable_soat_reminders ?? true}
                  onChange={(e) => handleChange('enable_soat_reminders', e.target.checked)}
                />
                <span className="preferences-slider"></span>
              </label>
            </div>

            <div className="preferences-toggle-item">
              <div className="preferences-toggle-info">
                <label htmlFor="enable_month_end_reminders" className="preferences-toggle-label">
                  Recordatorios de Fin de Mes
                </label>
                <p className="preferences-toggle-description">
                  Recibir recordatorio para importar extractos antes del cierre del mes
                </p>
              </div>
              <label className="preferences-switch">
                <input
                  type="checkbox"
                  id="enable_month_end_reminders"
                  checked={formData.enable_month_end_reminders ?? true}
                  onChange={(e) => handleChange('enable_month_end_reminders', e.target.checked)}
                />
                <span className="preferences-slider"></span>
              </label>
            </div>

            <div className="preferences-toggle-item">
              <div className="preferences-toggle-info">
                <label htmlFor="enable_custom_reminders" className="preferences-toggle-label">
                  Recordatorios Personalizados
                </label>
                <p className="preferences-toggle-description">
                  Recibir recordatorios personalizados que crees
                </p>
              </div>
              <label className="preferences-switch">
                <input
                  type="checkbox"
                  id="enable_custom_reminders"
                  checked={formData.enable_custom_reminders ?? true}
                  onChange={(e) => handleChange('enable_custom_reminders', e.target.checked)}
                />
                <span className="preferences-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="preferences-actions">
          <button
            type="submit"
            className="preferences-save-btn"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Guardar Preferencias
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationPreferences;

