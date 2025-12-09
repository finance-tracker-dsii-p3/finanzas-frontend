import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Edit2,
  Loader2,
  Palette,
  Plus,
  RefreshCcw,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';
import ConfirmModal from '../../components/ConfirmModal';
import { Category, CategoryDeletionValidation, CategoryPayload, CategoryType } from '../../services/categoryService';
import './categories.css';

type FormMode = 'create' | 'edit';

interface CategoryFormValues {
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  is_active: boolean;
}

interface CategoriesPageProps {
  onBack: () => void;
}

interface IconOption {
  value: string;
  label: string;
}

const DEFAULT_ICON_BY_TYPE: Record<CategoryType, string> = {
  expense: 'fa-wallet',
  income: 'fa-coins',
};

const defaultFormValues: CategoryFormValues = {
  name: '',
  type: 'expense',
  color: '#3b82f6',
  icon: DEFAULT_ICON_BY_TYPE.expense,
  is_active: true,
};

const FALLBACK_ICON_OPTIONS: IconOption[] = [
  { value: 'fa-shopping-cart', label: 'Carrito de compras' },
  { value: 'fa-shopping-basket', label: 'Canasta de compras' },
  { value: 'fa-utensils', label: 'Comida' },
  { value: 'fa-piggy-bank', label: 'Ahorro' },
  { value: 'fa-wallet', label: 'Billetera' },
  { value: 'fa-coins', label: 'Monedas' },
  { value: 'fa-credit-card', label: 'Tarjeta de crédito' },
  { value: 'fa-chart-line', label: 'Inversión' },
  { value: 'fa-briefcase', label: 'Trabajo' },
  { value: 'fa-graduation-cap', label: 'Educación' },
  { value: 'fa-heartbeat', label: 'Salud' },
  { value: 'fa-bus', label: 'Transporte' },
  { value: 'fa-plane', label: 'Viajes' },
  { value: 'fa-gift', label: 'Regalos' },
  { value: 'fa-bolt', label: 'Servicios' },
  { value: 'fa-baby', label: 'Familia' },
  { value: 'fa-seedling', label: 'Sostenible' },
  { value: 'fa-question-circle', label: 'Genérico' },
];
const ALLOWED_ICON_VALUES = new Set(FALLBACK_ICON_OPTIONS.map((icon) => icon.value));
const COMMON_ICON_VALUES = FALLBACK_ICON_OPTIONS.map((icon) => icon.value);

const normalizeHex = (hex: string) => {
  if (!hex) return '';
  return hex.startsWith('#') ? hex : `#${hex}`;
};

const hexToRgb = (hex: string) => {
  const normalized = normalizeHex(hex).replace('#', '');
  if (normalized.length !== 6) {
    return null;
  }
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
};

const getLuminance = (hex: string) => {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const { r, g, b } = rgb;
  const srgb = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const getContrastRatio = (colorHex: string, compareHex: string) => {
  const lum1 = getLuminance(colorHex);
  const lum2 = getLuminance(compareHex);
  if (lum1 === null || lum2 === null) return null;

  const [lighter, darker] = lum1 > lum2 ? [lum1, lum2] : [lum2, lum1];
  return (lighter + 0.05) / (darker + 0.05);
};

const getContrastFeedback = (color: string) => {
  const contrastWhite = getContrastRatio(color, '#ffffff');
  const contrastBlack = getContrastRatio(color, '#000000');
  const bestRatio = Math.max(contrastWhite ?? 0, contrastBlack ?? 0);
  const passes = bestRatio >= 4.5;
  const recommendedTextColor =
    (contrastWhite ?? 0) >= (contrastBlack ?? 0) ? '#000000' : '#ffffff';
  return {
    ratio: bestRatio,
    passes,
    recommendedTextColor,
  };
};

const prioritizeIcons = (icons: IconOption[]) => {
  const uniqueMap = new Map<string, IconOption>();
  icons.forEach((icon) => {
    if (!uniqueMap.has(icon.value)) {
      uniqueMap.set(icon.value, icon);
    }
  });

  const prioritized: IconOption[] = [];
  COMMON_ICON_VALUES.forEach((value) => {
    const icon = uniqueMap.get(value);
    if (icon) {
      const fallbackLabel = FALLBACK_ICON_OPTIONS.find((fallback) => fallback.value === value)?.label;
      prioritized.push({
        ...icon,
        label: fallbackLabel || icon.label,
      });
      uniqueMap.delete(value);
    }
  });

  const remaining = Array.from(uniqueMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'es'),
  );

  return [...prioritized, ...remaining];
};

const CategoriesPage: React.FC<CategoriesPageProps> = ({ onBack }) => {
  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    toggleCategory,
    deleteCategory,
    deleteCategoryWithReassignment,
    validateDeletion,
    refreshCategories,
    createDefaultCategories,
  } = useCategories();

  const [mode, setMode] = useState<FormMode>('create');
  const [showFormModal, setShowFormModal] = useState(false);
  const [formValues, setFormValues] = useState<CategoryFormValues>(defaultFormValues);
  const [formError, setFormError] = useState<string | null>(null);
  const [debouncedColor, setDebouncedColor] = useState(defaultFormValues.color);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedColor(formValues.color), 150);
    return () => clearTimeout(handler);
  }, [formValues.color]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CategoryType>('all');
  const [showInactive, setShowInactive] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'warning' | 'danger' | 'info';
    cancelText?: string;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning',
  });
  const [deleteValidation, setDeleteValidation] = useState<CategoryDeletionValidation | null>(null);
  const [isLoadingDeleteValidation, setIsLoadingDeleteValidation] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reassignmentTarget, setReassignmentTarget] = useState<number | ''>('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [iconSearchInput, setIconSearchInput] = useState('');
  const [iconSearch, setIconSearch] = useState('');
  const iconOptions = useMemo(() => prioritizeIcons(FALLBACK_ICON_OPTIONS), []);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const handler = setTimeout(() => setIconSearch(iconSearchInput), 250);
    return () => clearTimeout(handler);
  }, [iconSearchInput]);

  const filteredIcons = useMemo(() => {
    const baseIcons = iconOptions.filter((icon) => ALLOWED_ICON_VALUES.has(icon.value));
    if (!iconSearch.trim()) {
      return baseIcons;
    }
    const needle = iconSearch.toLowerCase();
    return baseIcons.filter(
      (icon) =>
        icon.label.toLowerCase().includes(needle) ||
        icon.value.toLowerCase().includes(needle),
    );
  }, [iconOptions, iconSearch]);

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (typeFilter !== 'all' && category.type !== typeFilter) {
        return false;
      }
      if (!showInactive && !category.is_active) {
        return false;
      }
      if (!searchTerm.trim()) {
        return true;
      }
      return category.name.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [categories, typeFilter, showInactive, searchTerm]);

  const selectedIconOption = useMemo(
    () => iconOptions.find((icon) => icon.value === formValues.icon),
    [iconOptions, formValues.icon],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));
  const paginatedCategories = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, showInactive]);

  const handleOpenCreate = () => {
    setMode('create');
    setFormValues(defaultFormValues);
    setShowFormModal(true);
    setCategoryToEdit(null);
    setFormError(null);
  };

  const handleOpenEdit = useCallback((category: Category) => {
    setMode('edit');
    setCategoryToEdit(category);
    setFormValues({
      name: category.name,
      type: category.type,
      color: category.color || '#3b82f6',
      icon: category.icon || 'fa-circle',
      is_active: category.is_active,
    });
    setFormError(null);
    setShowFormModal(true);
  }, []);

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const trimmedName = formValues.name.trim();
    if (!trimmedName) {
      setFormError('El nombre es obligatorio');
      return;
    }

    const duplicate = categories.some(
      (category) =>
        category.name.toLowerCase() === trimmedName.toLowerCase() &&
        category.type === formValues.type &&
        category.id !== categoryToEdit?.id,
    );

    if (duplicate) {
      setFormError('Ya existe una categoría con el mismo nombre y tipo');
      return;
    }

    const payload: CategoryPayload = {
      name: trimmedName,
      type: formValues.type,
      color: formValues.color,
      icon: formValues.icon,
      is_active: formValues.is_active,
    };

    setIsSubmitting(true);
    try {
      if (mode === 'create') {
        await createCategory(payload);
      } else if (categoryToEdit) {
        const { type: _ignoredType, ...rest } = payload;
        void _ignoredType;
        await updateCategory(categoryToEdit.id, rest);
      }
      
      // Refrescar las categorías para asegurar que todos los componentes se actualicen
      try {
        await refreshCategories({ active_only: false });
      } catch {
        void 0;
      }
      
      setShowFormModal(false);
      setCategoryToEdit(null);
      setFormValues(defaultFormValues);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo guardar la categoría';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCategory = useCallback(
    async (category: Category) => {
      try {
        await toggleCategory(category.id);
      } catch (err) {
        setConfirmModal({
          isOpen: true,
          title: 'Error',
          message: err instanceof Error ? err.message : 'No se pudo actualizar el estado',
          type: 'danger',
          onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
          cancelText: undefined,
        });
      }
    },
    [toggleCategory],
  );

  const handleOpenDelete = useCallback(
    async (category: Category) => {
      setCategoryToDelete(category);
      setDeleteValidation(null);
      setDeleteError(null);
      setReassignmentTarget('');

      setIsLoadingDeleteValidation(true);
      try {
        const validation = await validateDeletion(category.id);
        setDeleteValidation(validation);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo validar la eliminación';
        setDeleteError(message);
      } finally {
        setIsLoadingDeleteValidation(false);
      }
    },
    [validateDeletion],
  );

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setDeleteError(null);

    if (deleteValidation?.requires_reassignment && !reassignmentTarget) {
      setDeleteError('Debes seleccionar la categoría de reasignación');
      return;
    }

    setIsDeleting(true);
    try {
      if (deleteValidation?.requires_reassignment && reassignmentTarget) {
        await deleteCategoryWithReassignment(categoryToDelete.id, Number(reassignmentTarget));
      } else {
        await deleteCategory(categoryToDelete.id);
      }
      setCategoryToDelete(null);
      setDeleteValidation(null);
      setReassignmentTarget('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo eliminar la categoría';
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateDefaults = async () => {
    try {
      await createDefaultCategories();
    } catch (err) {
      setConfirmModal({
        isOpen: true,
        title: 'Error',
        message: err instanceof Error ? err.message : 'No se pudieron crear las categorías base',
        type: 'danger',
        onConfirm: () => setConfirmModal({ ...confirmModal, isOpen: false }),
        cancelText: undefined,
      });
    }
  };

  const typeCounters = useMemo(() => {
    const totals = categories.reduce(
      (acc, category) => {
        const key = category.type === 'income' ? 'income' : 'expense';
        acc[key].total += 1;
        if (category.is_active) {
          acc[key].active += 1;
        }
        return acc;
      },
      {
        income: { total: 0, active: 0 },
        expense: { total: 0, active: 0 },
      },
    );
    return totals;
  }, [categories]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al Dashboard
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Catálogo de categorías</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => refreshCategories()}
                className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                Actualizar
              </button>
              <button
                onClick={handleCreateDefaults}
                className="inline-flex items-center gap-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
              >
                <Palette className="w-4 h-4" />
                Crear base
              </button>
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nueva categoría
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <MetricCard
              label="Gastos"
              value={typeCounters.expense.total}
              sublabel={`${typeCounters.expense.active} activas`}
            />
            <MetricCard
              label="Ingresos"
              value={typeCounters.income.total}
              sublabel={`${typeCounters.income.active} activas`}
            />
            <MetricCard
              label="Totales"
              value={categories.length}
              sublabel={`${categories.filter((c) => c.is_active).length} activas`}
            />
          </div>

          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-1" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Sin duplicados y con contraste accesible</p>
              <p>
                El sistema valida nombre+tipo únicos y colores con buen contraste. Aun así, procura usar tonos con ratio &gt;
                4.5.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'expense', 'income'] as Array<'all' | CategoryType>).map((option) => (
                <button
                  key={option}
                  onClick={() => setTypeFilter(option)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    typeFilter === option
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option === 'all' ? 'Todas' : option === 'expense' ? 'Gastos' : 'Ingresos'}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                Mostrar inactivas
              </label>
              <div className="relative w-full md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          <CategoryList
            categories={paginatedCategories}
            totalItems={filteredCategories.length}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
            searchTerm={searchTerm}
            error={error}
            onToggle={handleToggleCategory}
            onEdit={handleOpenEdit}
            onDelete={handleOpenDelete}
          />
        </section>
      </main>

      {showFormModal && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={() => setShowFormModal(false)}>
          <div
            className="categories-page-modal bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
                </h2>
                <p className="text-sm text-gray-500">
                  Define nombre, color, icono y tipo. El backend validará contraste y duplicados.
                </p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Cerrar</span>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-4" onSubmit={handleFormSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formValues.name}
                  onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej. Comida, Transporte..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formValues.type}
                    onChange={(e) => {
                      const nextType = e.target.value as CategoryType;
                      setFormValues((prev) => ({
                        ...prev,
                        type: nextType,
                        icon:
                          mode === 'create' || !prev.icon
                            ? DEFAULT_ICON_BY_TYPE[nextType] || prev.icon
                            : prev.icon,
                      }));
                    }}
                    disabled={mode === 'edit'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                  >
                    <option value="expense">Gasto</option>
                    <option value="income">Ingreso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    value={formValues.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormValues({ ...formValues, is_active: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Activa</option>
                    <option value="inactive">Inactiva</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formValues.color}
                    onChange={(e) => setFormValues({ ...formValues, color: e.target.value })}
                    className="w-16 h-10 border border-gray-300 rounded"
                  />
                  <div className="flex-1 text-sm text-gray-600">
                    <ContrastSummary color={debouncedColor} />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Ícono <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-gray-500 flex items-center gap-2">
                    Seleccionado:
                    {formValues.icon ? (
                      <span className="inline-flex items-center gap-1 text-gray-700 font-semibold">
                        <i className={`fa-solid ${formValues.icon}`} aria-hidden="true"></i>
                        {selectedIconOption?.label || formValues.icon}
                      </span>
                    ) : (
                      'Sin icono'
                    )}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={iconSearchInput}
                    onChange={(e) => setIconSearchInput(e.target.value)}
                    placeholder="Buscar icono por nombre"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <div className="border border-gray-200 rounded-lg p-2">
                    {filteredIcons.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center py-4">No se encontraron íconos</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                        {filteredIcons.map((icon) => (
                          <button
                            type="button"
                            key={icon.value}
                            onClick={() => setFormValues({ ...formValues, icon: icon.value })}
                            className={`px-3 py-2 text-left rounded-lg border text-sm transition-colors ${
                              formValues.icon === icon.value
                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <i className={`fa-solid ${icon.value} text-base`} aria-hidden="true"></i>
                              <span className="font-semibold">{icon.label}</span>
                            </div>
                            <span className="text-xs text-gray-500 mt-1 inline-block">{icon.value}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {formError && <p className="text-sm text-red-600">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {mode === 'create' ? 'Crear categoría' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4" onClick={() => setCategoryToDelete(null)}>
          <div
            className="categories-page-modal bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar categoría</h3>
                <p className="text-sm text-gray-600">La información asociada debe reasignarse antes de borrar.</p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-gray-900">{categoryToDelete.name}</p>
              <p className="text-xs text-gray-500 capitalize">{categoryToDelete.type_display}</p>
            </div>

            {isLoadingDeleteValidation ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Validando relaciones...
              </div>
            ) : deleteValidation ? (
              <div className="space-y-3">
                {deleteValidation.errors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">
                    {deleteValidation.errors.map((errorMsg, index) => (
                      <p key={index}>{errorMsg}</p>
                    ))}
                  </div>
                )}
                {deleteValidation.warnings.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-sm text-amber-700 rounded-lg">
                    {deleteValidation.warnings.map((warning, index) => (
                      <p key={index}>{warning}</p>
                    ))}
                  </div>
                )}
                {deleteValidation.related_data && (
                  <div className="text-sm text-gray-600">
                    {Object.entries(deleteValidation.related_data).map(([key, value]) => (
                      <p key={key} className="capitalize">
                        {key.replace('_', ' ')}: <span className="font-semibold text-gray-900">{value}</span>
                      </p>
                    ))}
                  </div>
                )}
                {deleteValidation.requires_reassignment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selecciona la categoría destino
                    </label>
                    <select
                      value={reassignmentTarget}
                      onChange={(e) => setReassignmentTarget(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar...</option>
                      {categories
                        .filter((category) => category.id !== categoryToDelete.id && category.type === categoryToDelete.type)
                        .map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>
            ) : (
              deleteError && <p className="text-sm text-red-600">{deleteError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCategoryToDelete(null);
                  setDeleteValidation(null);
                  setReassignmentTarget('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting || (deleteValidation?.requires_reassignment && !reassignmentTarget)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Eliminar
              </button>
            </div>
            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="Aceptar"
        cancelText={confirmModal.cancelText}
        type={confirmModal.type || 'warning'}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

const CategoryList = React.memo<{
  categories: Category[];
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  searchTerm: string;
  error: string | null;
  onToggle: (category: Category) => void;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}>(
  ({
    categories,
    totalItems,
    currentPage,
    pageSize,
    onPageChange,
    isLoading,
    searchTerm,
    error,
    onToggle,
    onEdit,
    onDelete,
  }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const canGoPrev = currentPage > 1;
    const canGoNext = currentPage < totalPages;

  return (
    <div className="mt-6">
      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando categorías...
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>{searchTerm ? 'No hay categorías que coincidan con tu búsqueda' : 'Aún no tienes categorías configuradas'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-blue-200 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-white font-semibold"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                >
                  {category.icon ? (
                    <i className={`fa-solid ${category.icon} text-lg`} aria-hidden="true"></i>
                  ) : (
                    category.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{category.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {category.type_display} · {category.icon_display || category.icon}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-xs text-gray-500 text-right">
                  <p>Uso</p>
                  <p className="font-semibold text-gray-900">{category.usage_count ?? 0}</p>
                </div>
                <button
                  onClick={() => onToggle(category)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    category.is_active
                      ? 'border-green-200 text-green-700 bg-green-50 hover:bg-green-100'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {category.is_active ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Activa
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Inactiva
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(category)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-sm text-red-700 rounded-lg">{error}</div>
      )}
        {totalItems > pageSize && !isLoading && (
          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => canGoPrev && onPageChange(currentPage - 1)}
              disabled={!canGoPrev}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Anterior
            </button>
            <span className="text-gray-600">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => canGoNext && onPageChange(currentPage + 1)}
              disabled={!canGoNext}
              className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
    </div>
    );
  },
);

const MetricCard: React.FC<{ label: string; value: number; sublabel: string }> = ({ label, value, sublabel }) => (
  <div className="flex-1 min-w-[180px] rounded-lg border border-gray-200 bg-white p-4 shadow-sm text-center">
    <p className="text-sm text-gray-500">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-xs text-gray-500">{sublabel}</p>
  </div>
);

const ContrastSummary: React.FC<{ color: string }> = ({ color }) => {
  const memoizedFeedback = useMemo(() => getContrastFeedback(color), [color]);

  return (
    <div>
      <p>
        Contraste máximo: {memoizedFeedback.ratio ? memoizedFeedback.ratio.toFixed(2) : '—'}{' '}
        {memoizedFeedback.passes ? (
          <span className="text-green-600 font-medium">OK</span>
        ) : (
          <span className="text-amber-600 font-medium">Bajo</span>
        )}
      </p>
      <p>Texto sugerido: {memoizedFeedback.recommendedTextColor === '#000000' ? 'Oscuro' : 'Claro'}</p>
    </div>
  );
};

export default CategoriesPage;
