import React from 'react';
import { UpcomingBill } from '../services/dashboardService';
import { formatMoney } from '../utils/currencyUtils';
import './UpcomingBills.css';

interface UpcomingBillsProps {
  bills: UpcomingBill[];
}

const UpcomingBills: React.FC<UpcomingBillsProps> = ({ bills }) => {
  const getUrgencyEmoji = (urgency: string): string => {
    switch (urgency) {
      case 'overdue': return '🔴';
      case 'today': return '🟡';
      case 'urgent': return '🟠';
      case 'soon': return '🔵';
      case 'normal': return '🟢';
      default: return '⚪';
    }
  };

  const formatDaysUntilDue = (days: number): string => {
    if (days < 0) {
      const absDays = Math.abs(days);
      return absDays === 1 ? 'Vencida hace 1 día' : `Vencida hace ${absDays} días`;
    }
    if (days === 0) return 'Vence hoy';
    if (days === 1) return 'Vence mañana';
    return `Vence en ${days} días`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  // Ordenar por urgencia: overdue, today, urgent, soon, normal
  const urgencyOrder = { overdue: 0, today: 1, urgent: 2, soon: 3, normal: 4 };
  const sortedBills = [...bills].sort((a, b) => {
    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
  });

  if (bills.length === 0) {
    return (
      <div className="upcoming-bills">
        <h3 className="upcoming-bills-title">Próximas Facturas a Vencer</h3>
        <div className="upcoming-bills-empty">
          <p>No hay facturas pendientes en este período</p>
        </div>
      </div>
    );
  }

  return (
    <div className="upcoming-bills">
      <h3 className="upcoming-bills-title">Próximas Facturas a Vencer</h3>
      <div className="upcoming-bills-list stagger-list">
        {sortedBills.map((bill) => (
          <div 
            key={bill.id} 
            className={`upcoming-bill-item urgency-${bill.urgency}`}
            style={{ 
              borderLeftColor: bill.urgency_color,
              borderLeftWidth: '4px',
              borderLeftStyle: 'solid'
            }}
          >
            <div className="bill-header">
              <div className="bill-title-section">
                <span className="bill-urgency-emoji">{getUrgencyEmoji(bill.urgency)}</span>
                <span className="bill-provider">{bill.provider}</span>
              </div>
              <span className="bill-amount" style={{ color: bill.urgency_color }}>
                {formatMoney(bill.amount)} COP
              </span>
            </div>
            
            <div className="bill-details">
              <div className="bill-info-row">
                <span className="bill-label">Vencimiento:</span>
                <span className="bill-value">{formatDate(bill.due_date)}</span>
              </div>
              
              <div className="bill-info-row">
                <span className="bill-label">Estado:</span>
                <span 
                  className={`bill-status bill-status-${bill.urgency}`}
                  style={{ color: bill.urgency_color }}
                >
                  {bill.urgency_label} - {formatDaysUntilDue(bill.days_until_due)}
                </span>
              </div>

              {bill.description && (
                <div className="bill-info-row">
                  <span className="bill-label">Descripción:</span>
                  <span className="bill-value">{bill.description}</span>
                </div>
              )}

              {bill.category && (
                <div className="bill-info-row">
                  <span className="bill-label">Categoría:</span>
                  <span 
                    className="bill-category"
                    style={{ color: bill.category_color || undefined }}
                  >
                    {bill.category_icon && `${bill.category_icon} `}
                    {bill.category}
                  </span>
                </div>
              )}

              {bill.suggested_account && (
                <div className="bill-info-row">
                  <span className="bill-label">Cuenta sugerida:</span>
                  <span className="bill-value">{bill.suggested_account}</span>
                </div>
              )}

              {bill.is_recurring && (
                <div className="bill-recurring-badge">
                  🔄 Recurrente
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingBills;
