import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, AlertTriangle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { useAlerts } from '../context/AlertContext';
import { useBudgets } from '../context/BudgetContext';
import './AlertCenter.css';

interface AlertCenterProps {
  onViewBudget?: (budgetId: number) => void;
}

const AlertCenter: React.FC<AlertCenterProps> = ({ onViewBudget }) => {
  const { alerts, unreadCount, isLoading, refreshAlerts, markAsRead, markAllAsRead, deleteAlert } = useAlerts();
  const { getBudgetDetail } = useBudgets();
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Cargar alertas cuando se abre
      refreshAlerts();
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, refreshAlerts]);

  const formatCurrency = (amount: string | number): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(numAmount));
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    setErrorMessage(null);
    try {
      await markAllAsRead();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al marcar todas las alertas como leídas';
      setErrorMessage(message);
      console.error('Error al marcar todas como leídas:', err);
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    setErrorMessage(null);
    try {
      await markAsRead(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al marcar la alerta como leída';
      setErrorMessage(message);
      console.error('Error al marcar como leída:', err);
    }
  };

  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    setErrorMessage(null);
    try {
      await deleteAlert(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la alerta';
      setErrorMessage(message);
      console.error('Error al eliminar alerta:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewBudget = async (budgetId: number) => {
    if (onViewBudget) {
      setErrorMessage(null);
      try {
        await getBudgetDetail(budgetId);
        onViewBudget(budgetId);
        setIsOpen(false);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al obtener el presupuesto';
        setErrorMessage(message);
        console.error('Error al obtener presupuesto:', err);
      }
    }
  };

  const getAlertIcon = (type: string) => {
    if (type === 'exceeded') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    return <AlertTriangle className="w-5 h-5 text-amber-600" />;
  };

  const getAlertMessage = (alert: typeof alerts[0]) => {
    const categoryName = alert.budget_category_name || 'Categoría';
    const percentage = alert.budget_spent_percentage
      ? parseFloat(alert.budget_spent_percentage).toFixed(1)
      : '0';
    const amount = alert.budget_amount ? formatCurrency(alert.budget_amount) : '';

    if (alert.alert_type === 'exceeded') {
      return `${categoryName}: Has superado el 100% del presupuesto (${percentage}%)`;
    }
    return `${categoryName}: Has alcanzado el ${percentage}% del presupuesto${amount ? ` (${amount})` : ''}`;
  };

  const unreadAlerts = alerts.filter((alert) => !alert.is_read);
  const readAlerts = alerts.filter((alert) => alert.is_read);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Centro de notificaciones"
        aria-expanded={isOpen}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="text-lg font-semibold text-gray-900">Alertas de Presupuesto</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                  {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isMarkingAll}
                  className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Marcar todas como leídas"
                >
                  {isMarkingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCheck className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-auto text-red-600 hover:text-red-800"
                  aria-label="Cerrar error"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-8 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Cargando alertas...</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm font-medium">No hay alertas</p>
                <p className="text-xs mt-1">Las alertas aparecerán aquí cuando alcances el 80% o 100% de tus presupuestos</p>
              </div>
            ) : (
              <div>
                {unreadAlerts.length > 0 && (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                      No leídas
                    </p>
                    {unreadAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 mb-2 mx-2 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert.alert_type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{getAlertMessage(alert)}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(alert.created_at)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {onViewBudget && (
                                <button
                                  onClick={() => handleViewBudget(alert.budget)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Ver presupuesto
                                </button>
                              )}
                              <button
                                onClick={() => handleMarkAsRead(alert.id)}
                                className="text-xs text-gray-600 hover:text-gray-700 font-medium flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Marcar como leída
                              </button>
                              <button
                                onClick={() => handleDelete(alert.id)}
                                disabled={isDeleting === alert.id}
                                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                              >
                                {isDeleting === alert.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {readAlerts.length > 0 && (
                  <div className="p-2 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">
                      Leídas
                    </p>
                    {readAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 mb-2 mx-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors opacity-75"
                      >
                        <div className="flex items-start gap-3">
                          {getAlertIcon(alert.alert_type)}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">{getAlertMessage(alert)}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(alert.created_at)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {onViewBudget && (
                                <button
                                  onClick={() => handleViewBudget(alert.budget)}
                                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  Ver presupuesto
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(alert.id)}
                                disabled={isDeleting === alert.id}
                                className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                              >
                                {isDeleting === alert.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertCenter;

