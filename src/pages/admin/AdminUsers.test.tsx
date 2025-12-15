import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import AdminUsers from './AdminUsers';
import { userAdminService, AdminUser } from '../../services/userAdminService';

vi.mock('../../services/userAdminService');

const mockUsers: AdminUser[] = [
  {
    id: 1,
    username: 'user1',
    email: 'user1@test.com',
    full_name: 'Usuario Uno',
    identification: '12345678',
    phone: '1234567890',
    role: 'user',
    role_display: 'Usuario',
    is_verified: true,
    is_active: true,
    date_joined: '2025-01-01T00:00:00Z',
    last_login: '2025-01-15T10:00:00Z',
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'admin1',
    email: 'admin1@test.com',
    full_name: 'Admin Uno',
    identification: '87654321',
    phone: '0987654321',
    role: 'admin',
    role_display: 'Administrador',
    is_verified: true,
    is_active: false,
    date_joined: '2025-01-02T00:00:00Z',
    last_login: null,
    created_at: '2025-01-02T00:00:00Z',
  },
];

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(userAdminService.listUsers).mockResolvedValue(mockUsers);
    vi.mocked(userAdminService.getUserDetail).mockResolvedValue({
      ...mockUsers[0],
      first_name: 'Usuario',
      last_name: 'Uno',
    });
    vi.mocked(userAdminService.editUser).mockResolvedValue({
      message: 'Usuario actualizado exitosamente',
      user: {
        id: 1,
        username: 'user1',
        first_name: 'Usuario',
        last_name: 'Uno',
        email: 'user1@test.com',
        phone: '1234567890',
        identification: '12345678',
        role: 'user',
        is_verified: true,
        is_active: true,
      },
    });
  });

  it('debe renderizar la página de administración de usuarios', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText(/Administraci.*n de Usuarios/i)).toBeInTheDocument();
    });

    expect(screen.getByText('Gestiona usuarios registrados en el sistema')).toBeInTheDocument();
  });

  it('debe cargar y mostrar la lista de usuarios', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
      expect(screen.getByText('Admin Uno')).toBeInTheDocument();
    });

    expect(screen.getByText('user1@test.com')).toBeInTheDocument();
    expect(screen.getByText('admin1@test.com')).toBeInTheDocument();
  });

  it('debe mostrar estadísticas correctas', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    const statValues = screen.getAllByText('1');
    expect(statValues.length).toBeGreaterThan(0);
  });

  it('debe permitir buscar usuarios por texto', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(searchInput, 'admin1');

    await waitFor(() => {
      expect(screen.getByText('Admin Uno')).toBeInTheDocument();
      expect(screen.queryByText('Usuario Uno')).not.toBeInTheDocument();
    });
  });

  it('debe permitir filtrar por rol', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const filterButton = screen.getByText(/filtros/i);
    await user.click(filterButton);

    await waitFor(() => {

      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selects = screen.getAllByRole('combobox');
    const roleSelect = selects[0] as HTMLSelectElement;
    
    expect(roleSelect).toBeInTheDocument();
    await user.selectOptions(roleSelect, 'user');

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
      expect(screen.queryByText('Admin Uno')).not.toBeInTheDocument();
    });
  });

  it('debe permitir filtrar por estado activo/inactivo', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const filterButton = screen.getByText(/filtros/i);
    await user.click(filterButton);

    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      expect(selects.length).toBeGreaterThan(0);
    });

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[1] as HTMLSelectElement;
    
    expect(statusSelect).toBeInTheDocument();
    await user.selectOptions(statusSelect, 'inactive');

    await waitFor(() => {
      expect(screen.getByText('Admin Uno')).toBeInTheDocument();
      expect(screen.queryByText('Usuario Uno')).not.toBeInTheDocument();
    });
  });

  it('debe abrir el modal de edición al hacer click en editar', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/editar usuario/i);
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/editar usuario: user1/i)).toBeInTheDocument();
    });
  });

  it('debe permitir editar información del usuario en el modal', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByTitle(/editar usuario/i);
    await user.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    });

    const firstNameInput = screen.getByLabelText(/nombre/i);
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Nuevo Nombre');

    const emailInput = screen.getByLabelText(/correo electr.*nico/i);
    await user.clear(emailInput);
    await user.type(emailInput, 'nuevo@test.com');

    const saveButton = screen.getByRole('button', { name: /guardar cambios/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(userAdminService.editUser).toHaveBeenCalledWith(1, expect.objectContaining({
        first_name: 'Nuevo Nombre',
        email: 'nuevo@test.com',
      }));
    });
  });

  it('debe permitir activar/desactivar usuario', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const toggleButtons = screen.getAllByTitle(/desactivar usuario|activar usuario/i);
    await user.click(toggleButtons[0]);

    await waitFor(() => {
      expect(userAdminService.editUser).toHaveBeenCalledWith(1, {
        is_active: false,
      });
    });
  });

  it('debe mostrar mensaje cuando no hay usuarios', async () => {
    vi.mocked(userAdminService.listUsers).mockResolvedValueOnce([]);

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText(/no hay usuarios registrados/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar mensaje cuando no hay resultados con filtros', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(searchInput, 'usuario-inexistente');

    await waitFor(() => {
      expect(screen.getByText(/no se encontraron usuarios con los filtros aplicados/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error cuando falla la carga de usuarios', async () => {
    vi.mocked(userAdminService.listUsers).mockRejectedValueOnce(new Error('Error al cargar usuarios'));

    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar usuarios')).toBeInTheDocument();
    });
  });

  it('debe mostrar fecha de creación y último acceso correctamente', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const dateCells = screen.getAllByText(/ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic/i);
    expect(dateCells.length).toBeGreaterThan(0);
  });

  it('debe mostrar "Nunca" cuando no hay último acceso', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Admin Uno')).toBeInTheDocument();
    });

    expect(screen.getByText('Nunca')).toBeInTheDocument();
  });

  it('debe mostrar badges de estado correctamente', async () => {
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Activo')).toBeInTheDocument();
      expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });
  });

  it('debe mostrar información de usuarios inactivos', async () => {
    render(<AdminUsers />);

    await waitFor(() => {

      const inactiveUsers = screen.queryAllByText(/inactivo/i);
      expect(inactiveUsers.length).toBeGreaterThan(0);
    });
  });

  it('debe mostrar información de usuarios sin último acceso', async () => {
    render(<AdminUsers />);

    await waitFor(() => {

      const neverTexts = screen.queryAllByText(/nunca/i);
      expect(neverTexts.length).toBeGreaterThan(0);
    });
  });

  it('debe limpiar filtros correctamente', async () => {
    const user = userEvent.setup({ delay: null });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });

    const filterButton = screen.getByText(/filtros/i);
    await user.click(filterButton);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
      expect(searchInput).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/buscar por nombre/i);
    await user.type(searchInput, 'test');

    const clearButton = screen.getByText(/limpiar filtros/i);
    await user.click(clearButton);

    await waitFor(() => {
      expect(searchInput).toHaveValue('');
      expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
    });
  });
});

