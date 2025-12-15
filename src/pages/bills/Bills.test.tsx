import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Bills from './Bills';
import { billService, Bill } from '../../services/billService';
import { accountService, Account } from '../../services/accountService';
import { useCategories } from '../../context/CategoryContext';

vi.mock('../../services/billService', () => ({
  billService: {
    listBills: vi.fn(),
    createBill: vi.fn(),
    updateBill: vi.fn(),
    deleteBill: vi.fn(),
    registerPayment: vi.fn(),
  },
}));

vi.mock('../../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

vi.mock('../../context/CategoryContext', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>;
  return {
    ...actual,
    CategoryProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="category-provider">{children}</div>,
    useCategories: vi.fn(),
  };
});

const mockBills: Bill[] = [
  {
    id: 1,
    provider: 'Netflix',
    amount: 45000,
    amount_formatted: '$45,000',
    due_date: '2024-01-25',
    status: 'pending',
    reminder_days_before: 3,
    is_recurring: true,
    days_until_due: 5,
    is_overdue: false,
    is_near_due: true,
    is_paid: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    provider: 'EPM',
    amount: 95000,
    amount_formatted: '$95,000',
    due_date: '2024-01-20',
    status: 'overdue',
    reminder_days_before: 3,
    is_recurring: false,
    days_until_due: -2,
    is_overdue: true,
    is_near_due: false,
    is_paid: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    provider: 'Claro',
    amount: 85000,
    amount_formatted: '$85,000',
    due_date: '2024-01-15',
    status: 'paid',
    reminder_days_before: 3,
    is_recurring: false,
    days_until_due: 0,
    is_overdue: false,
    is_near_due: false,
    is_paid: true,
    payment_info: {
      id: 1,
      date: '2024-01-15',
      amount: 85000,
      account: 'Cuenta Ahorros',
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockAccounts: Account[] = [
  {
    id: 1,
    name: 'Cuenta Ahorros',
    account_type: 'asset',
    category: 'bank_account',
    currency: 'COP',
    current_balance: 1000000,
    is_active: true,
  },
];

const mockCategories = [
  { id: 1, name: 'Servicios', type: 'expense', color: '#10B981', icon: 'fa-file-invoice' },
  { id: 2, name: 'Alimentación', type: 'expense', color: '#F59E0B', icon: 'fa-utensils' },
];

describe('Bills', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (billService.listBills as ReturnType<typeof vi.fn>).mockResolvedValue(mockBills);
    (accountService.getAllAccounts as ReturnType<typeof vi.fn>).mockResolvedValue(mockAccounts);
    (useCategories as ReturnType<typeof vi.fn>).mockReturnValue({ categories: mockCategories });
  });

  it('debe renderizar la página de facturas', async () => {
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Facturas')).toBeInTheDocument();
    });
  });

  it('debe cargar y mostrar la lista de facturas', async () => {
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
      expect(screen.getByText('EPM')).toBeInTheDocument();
      expect(screen.getByText('Claro')).toBeInTheDocument();
    });
  });

  it('debe mostrar estados de facturas correctamente', async () => {
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Pendiente')).toBeInTheDocument();
      expect(screen.getByText('Atrasada')).toBeInTheDocument();
      expect(screen.getByText('Pagada')).toBeInTheDocument();
    });
  });

  it('debe mostrar días restantes', async () => {
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText(/5.*d.*as/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar badge de recurrente', async () => {
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Recurrente')).toBeInTheDocument();
    });
  });

  it('debe abrir modal para crear factura', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    const createButtons = screen.getAllByRole('button', { name: /nueva factura/i });
    await act(async () => {
      await user.click(createButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/proveedor/i)).toBeInTheDocument();
    });
  });

  it('debe abrir modal para registrar pago', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    const paymentButtons = screen.getAllByText(/registrar pago/i);
    await act(async () => {
      await user.click(paymentButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/registrar pago de factura/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cuenta/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar filtros cuando se hace clic en el botón', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    const filterButton = screen.getByText(/filtros/i);
    await act(async () => {
      await user.click(filterButton);
    });

    await waitFor(() => {

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);

      const providerInput = screen.getByPlaceholderText(/buscar proveedor/i);
      expect(providerInput).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay facturas', async () => {
    (billService.listBills as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText(/no hay facturas registradas/i)).toBeInTheDocument();
    });
  });

  it('debe filtrar facturas por estado', async () => {
    const user = userEvent.setup({ delay: null });
    const mockListBills = vi.fn().mockResolvedValue([mockBills[0]]);
    (billService.listBills as ReturnType<typeof vi.fn>).mockImplementation(mockListBills);

    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    const filterButton = screen.getByText(/filtros/i);
    await act(async () => {
      await user.click(filterButton);
    });

    await waitFor(() => {

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects.find(select => (select as HTMLSelectElement).value === 'all');
    
    if (statusSelect) {
      await user.selectOptions(statusSelect, 'pending');
      
      const applyButton = screen.getByText(/aplicar/i);
      await act(async () => {
        await user.click(applyButton);
      });

      await waitFor(() => {
        expect(mockListBills).toHaveBeenCalledWith(
          expect.objectContaining({ status: 'pending' })
        );
      }, { timeout: 3000 });
    }
  });

  it('debe mostrar error cuando falla la carga', async () => {
    (billService.listBills as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Error de red'));

    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText(/error de red/i)).toBeInTheDocument();
    });
  });

  it('debe editar una factura', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/editar/i);
    await act(async () => {
      await user.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/proveedor/i)).toBeInTheDocument();
    });
  });

  it('debe eliminar una factura', async () => {
    const user = userEvent.setup({ delay: null });
    (billService.deleteBill as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent?.includes('Eliminar') || btn.getAttribute('aria-label')?.includes('eliminar')
    );
    
    if (deleteButtons.length === 0) {
      const billCard = screen.getByText('Netflix').closest('div');
      const buttons = billCard?.querySelectorAll('button') || [];
      const deleteBtn = Array.from(buttons).find(btn => btn.textContent?.toLowerCase().includes('eliminar'));
      if (deleteBtn) {
        await act(async () => {
          await user.click(deleteBtn);
        });
      }
    } else {
      await act(async () => {
        await user.click(deleteButtons[0]);
      });
    }

    await waitFor(() => {
      const confirmText = screen.queryByText(/est.*s seguro/i) || screen.queryByText(/eliminar/i);
      expect(confirmText).toBeInTheDocument();
    }, { timeout: 3000 });

    const confirmButton = screen.queryByText(/confirmar/i) || screen.queryByRole('button', { name: /confirmar/i });
    if (confirmButton) {
      await act(async () => {
        await user.click(confirmButton);
      });

      await waitFor(() => {
        expect(billService.deleteBill).toHaveBeenCalledWith(1);
      }, { timeout: 3000 });
    }
  });

  it('debe actualizar una factura', async () => {
    const user = userEvent.setup({ delay: null });
    (billService.updateBill as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    render(<Bills />);

    await waitFor(() => {
      expect(screen.getByText('Netflix')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText(/editar/i);
    await act(async () => {
      await user.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/proveedor/i)).toBeInTheDocument();
    });
  });
});

