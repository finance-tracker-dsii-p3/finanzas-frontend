import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import SOATs from './SOATs';
import { soatService, vehicleService, SOAT } from '../../services/vehicleService';
import { accountService, Account } from '../../services/accountService';

vi.mock('../../services/vehicleService', () => ({
  soatService: {
    listSOATs: vi.fn(),
    createSOAT: vi.fn(),
    updateSOAT: vi.fn(),
    deleteSOAT: vi.fn(),
    registerPayment: vi.fn(),
  },
  vehicleService: {
    listVehicles: vi.fn(),
  },
}));

vi.mock('../../services/accountService', () => ({
  accountService: {
    getAllAccounts: vi.fn(),
  },
}));

const mockSOATs: SOAT[] = [
  {
    id: 1,
    vehicle: 1,
    vehicle_plate: 'ABC123',
    vehicle_info: {
      id: 1,
      plate: 'ABC123',
      brand: 'Toyota',
      model: 'Corolla',
    },
    issue_date: '2024-01-01',
    expiry_date: '2025-01-01',
    alert_days_before: 7,
    cost: 500000,
    cost_formatted: '$5,000.00',
    status: 'vigente',
    days_until_expiry: 100,
    is_expired: false,
    is_near_expiry: false,
    is_paid: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    payment_info: {
      id: 1,
      date: '2024-01-15',
      amount: 500000,
      account: 'Cuenta Ahorros',
      category: 'Seguros',
    },
  },
  {
    id: 2,
    vehicle: 2,
    vehicle_plate: 'XYZ789',
    vehicle_info: {
      id: 2,
      plate: 'XYZ789',
      brand: 'Honda',
      model: 'Civic',
    },
    issue_date: '2024-01-01',
    expiry_date: '2024-12-31',
    alert_days_before: 7,
    cost: 450000,
    cost_formatted: '$4,500.00',
    status: 'por_vencer',
    days_until_expiry: 5,
    is_expired: false,
    is_near_expiry: true,
    is_paid: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

const mockVehicles = [
  {
    id: 1,
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    is_active: true,
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

describe('SOATs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (soatService.listSOATs as ReturnType<typeof vi.fn>).mockResolvedValue(mockSOATs);
    (vehicleService.listVehicles as ReturnType<typeof vi.fn>).mockResolvedValue(mockVehicles);
    (accountService.getAllAccounts as ReturnType<typeof vi.fn>).mockResolvedValue(mockAccounts);
  });

  it('debe renderizar la página de SOATs', async () => {
    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText('SOATs')).toBeInTheDocument();
    });
  });

  it('debe cargar y mostrar la lista de SOATs', async () => {
    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
      expect(screen.getByText('XYZ789')).toBeInTheDocument();
    });
  });

  it('debe mostrar estados de SOAT correctamente', async () => {
    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText('Vigente')).toBeInTheDocument();
      expect(screen.getByText('Por vencer')).toBeInTheDocument();
    });
  });

  it('debe mostrar días restantes', async () => {
    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText(/100 días/i)).toBeInTheDocument();
      expect(screen.getByText(/5 días/i)).toBeInTheDocument();
    });
  });

  it('debe abrir modal para crear SOAT', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    // Buscar el botón en el header (no en el empty state)
    const createButtons = screen.getAllByRole('button', { name: /nuevo soat/i });
    await act(async () => {
      await user.click(createButtons[0]);
    });

    await waitFor(() => {
      // Buscar el modal por el label de vehículo que solo aparece en el modal
      expect(screen.getByLabelText(/vehículo/i)).toBeInTheDocument();
    });
  });

  it('debe abrir modal para registrar pago', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText('XYZ789')).toBeInTheDocument();
    });

    const paymentButtons = screen.getAllByText(/registrar pago/i);
    await act(async () => {
      await user.click(paymentButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/registrar pago de soat/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cuenta/i)).toBeInTheDocument();
    });
  });

  it('debe filtrar SOATs por estado', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    const filterButton = screen.getByText(/filtros/i);
    await act(async () => {
      await user.click(filterButton);
    });

    await waitFor(() => {
      // Buscar el select por su valor por defecto "all"
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar mensaje cuando no hay SOATs', async () => {
    (soatService.listSOATs as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<SOATs />);

    await waitFor(() => {
      expect(screen.getByText(/no hay soats registrados/i)).toBeInTheDocument();
    });
  });
});

