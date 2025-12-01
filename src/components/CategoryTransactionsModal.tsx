import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Tag } from 'lucide-react';
import { analyticsService, CategoryTransaction } from '../services/analyticsService';
import './CategoryTransactionsModal.css';

interface CategoryTransactionsModalProps {
  categoryId: string;
  period: string;
  mode: 'base' | 'total';
  onClose: () => void;
}

const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  categoryId,
  period,
  mode,
  onClose,
}) => {
  const [transactions, setTransactions] = useState<CategoryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryInfo, setCategoryInfo] = useState<{
    name: string;
    total: string;
    count: number;
  } | null>(null);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await analyticsService.getCategoryTransactions(
        categoryId,
        period,
        mode
      );
      if (response.success) {
        setTransactions(response.data.transactions);
        setCategoryInfo({
          name: response.data.category_name,
          total: response.data.formatted_total,
          count: response.data.total_count,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar transacciones');
    } finally {
      setLoading(false);
    }
  }, [categoryId, period, mode]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="category-modal-overlay" onClick={onClose}>
      <div className="category-modal" onClick={(e) => e.stopPropagation()}>
        <div className="category-modal-header">
          <div>
            <h2 className="category-modal-title">
              Transacciones: {categoryInfo?.name || 'Cargando...'}
            </h2>
            {categoryInfo && (
              <p className="category-modal-subtitle">
                {categoryInfo.count} transacciones • Total: {categoryInfo.total}
              </p>
            )}
          </div>
          <button onClick={onClose} className="category-modal-close">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="category-modal-content">
          {loading ? (
            <div className="category-modal-loading">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Cargando transacciones...</p>
            </div>
          ) : error ? (
            <div className="category-modal-error">
              <p className="text-red-600">{error}</p>
              <button onClick={loadTransactions} className="retry-button">
                Reintentar
              </button>
            </div>
          ) : transactions.length === 0 ? (
            <div className="category-modal-empty">
              <p className="text-gray-500">
                No hay transacciones en esta categoría para el período seleccionado
              </p>
            </div>
          ) : (
            <div className="category-transactions-list">
              {transactions.map((tx) => (
                <div key={tx.id} className="category-transaction-item">
                  <div className="transaction-main">
                    <div className="transaction-info">
                      <div className="transaction-description">
                        {tx.description || 'Sin descripción'}
                      </div>
                      <div className="transaction-meta">
                        <span className="transaction-date">{formatDate(tx.date)}</span>
                        <span className="transaction-account">{tx.account}</span>
                      </div>
                      {tx.tag && (
                        <div className="transaction-tag">
                          <Tag className="w-3 h-3" />
                          <span>{tx.tag}</span>
                        </div>
                      )}
                    </div>
                    <div className="transaction-amount">
                      {tx.formatted_amount}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryTransactionsModal;

