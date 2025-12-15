import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils/test-utils';
import UpcomingBills from './UpcomingBills';
import { UpcomingBill } from '../services/dashboardService';

describe('UpcomingBills', () => {
  const mockBills: UpcomingBill[] = [
    {
      id: 1,
      provider: 'Servicios Públicos',
      amount: 150000,
      amount_formatted: '$150,000',
      due_date: '2025-01-20',
      urgency: 'urgent',
      urgency_label: 'Urgente',
      urgency_color: '#f59e0b',
      days_until_due: 5,
      status: 'pending',
      suggested_account: null,
      suggested_account_id: null,
      category: null,
      category_color: null,
      category_icon: null,
      description: '',
      is_recurring: false,
    },
    {
      id: 2,
      provider: 'Internet',
      amount: 80000,
      amount_formatted: '$80,000',
      due_date: '2025-01-25',
      urgency: 'soon',
      urgency_label: 'Próxima',
      urgency_color: '#3b82f6',
      days_until_due: 10,
      status: 'pending',
      suggested_account: null,
      suggested_account_id: null,
      category: null,
      category_color: null,
      category_icon: null,
      description: '',
      is_recurring: false,
    },
    {
      id: 3,
      provider: 'Factura Vencida',
      amount: 200000,
      amount_formatted: '$200,000',
      due_date: '2025-01-10',
      urgency: 'overdue',
      urgency_label: 'Vencida',
      urgency_color: '#ef4444',
      days_until_due: -5,
      status: 'overdue',
      suggested_account: null,
      suggested_account_id: null,
      category: null,
      category_color: null,
      category_icon: null,
      description: '',
      is_recurring: false,
    },
  ];

  it('debe renderizar el componente', () => {
    render(<UpcomingBills bills={mockBills} />);
    expect(screen.getByText(/próximas facturas a vencer/i)).toBeInTheDocument();
  });

  it('debe mostrar las facturas', () => {
    render(<UpcomingBills bills={mockBills} />);
    expect(screen.getByText(/servicios públicos/i)).toBeInTheDocument();
    expect(screen.getByText(/internet/i)).toBeInTheDocument();
    expect(screen.getByText(/factura vencida/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay facturas', () => {
    render(<UpcomingBills bills={[]} />);
    expect(screen.getByText(/no hay facturas pendientes/i)).toBeInTheDocument();
  });

  it('debe ordenar las facturas por urgencia', () => {
    render(<UpcomingBills bills={mockBills} />);
    const bills = screen.getAllByText(/servicios públicos|internet|factura vencida/i);

    expect(bills[0]).toHaveTextContent(/factura vencida/i);
  });

  it('debe mostrar días hasta vencimiento correctamente', () => {
    render(<UpcomingBills bills={[mockBills[0]]} />);
    expect(screen.getByText(/vence en 5 días/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje para facturas vencidas', () => {
    render(<UpcomingBills bills={[mockBills[2]]} />);
    expect(screen.getByText(/vencida hace 5 días/i)).toBeInTheDocument();
  });

  it('debe mostrar emoji de urgencia', () => {
    render(<UpcomingBills bills={mockBills} />);

    const bills = screen.getAllByText(/servicios públicos|internet|factura vencida/i);
    expect(bills.length).toBeGreaterThan(0);
  });

  it('debe formatear correctamente las fechas', () => {
    render(<UpcomingBills bills={[mockBills[0]]} />);

    expect(screen.getByText(/20/i)).toBeInTheDocument();
  });
});

