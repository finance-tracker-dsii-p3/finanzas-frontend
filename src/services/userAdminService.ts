const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000');

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  identification: string;
  phone?: string;
  role: string;
  role_display: string;
  is_verified: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  created_at: string;
}

export interface AdminUserDetail extends AdminUser {
  first_name: string;
  last_name: string;
}

export interface EditUserData {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  identification?: string;
  is_active?: boolean;
  is_verified?: boolean;
}

export interface EditUserResponse {
  message: string;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    identification: string;
    role: string;
    is_verified: boolean;
    is_active: boolean;
  };
  audit_log?: Array<{
    field: string;
    old_value: string | null;
    new_value: string | null;
    changed_by: string;
    changed_at: string;
  }>;
}

export interface UserSearchParams {
  search?: string;
  role?: 'admin' | 'user';
  is_verified?: boolean;
  is_active?: boolean;
  order_by?: string;
  page?: number;
  page_size?: number;
}

export interface UserSearchResponse {
  users: AdminUser[];
  pagination: {
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  filters_applied: {
    role?: string;
    is_verified?: string;
    is_active?: string;
    search?: string;
    order_by?: string;
  };
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

import { parseApiError } from '../utils/apiErrorHandler';

export const userAdminService = {
  
  async listUsers(params?: { role?: string; is_verified?: string }): Promise<AdminUser[]> {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.is_verified !== undefined) queryParams.append('is_verified', params.is_verified);

    const url = `${API_BASE_URL}/api/auth/admin/users/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Error en la operación de administración de usuarios');
    }

    return response.json();
  },

  
  async getUserDetail(userId: number): Promise<AdminUserDetail> {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/users/${userId}/detail/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Error en la operación de administración de usuarios');
    }

    const data = await response.json();
    return data.user;
  },

  
  async editUser(userId: number, data: EditUserData): Promise<EditUserResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/admin/users/${userId}/edit/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Error en la operación de administración de usuarios');
    }

    return response.json();
  },

  
  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.search) queryParams.append('search', params.search);
    if (params.role) queryParams.append('role', params.role);
    if (params.is_verified !== undefined) queryParams.append('is_verified', params.is_verified.toString());
    if (params.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());
    if (params.order_by) queryParams.append('order_by', params.order_by);
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.page_size) queryParams.append('page_size', params.page_size.toString());

    const url = `${API_BASE_URL}/api/auth/admin/users/search/?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw await parseApiError(response, 'Error en la operación de administración de usuarios');
    }

    return response.json();
  },
};

