const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  identification: string;
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
    [key: string]: any;
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
      throw new Error(error.message || error.detail || 'Error al registrar usuario');
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
      const error = await response.json().catch(() => ({ message: 'Error al iniciar sesión' }));
      throw new Error(error.message || error.detail || 'Credenciales inválidas');
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
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
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
      throw new Error(error.message || error.detail || 'Error al restablecer contraseña');
    }

    return response.json();
  },

  getToken(): string | null {
    return localStorage.getItem('token');
  },

  getUser(): any | null {
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
};

