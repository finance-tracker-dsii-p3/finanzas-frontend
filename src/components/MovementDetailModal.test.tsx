import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import MovementDetailModal from './MovementDetailModal';

const mockOnClose = vi.fn();
const mockOnEdit = vi.fn();
const mockOnDelete = vi.fn();

const mockMovement = {
  id: 1,
  date: '2025-01-15',
  note: 'Almuerzo con amigos',
  tag: '#almuerzo',
  origin_account: 1,
  origin_account_name: 'Cuenta Ahorros',
  destination_account: null,
  destination_account_name: undefined,
  type: 2 as const,
  category: 1,
  category_name: 'Comida',
  category_color: '#FF5733',
  category_icon: '🍔',
  base_amount: 100000,
  tax_percentage: 19,
  taxed_amount: 19000,
  gmf_amount: 476,
  total_amount: 119476,
};

const mockTransferMovement = {
  id: 2,
  date: '2025-01-15',
  note: 'Transferencia',
  tag: null,
  origin_account: 1,
  origin_account_name: 'Cuenta Origen',
  destination_account: 2,
  destination_account_name: 'Cuenta Destino',
  type: 3 as const,
  category: null,
  base_amount: 50000,
  tax_percentage: null,
  total_amount: 50000,
};

const mockCreditCardPayment = {
  id: 3,
  date: '2025-01-15',
  note: 'Pago tarjeta',
  tag: null,
  origin_account: 1,
  origin_account_name: 'Cuenta Ahorros',
  destination_account: 3,
  destination_account_name: 'Tarjeta Crédito',
  type: 3 as const,
  category: null,
  base_amount: 450000,
  tax_percentage: null,
  total_amount: 450000,
  capital_amount: 400000,
  interest_amount: 50000,
};

describe('MovementDetailModal', () => {
  it('debe renderizar el modal con los datos del movimiento', () => {
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
      />
    );
    
    expect(screen.getByText(/detalle del movimiento/i)).toBeInTheDocument();
    expect(screen.getByText('Almuerzo con amigos')).toBeInTheDocument();
    expect(screen.getByText('#almuerzo')).toBeInTheDocument();
  });

  it('no debe renderizar nada si movement es null', () => {
    const { container } = render(
      <MovementDetailModal 
        movement={null} 
        onClose={mockOnClose} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('debe mostrar la información básica del movimiento', () => {
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Cuenta Ahorros')).toBeInTheDocument();
    expect(screen.getByText(/comida/i)).toBeInTheDocument();
  });

  it('debe mostrar la cuenta destino para transferencias', () => {
    render(
      <MovementDetailModal 
        movement={mockTransferMovement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText('Cuenta Origen')).toBeInTheDocument();
    expect(screen.getByText('Cuenta Destino')).toBeInTheDocument();
  });

  it('debe mostrar el desglose fiscal cuando hay IVA', () => {
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText(/desglose fiscal/i)).toBeInTheDocument();
    expect(screen.getByText(/base calculada/i)).toBeInTheDocument();
    expect(screen.getByText(/iva/i)).toBeInTheDocument();
  });

  it('debe mostrar el GMF cuando está presente', () => {
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText(/gmf/i)).toBeInTheDocument();
  });

  it('debe mostrar el desglose de capital e intereses para pagos a tarjetas de crédito', () => {
    render(
      <MovementDetailModal 
        movement={mockCreditCardPayment} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText(/desglose de pago a tarjeta de crédito/i)).toBeInTheDocument();
    expect(screen.getByText(/capital pagado/i)).toBeInTheDocument();
    expect(screen.getByText(/intereses pagados/i)).toBeInTheDocument();
  });

  it('debe cerrar el modal al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    const backdrop = document.querySelector('.fixed');
    if (backdrop) {
      await user.click(backdrop as HTMLElement);
      expect(mockOnClose).toHaveBeenCalled();
    }
  });

  it('debe cerrar el modal al hacer clic en el botón de cerrar', async () => {
    const user = userEvent.setup();
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    const closeButton = screen.queryByRole('button', { name: /cerrar/i }) ||
                       document.querySelector('button[aria-label*="cerrar" i]') ||
                       document.querySelector('button:has(svg)');
    expect(closeButton).toBeTruthy();
    if (closeButton) {
      await user.click(closeButton as HTMLElement);
    }
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('debe llamar onEdit cuando se hace clic en editar', async () => {
    const user = userEvent.setup();
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
        onEdit={mockOnEdit} 
      />
    );
    
    const editButton = screen.getByRole('button', { name: /editar/i });
    await user.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('debe llamar onDelete cuando se hace clic en eliminar', async () => {
    const user = userEvent.setup();
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
        onDelete={mockOnDelete} 
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /eliminar/i });
    await user.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalled();
  });

  it('no debe mostrar botones de acción si no se proporcionan callbacks', () => {
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.queryByRole('button', { name: /editar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /eliminar/i })).not.toBeInTheDocument();
  });

  it('debe formatear correctamente las fechas', () => {
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    const dateText = screen.getByText(/2025/i);
    expect(dateText).toBeInTheDocument();
  });

  it('debe formatear correctamente los montos en pesos colombianos', () => {
    render(
      <MovementDetailModal 
        movement={mockMovement} 
        onClose={mockOnClose} 
      />
    );
    
    expect(screen.getByText(/\$.*100.*000/i)).toBeInTheDocument();
  });
});

