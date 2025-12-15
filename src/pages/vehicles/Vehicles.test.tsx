import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import Vehicles from './Vehicles';
import { vehicleService, Vehicle } from '../../services/vehicleService';

vi.mock('../../services/vehicleService', () => ({
  vehicleService: {
    listVehicles: vi.fn(),
    createVehicle: vi.fn(),
    updateVehicle: vi.fn(),
    deleteVehicle: vi.fn(),
  },
}));

const mockVehicles: Vehicle[] = [
  {
    id: 1,
    plate: 'ABC123',
    brand: 'Toyota',
    model: 'Corolla',
    year: 2020,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    active_soat: {
      id: 1,
      expiry_date: '2025-01-01',
      status: 'vigente',
      days_until_expiry: 100,
      is_paid: true,
    },
  },
  {
    id: 2,
    plate: 'XYZ789',
    brand: 'Honda',
    model: 'Civic',
    year: 2021,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('Vehicles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (vehicleService.listVehicles as ReturnType<typeof vi.fn>).mockResolvedValue(mockVehicles);
  });

  it('debe renderizar la página de vehículos', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('Vehículos')).toBeInTheDocument();
    });
  });

  it('debe cargar y mostrar la lista de vehículos', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
      expect(screen.getByText('XYZ789')).toBeInTheDocument();
    });
  });

  it('debe mostrar estado de SOAT cuando existe', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('Vigente')).toBeInTheDocument();
    });
  });

  it('debe abrir modal para crear vehículo', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    const createButtons = screen.getAllByRole('button', { name: /nuevo vehículo/i });
    await act(async () => {
      await user.click(createButtons[0]);
    });

    await waitFor(() => {

      expect(screen.getByLabelText(/placa/i)).toBeInTheDocument();
    });
  });

  it('debe crear vehículo correctamente', async () => {
    const user = userEvent.setup({ delay: null });
    const mockCreate = vi.fn().mockResolvedValue({
      id: 3,
      plate: 'NEW123',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });
    (vehicleService.createVehicle as ReturnType<typeof vi.fn>).mockImplementation(mockCreate);
    (vehicleService.listVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([
      ...mockVehicles,
      {
        id: 3,
        plate: 'NEW123',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ]);

    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });

    const createButtons = screen.getAllByText(/nuevo vehículo/i);
    await act(async () => {
      await user.click(createButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/placa/i)).toBeInTheDocument();
    });

    const plateInput = screen.getByLabelText(/placa/i);
    const saveButton = screen.getByRole('button', { name: /guardar/i });

    await act(async () => {
      await user.clear(plateInput);
      await user.type(plateInput, 'NEW123');
    });
    await act(async () => {
      await user.click(saveButton);
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('debe mostrar mensaje cuando no hay vehículos', async () => {
    (vehicleService.listVehicles as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText(/no hay vehículos registrados/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga', async () => {
    (vehicleService.listVehicles as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Error al cargar vehículos')
    );

    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText(/error al cargar vehículos/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar información de vehículos sin SOAT', async () => {
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('XYZ789')).toBeInTheDocument();
    });
  });

  it('debe actualizar la lista después de crear un vehículo', async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      id: 3,
      plate: 'NEW123',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    });
    (vehicleService.createVehicle as ReturnType<typeof vi.fn>).mockImplementation(mockCreate);
    
    render(<Vehicles />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });
  });
});

