import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { alertService, BudgetAlert, AlertFilters } from '../services/alertService';
import { useAuth } from './AuthContext';

interface AlertContextValue {
  alerts: BudgetAlert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refreshAlerts: (filters?: AlertFilters) => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteAlert: (id: number) => Promise<void>;
  getAlert: (id: number) => Promise<BudgetAlert>;
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAlerts = useCallback(
    async (filters?: AlertFilters) => {
      if (!isAuthenticated) {
        setAlerts([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await alertService.list(filters);
        setAlerts(response.results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudieron cargar las alertas';
        setError(message);
        console.error('Error al cargar alertas:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated],
  );

  useEffect(() => {
    if (isAuthenticated) {
      loadAlerts();
    } else {
      setAlerts([]);
    }
  }, [isAuthenticated, loadAlerts]);

  const refreshAlerts = useCallback(
    async (filters?: AlertFilters) => {
      await loadAlerts(filters);
    },
    [loadAlerts],
  );

  const markAsRead = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await alertService.markAsRead(id);
        // Actualizar el estado local
        setAlerts((prev) =>
          prev.map((alert) => (alert.id === id ? { ...alert, is_read: true } : alert)),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo marcar la alerta como leída';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const markAllAsRead = useCallback(async (): Promise<void> => {
    setError(null);
    try {
      await alertService.markAllAsRead();
      // Actualizar el estado local
      setAlerts((prev) => prev.map((alert) => ({ ...alert, is_read: true })));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron marcar todas las alertas como leídas';
      setError(message);
      throw err;
    }
  }, []);

  const deleteAlert = useCallback(
    async (id: number): Promise<void> => {
      setError(null);
      try {
        await alertService.delete(id);
        // Remover del estado local
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo eliminar la alerta';
        setError(message);
        throw err;
      }
    },
    [],
  );

  const getAlert = useCallback(async (id: number): Promise<BudgetAlert> => {
    setError(null);
    try {
      return await alertService.get(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo obtener la alerta';
      setError(message);
      throw err;
    }
  }, []);

  const unreadCount = alerts.filter((alert) => !alert.is_read).length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        unreadCount,
        isLoading,
        error,
        refreshAlerts,
        markAsRead,
        markAllAsRead,
        deleteAlert,
        getAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlerts = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlerts debe ser usado dentro de un AlertProvider');
  }
  return context;
};

