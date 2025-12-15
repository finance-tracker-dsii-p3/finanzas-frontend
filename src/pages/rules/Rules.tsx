import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Trash2, X, Loader2, AlertCircle, DollarSign, TrendingUp } from 'lucide-react';
import { exchangeRateService, ExchangeRate, Currency } from '../../services/exchangeRateService';
import ConfirmModal from '../../components/ConfirmModal';
import './rules.css';

interface RulesPageProps {
  onBack: () => void;
}

interface ExchangeRateFormData {
  base_currency: Currency;
  currency: Currency;
  year: number;
  month: number;
  rate: string;
  source: string;
}

interface ExchangeRateFilters {
  currency?: Currency;
  base_currency?: Currency;
  year?: number;
  month?: number;
}

const MONTHS = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' },
];

const CURRENCIES: Currency[] = ['COP', 'USD', 'EUR'];

const Rules: React.FC<RulesPageProps> = ({ onBack }) => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rateToEdit, setRateToEdit] = useState<ExchangeRate | null>(null);
  const [filters, setFilters] = useState<ExchangeRateFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<ExchangeRateFormData>({
    base_currency: 'COP',
    currency: 'USD',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    rate: '',
    source: 'manual',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  const loadExchangeRates = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await exchangeRateService.list(filters);
      const sortedRates = [...response.results].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.month !== b.month) return b.month - a.month;
        return a.currency.localeCompare(b.currency);
      });
      setExchangeRates(sortedRates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar tipos de cambio');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadExchangeRates();
  }, [loadExchangeRates]);

  const handleCreate = () => {
    setRateToEdit(null);
    setFormData({
      base_currency: 'COP',
      currency: 'USD',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      rate: '',
      source: 'manual',
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (rate: ExchangeRate) => {
    setRateToEdit(rate);

    const cleanRate = parseFloat(rate.rate).toString();
    setFormData({
      base_currency: rate.base_currency,
      currency: rate.currency,
      year: rate.year,
      month: rate.month,
      rate: cleanRate,
      source: rate.source,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleDelete = (rate: ExchangeRate) => {
    setConfirmModal({
      isOpen: true,
      title: 'Eliminar Tipo de Cambio',
      message: `¿Estás seguro de que deseas eliminar la tasa ${rate.currency}/${rate.base_currency} de ${MONTHS[rate.month - 1].label} ${rate.year}? Se volverá a usar la tasa predeterminada del sistema.`,
      onConfirm: async () => {
        setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: () => {} });
        try {
          await exchangeRateService.delete(rate.id);
          await loadExchangeRates();
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Error al eliminar tipo de cambio');
        }
      },
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSaving(true);

    try {

      if (formData.base_currency === formData.currency) {
        setFormError('La moneda base y la moneda a convertir no pueden ser iguales');
        setIsSaving(false);
        return;
      }

      const payload = {
        base_currency: formData.base_currency,
        currency: formData.currency,
        year: formData.year,
        month: formData.month,
        rate: parseFloat(formData.rate),
        source: formData.source,
      };

      if (rateToEdit) {
        await exchangeRateService.update(rateToEdit.id, payload);
      } else {
        await exchangeRateService.create(payload);
      }

      setShowForm(false);
      setRateToEdit(null);
      await loadExchangeRates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al guardar tipo de cambio';

      if (errorMessage.includes('Ya existe') || errorMessage.includes('unique') || errorMessage.includes('duplicate')) {
        setFormError(`Ya existe un tipo de cambio para ${formData.currency}/${formData.base_currency} en ${MONTHS[formData.month - 1].label} ${formData.year}. Por favor, edita el existente o elige otro período.`);
      } else if (errorMessage.includes('base') && errorMessage.includes('currency') && errorMessage.includes('iguales')) {
        setFormError('La moneda base y la moneda a convertir no pueden ser iguales');
      } else {
        setFormError(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setRateToEdit(null);
    setFormError(null);
  };

  const filteredRates = exchangeRates.filter(rate => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        rate.currency.toLowerCase().includes(searchLower) ||
        rate.base_currency.toLowerCase().includes(searchLower) ||
        rate.source.toLowerCase().includes(searchLower) ||
        `${rate.month}/${rate.year}`.includes(searchLower)
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
          <h1>Tipos de Cambio</h1>
          <button onClick={handleCreate} className="create-button">
            <Plus className="w-5 h-5" />
            Nuevo Tipo de Cambio
          </button>
        </div>
      </div>

      <div className="rules-filters">
        <div className="search-container">
          <Search className="w-5 h-5 search-icon" />
          <input
            type="text"
            placeholder="Buscar tipos de cambio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="clear-search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="filter-selects">
          <select
            value={filters.currency || ''}
            onChange={(e) => setFilters({ ...filters, currency: e.target.value as Currency || undefined })}
            className="filter-select"
          >
            <option value="">Todas las monedas</option>
            {CURRENCIES.map(curr => (
              <option key={curr} value={curr}>{curr}</option>
            ))}
          </select>
          <select
            value={filters.year || ''}
            onChange={(e) => setFilters({ ...filters, year: e.target.value ? parseInt(e.target.value) : undefined })}
            className="filter-select"
          >
            <option value="">Todos los años</option>
            {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
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
          <p>Cargando tipos de cambio...</p>
        </div>
      ) : filteredRates.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <TrendingUp className="w-12 h-12" />
          </div>
          <h3>No hay tipos de cambio configurados</h3>
          <p>
            {searchTerm || filters.currency || filters.year
              ? 'No se encontraron tipos de cambio con los filtros aplicados'
              : 'Configura tasas de conversión personalizadas entre monedas'}
          </p>
          {!searchTerm && !filters.currency && !filters.year && (
            <button onClick={handleCreate} className="create-first-button">
              <Plus className="w-5 h-5" />
              Crear Primer Tipo de Cambio
            </button>
          )}
        </div>
      ) : (
        <div className="exchange-rates-grid">
          {filteredRates.map((rate) => (
            <div key={rate.id} className="exchange-rate-card">
              <div className="rate-card-header">
                <div className="currency-pair">
                  <DollarSign className="w-5 h-5" />
                  <span className="pair-text">{rate.currency} / {rate.base_currency}</span>
                </div>
                <div className="rate-actions">
                  <button
                    onClick={() => handleEdit(rate)}
                    className="action-button edit-button"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(rate)}
                    className="action-button delete-button"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="rate-card-body">
                <div className="rate-value">
                  <span className="rate-label">Tasa:</span>
                  <span className="rate-number">{parseFloat(rate.rate).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 6 })}</span>
                </div>
                <div className="rate-info">
                  <div className="info-item">
                    <span className="info-label">Período:</span>
                    <span className="info-value">{MONTHS[rate.month - 1].label} {rate.year}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Fuente:</span>
                    <span className="info-value">{rate.source}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Conversión:</span>
                    <span className="info-value">1 {rate.currency} = {parseFloat(rate.rate).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 6 })} {rate.base_currency}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={handleFormClose}>
          <div className="modal-content exchange-rate-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{rateToEdit ? 'Editar Tipo de Cambio' : 'Nuevo Tipo de Cambio'}</h2>
              <button className="modal-close" onClick={handleFormClose}>×</button>
            </div>

            {formError && (
              <div className="modal-error">
                <AlertCircle className="w-5 h-5" />
                <p>{formError}</p>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="exchange-rate-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="base_currency">Moneda Base *</label>
                  <select
                    id="base_currency"
                    value={formData.base_currency}
                    onChange={(e) => setFormData({ ...formData, base_currency: e.target.value as Currency })}
                    required
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                  <small className="form-help">La moneda de referencia</small>
                </div>

                <div className="form-group">
                  <label htmlFor="currency">Moneda a Convertir *</label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
                    required
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                  <small className="form-help">La moneda que deseas convertir</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="year">Año *</label>
                  <select
                    id="year"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  >
                    {Array.from({ length: 16 }, (_, i) => 2020 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="month">Mes *</label>
                  <select
                    id="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                    required
                  >
                    {MONTHS.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="rate">Tasa de Cambio *</label>
                <input
                  id="rate"
                  type="number"
                  step="0.000001"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  placeholder="4250.50"
                  required
                  min="0.000001"
                />
                <small className="form-help">
                  Cuántas unidades de {formData.base_currency} equivalen a 1 {formData.currency}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="source">Fuente</label>
                <input
                  id="source"
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  placeholder="manual, banco_central, etc."
                  maxLength={50}
                />
                <small className="form-help">Origen de la tasa (opcional)</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={handleFormClose}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
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

