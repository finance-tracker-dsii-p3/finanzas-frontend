import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils/test-utils';
import RecentTransactions from './RecentTransactions';
import { RecentTransaction } from '../services/dashboardService';

describe('RecentTransactions', () => {
  const mockTransactions: RecentTransaction[] = [
    {
      id: 1,
      description: 'Compra en supermercado',
      amount: 50000,
      currency: 'COP',
      type_code: 2,
      date: '2025-01-15',
      account: 'Efectivo',
      category: 'Alimentación',
      category_color: '#FF5733',
      category_icon: '🍔',
      type: 'Expense',
      amount_formatted: '$50,000',
    },
    {
      id: 2,
      description: 'Salario',
      amount: 2000000,
      currency: 'COP',
      type_code: 1,
      date: '2025-01-14',
      account: 'Banco',
      category: 'Ingresos',
      category_color: '#10b981',
      category_icon: '💰',
      type: 'Income',
      amount_formatted: '$2,000,000',
    },
    {
      id: 3,
      description: 'Transferencia a ahorros',
      amount: 300000,
      currency: 'COP',
      type_code: 3,
      date: '2025-01-13',
      account: 'Banco',
      category: null,
      category_color: null,
      category_icon: null,
      type: 'Transfer',
      amount_formatted: '$300,000',
    },
  ];

  it('debe renderizar el componente', () => {
    render(<RecentTransactions transactions={mockTransactions} />);
    expect(screen.getByText(/movimientos recientes/i)).toBeInTheDocument();
  });

  it('debe mostrar las transacciones', () => {
    render(<RecentTransactions transactions={mockTransactions} />);
    expect(screen.getByText(/compra en supermercado/i)).toBeInTheDocument();
    expect(screen.getByText(/salario/i)).toBeInTheDocument();
    expect(screen.getByText(/transferencia a ahorros/i)).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando no hay transacciones', () => {
    render(<RecentTransactions transactions={[]} />);
    expect(screen.getByText(/no hay movimientos registrados/i)).toBeInTheDocument();
  });

  it('debe mostrar el tipo correcto para ingresos', () => {
    render(<RecentTransactions transactions={[mockTransactions[1]]} />);
    const ingresoElements = screen.getAllByText(/ingreso/i);
    expect(ingresoElements.length).toBeGreaterThan(0);
  });

  it('debe mostrar el tipo correcto para gastos', () => {
    render(<RecentTransactions transactions={[mockTransactions[0]]} />);
    expect(screen.getByText(/gasto/i)).toBeInTheDocument();
  });

  it('debe mostrar el tipo correcto para transferencias', () => {
    render(<RecentTransactions transactions={[mockTransactions[2]]} />);
    const transferenciaElements = screen.getAllByText(/transferencia/i);
    expect(transferenciaElements.length).toBeGreaterThan(0);
  });

  it('debe formatear correctamente las fechas', () => {
    render(<RecentTransactions transactions={mockTransactions} />);

    const dateElements = screen.getAllByText(/15|14|13/i);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('debe mostrar la información de la cuenta', () => {
    render(<RecentTransactions transactions={[mockTransactions[0]]} />);
    expect(screen.getByText(/cuenta: efectivo/i)).toBeInTheDocument();
  });

  it('debe mostrar la categoría cuando está disponible', () => {
    render(<RecentTransactions transactions={[mockTransactions[0]]} />);
    const alimentacionElements = screen.getAllByText(/alimentación/i);
    expect(alimentacionElements.length).toBeGreaterThan(0);
  });
});

