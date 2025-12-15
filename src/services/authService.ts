const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  identification: string;
  phone?: string;
  role?: 'user' | 'admin';
}

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    [key: string]: unknown;
  };
}

export interface RegisterResponse {
  message: string;
  user: {
    id: number;
    username: string;
    email: string;
    role: string;
    is_verified: boolean;
  };
}

export interface ResetPasswordRequestData {
  email: string;
}

export interface ResetPasswordRequestResponse {
  message: string;
  exists: boolean;
  reset_url?: string;
  note?: string;
}

export interface ResetPasswordConfirmData {
  token: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ResetPasswordConfirmResponse {
  message: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user?: {
    id: number;
    username: string;
    email: string;
    full_name: string;
  };
}

export interface ProfileData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone?: string;
  identification: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: ProfileData;
}

export interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface DeleteAccountResponse {
  message: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

export const authService = {
  async register(data: RegisterData): Promise<RegisterResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al registrar usuario' }));
      
      const errorMessages: string[] = [];
      
      const fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'identification', 'phone'];
      
      for (const field of fields) {
        if (error[field]) {
          const fieldError = Array.isArray(error[field]) ? error[field][0] : error[field];
          const fieldLabel = {
            username: 'Nombre de usuario',
            email: 'Email',
            password: 'Contraseña',
            password_confirm: 'Confirmación de contraseña',
            first_name: 'Nombre',
            last_name: 'Apellido',
            identification: 'Identificación',
            phone: 'Teléfono',
          }[field] || field;
          errorMessages.push(`${fieldLabel}: ${fieldError}`);
        }
      }
      
      if (error.message && !errorMessages.includes(error.message)) {
        errorMessages.push(error.message);
      }
      if (error.detail && !errorMessages.includes(error.detail)) {
        errorMessages.push(error.detail);
      }
      if (error.non_field_errors) {
        const nonFieldErrors = Array.isArray(error.non_field_errors) ? error.non_field_errors : [error.non_field_errors];
        nonFieldErrors.forEach((err: string) => {
          if (!errorMessages.includes(err)) {
            errorMessages.push(err);
          }
        });
      }
      
      if (errorMessages.length === 0) {
        errorMessages.push('Error al registrar usuario');
      }
      
      throw new Error(errorMessages.join('. '));
    }

    return response.json();
  },

  async login(data: LoginData): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.username,
        password: data.password
      }),
    });

    if (!response.ok) {
      let error;
      try {
        error = await response.json();
      } catch {
        // Si no se puede parsear el JSON, crear un error genérico
        throw new Error('Error al conectar con el servidor. Verifica que el backend esté ejecutándose.');
      }
      
      // Priorizar non_field_errors (errores generales)
      if (error.non_field_errors) {
        const errorMsg = Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : error.non_field_errors;
        throw new Error(errorMsg);
      }
      
      // Errores de campos específicos
      if (error.username) {
        const errorMsg = Array.isArray(error.username) ? error.username[0] : error.username;
        throw new Error(errorMsg);
      }
      if (error.password) {
        const errorMsg = Array.isArray(error.password) ? error.password[0] : error.password;
        throw new Error(errorMsg);
      }
      
      // Mensajes de error genéricos
      if (error.detail) {
        throw new Error(error.detail);
      }
      if (error.message) {
        throw new Error(error.message);
      }
      
      // Error por defecto
      throw new Error('Credenciales inválidas. Verifica tu usuario y contraseña.');
    }

    const result = await response.json();
    
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
  },

  async logout(): Promise<void> {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });
      } catch {
        void 0;
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async requestPasswordReset(data: ResetPasswordRequestData): Promise<ResetPasswordRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/password/reset-request/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al solicitar restablecimiento' }));
      throw new Error(error.message || error.detail || 'Error al solicitar restablecimiento');
    }

    return response.json();
  },

  async validateResetToken(token: string): Promise<ValidateTokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/password/reset-confirm/?token=${encodeURIComponent(token)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  },

  async confirmPasswordReset(data: ResetPasswordConfirmData): Promise<ResetPasswordConfirmResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/password/reset-confirm/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al restablecer contraseña' }));
      
      if (error.token) {
        throw new Error(Array.isArray(error.token) ? error.token[0] : error.token);
      }
      if (error.new_password) {
        throw new Error(Array.isArray(error.new_password) ? error.new_password[0] : error.new_password);
      }
      if (error.new_password_confirm) {
        throw new Error(Array.isArray(error.new_password_confirm) ? error.new_password_confirm[0] : error.new_password_confirm);
      }
      if (error.non_field_errors) {
        throw new Error(Array.isArray(error.non_field_errors) ? error.non_field_errors[0] : error.non_field_errors);
      }
      
      throw new Error(error.message || error.detail || 'Error al restablecer contraseña');
    }

    return response.json();
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): LoginResponse['user'] | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  async getProfile(): Promise<ProfileData> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al obtener perfil' }));
      throw new Error(error.message || error.detail || 'Error al obtener perfil');
    }

    return response.json();
  },

  async updateProfile(data: UpdateProfileData): Promise<UpdateProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/update/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al actualizar perfil' }));
      throw new Error(error.message || error.detail || 'Error al actualizar perfil');
    }

    const result = await response.json();
    
    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    return result;
  },

  async changePassword(data: ChangePasswordData): Promise<ChangePasswordResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/change-password/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Error al cambiar contraseña' }));
      
      if (error.old_password) {
        throw new Error(error.old_password[0] || 'La contraseña actual es incorrecta');
      }
      if (error.new_password_confirm) {
        throw new Error(error.new_password_confirm[0] || 'Las nuevas contraseñas no coinciden');
      }
      if (error.new_password) {
        throw new Error(error.new_password[0] || 'Error con la nueva contraseña');
      }
      
      throw new Error(error.message || error.detail || 'Error al cambiar contraseña');
    }

    return response.json();
  },

  async deleteAccount(password: string): Promise<DeleteAccountResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/profile/delete/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'No se pudo eliminar la cuenta' }));

      if (error.password) {
        const errorMsg = Array.isArray(error.password) ? error.password[0] : error.password;
        throw new Error(errorMsg || 'Contraseña incorrecta');
      }
      if (error.detail) {
        throw new Error(error.detail);
      }

      throw new Error(error.message || 'No se pudo eliminar la cuenta');
    }

    return response.json();
  },
};

