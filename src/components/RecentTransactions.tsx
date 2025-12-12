import React from 'react';
import { RecentTransaction } from '../services/dashboardService';
import { formatMoney } from '../utils/currencyUtils';
import './RecentTransactions.css';

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  const getTypeLabel = (typeCode: number): string => {
    switch (typeCode) {
      case 1: return 'Ingreso';
      case 2: return 'Gasto';
      case 3: return 'Transferencia';
      case 4: return 'Ahorro';
      default: return 'Movimiento';
    }
  };

  const getTypeIcon = (typeCode: number): string => {
    switch (typeCode) {
      case 1: return '↓'; // Ingreso
      case 2: return '↑'; // Gasto
      case 3: return '⇄'; // Transferencia
      case 4: return '💰'; // Ahorro
      default: return '•';
    }
  };

  const getTypeColor = (typeCode: number): string => {
    switch (typeCode) {
      case 1: return '#10b981'; // Verde para ingresos
      case 2: return '#ef4444'; // Rojo para gastos
      case 3: return '#3b82f6'; // Azul para transferencias
      case 4: return '#f59e0b'; // Naranja para ahorros
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('es-ES', { month: 'short' });
    return `${day} ${month}`;
  };

  if (transactions.length === 0) {
    return (
      <div className="recent-transactions">
        <h3 className="recent-transactions-title">Movimientos Recientes</h3>
        <div className="recent-transactions-empty">
          <p>No hay movimientos registrados en este período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="recent-transactions">
      <h3 className="recent-transactions-title">Movimientos Recientes</h3>
      <div className="recent-transactions-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="recent-transaction-item">
            <div 
              className="transaction-icon"
              style={{ backgroundColor: getTypeColor(transaction.type_code) }}
            >
              {getTypeIcon(transaction.type_code)}
            </div>
            <div className="transaction-info">
              <div className="transaction-header">
                <span className="transaction-description">{transaction.description}</span>
                <span 
                  className="transaction-amount"
                  style={{ color: getTypeColor(transaction.type_code) }}
                >
                  {transaction.type_code === 2 ? '-' : '+'}{formatMoney(transaction.amount)} {transaction.currency}
                </span>
              </div>
              <div className="transaction-details">
                <span className="transaction-type">{getTypeLabel(transaction.type_code)}</span>
                {transaction.category && (
                  <>
                    <span className="transaction-separator">•</span>
                    <span 
                      className="transaction-category"
                      style={{ color: transaction.category_color || undefined }}
                    >
                      {transaction.category_icon && `${transaction.category_icon} `}
                      {transaction.category}
                    </span>
                  </>
                )}
                <span className="transaction-separator">•</span>
                <span className="transaction-date">{formatDate(transaction.date)}</span>
              </div>
              <div className="transaction-account">
                Cuenta: {transaction.account}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentTransactions;
