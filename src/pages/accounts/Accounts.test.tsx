import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Accounts from './Accounts';
import * as accountService from '../../services/accountService';
import { Account } from '../../services/accountService';

const mockOnBack = vi.fn();

const mockAccounts = [
  {
    id: 1,
    name: 'Cuenta Ahorros',
    account_type: 'asset' as const,
    category: 'savings_account' as const,
    currency: 'COP' as const,
    current_balance: 500000,
    is_active: true,
  },
  {
    id: 2,
    name: 'Tarjeta Visa',
    account_type: 'liability' as const,
    category: 'credit_card' as const,
    currency: 'COP' as const,
    current_balance: -200000,
    credit_limit: 5000000,
    is_active: true,
  },
];

vi.mock('../../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
    getAccountById: vi.fn(),
    deleteAccount: vi.fn(),
    validateDeletion: vi.fn(),
    toggleActive: vi.fn(),
  },
}));

vi.mock('../../components/NewAccountModal', () => ({
  default: ({ onClose, account }: { onClose: () => void; account?: Account | null }) => (
    <div data-testid="new-account-modal">
      <button onClick={onClose}>Cerrar</button>
      {account && <div data-testid="editing-account">Editando cuenta</div>}
    </div>
  ),
}));

vi.mock('../cards/CardDetail', () => ({
  default: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="card-detail">
      <button onClick={onBack}>Volver</button>
    </div>
  ),
}));

describe('Accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(accountService.accountService.getAllAccounts).mockResolvedValue(mockAccounts);
    vi.mocked(accountService.accountService.validateDeletion).mockResolvedValue({
      can_delete: true,
      has_movements: false,
    });
    vi.mocked(accountService.accountService.deleteAccount).mockResolvedValue();
    vi.mocked(accountService.accountService.toggleActive).mockResolvedValue(mockAccounts[0]);
    vi.mocked(accountService.accountService.getAccountById).mockResolvedValue(mockAccounts[0]);
  });

  it('debe renderizar el componente de cuentas', async () => {
    render(<Accounts onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/cuentas y métodos de pago/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el botón de volver', async () => {
    await act(async () => {
      render(<Accounts onBack={mockOnBack} />);
    });
    
    await waitFor(() => {
      const backButton = screen.getByText(/volver al dashboard/i);
      expect(backButton).toBeInTheDocument();
    });
  });

  it('debe llamar a onBack cuando se hace clic en volver', async () => {
    const user = userEvent.setup();
    render(<Accounts onBack={mockOnBack} />);
    
    const backButton = screen.getByText(/volver al dashboard/i);
    await user.click(backButton);
    
    expect(mockOnBack).toHaveBeenCalled();
  });

  it('debe mostrar el botón de nueva cuenta', async () => {
    await act(async () => {
      render(<Accounts onBack={mockOnBack} />);
    });
    
    await waitFor(() => {
      const newAccountButton = screen.getByText(/nueva cuenta/i);
      expect(newAccountButton).toBeInTheDocument();
    });
  });

  it('debe cargar y mostrar las cuentas', async () => {
    render(<Accounts onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cuenta Ahorros')).toBeInTheDocument();
      expect(screen.getByText('Tarjeta Visa')).toBeInTheDocument();
    });
  });

  it('debe mostrar el total de cuentas', async () => {
    render(<Accounts onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/total de cuentas/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el balance total', async () => {
    render(<Accounts onBack={mockOnBack} />);
    
    await waitFor(() => {
      const balanceElements = screen.queryAllByText(/balance/i);
      const disponibleElements = screen.queryAllByText(/disponible/i);
      expect(balanceElements.length > 0 || disponibleElements.length > 0).toBe(true);
    });
  });

  it('debe mostrar mensaje cuando no hay cuentas', async () => {
    vi.mocked(accountService.accountService.getAllAccounts).mockResolvedValue([]);
    
    render(<Accounts onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText(/no hay cuentas configuradas aún/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar estado de carga inicialmente', () => {
    vi.mocked(accountService.accountService.getAllAccounts).mockImplementation(
      () => new Promise(() => {})
    );
    
    render(<Accounts onBack={mockOnBack} />);
    
    expect(screen.getByText(/cargando cuentas/i)).toBeInTheDocument();
  });

  it('debe abrir el modal al hacer clic en nueva cuenta', async () => {
    const user = userEvent.setup();
    render(<Accounts onBack={mockOnBack} />);
    
    await waitFor(() => {
      const newAccountButton = screen.getByText(/nueva cuenta/i);
      expect(newAccountButton).toBeInTheDocument();
    });
    
    const newAccountButton = screen.getByText(/nueva cuenta/i);
    await user.click(newAccountButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('new-account-modal')).toBeInTheDocument();
    });
  });

  it('debe mostrar cuentas activas e inactivas', async () => {
    const accountsWithInactive = [
      ...mockAccounts,
      {
        id: 3,
        name: 'Cuenta Inactiva',
        account_type: 'asset' as const,
        category: 'bank_account' as const,
        currency: 'COP' as const,
        current_balance: 100000,
        is_active: false,
      },
    ];
    
    vi.mocked(accountService.accountService.getAllAccounts).mockResolvedValue(accountsWithInactive);
    
    render(<Accounts onBack={mockOnBack} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cuenta Inactiva')).toBeInTheDocument();
    });
  });
});

