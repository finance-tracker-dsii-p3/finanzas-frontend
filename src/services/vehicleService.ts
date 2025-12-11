const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');

export interface Vehicle {
  id: number;
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  active_soat?: {
    id: number;
    expiry_date: string;
    status: string;
    days_until_expiry: number;
    is_paid: boolean;
  } | null;
  soats_count?: number;
}

export interface CreateVehicleData {
  plate: string;
  brand?: string;
  model?: string;
  year?: number;
}

export interface UpdateVehicleData extends Partial<CreateVehicleData> {
  is_active?: boolean;
}

export interface SOAT {
  id: number;
  vehicle: number;
  vehicle_plate: string;
  vehicle_info: {
    id: number;
    plate: string;
    brand?: string;
    model?: string;
    year?: number;
  };
  issue_date: string;
  expiry_date: string;
  alert_days_before: number;
  cost: number;
  cost_formatted: string;
  status: 'vigente' | 'por_vencer' | 'vencido' | 'pendiente_pago' | 'atrasado';
  payment_transaction?: number;
  payment_info?: {
    id: number;
    date: string;
    amount: number;
    account: string;
    category?: string;
  } | null;
  insurance_company?: string;
  policy_number?: string;
  notes?: string;
  days_until_expiry: number;
  is_expired: boolean;
  is_near_expiry: boolean;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSOATData {
  vehicle: number;
  issue_date: string;
  expiry_date: string;
  alert_days_before?: number;
  cost: number;
  insurance_company?: string;
  policy_number?: string;
  notes?: string;
}

export interface UpdateSOATData extends Partial<CreateSOATData> {
  alert_days_before?: number;
}

export interface SOATPaymentData {
  account_id: number;
  payment_date: string;
  notes?: string;
}

export interface SOATPaymentResponse {
  message: string;
  soat: SOAT;
  transaction_id: number;
}

export interface SOATAlert {
  id: number;
  soat: number;
  soat_id: number;
  vehicle_plate: string;
  soat_expiry: string;
  alert_type: 'proxima_vencer' | 'vencida' | 'pendiente_pago' | 'atrasada';
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PaymentHistory {
  vehicle: string;
  payments: Array<{
    id: number;
    date: string;
    amount: number;
    amount_formatted: string;
    account: string;
    category?: string;
    description: string;
  }>;
  total_paid: number;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Token ${token}` })
  };
};

import { parseBackendError, handleFetchError } from '../utils/errorHandler';

const parseError = async (response: Response): Promise<string> => {
  try {
    const error = await parseBackendError(response, 'Error en la operación de vehículos');
    return error.message;
  } catch (err) {
    return err instanceof Error ? err.message : `Error ${response.status}: ${response.statusText}`;
  }
};

export const vehicleService = {
  /**
   * Listar vehículos del usuario
   */
  async listVehicles(): Promise<Vehicle[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vehicles/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const error = await parseError(response);
        throw new Error(error);
      }

      const data = await response.json();
      // Manejar paginación si existe
      return Array.isArray(data) ? data : (data.results || []);
    } catch (error) {
      handleFetchError(error);
      throw error;
    }
  },

  /**
   * Obtener detalle de un vehículo
   */
  async getVehicle(vehicleId: number): Promise<Vehicle> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Crear vehículo
   */
  async createVehicle(data: CreateVehicleData): Promise<Vehicle> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Actualizar vehículo
   */
  async updateVehicle(vehicleId: number, data: UpdateVehicleData): Promise<Vehicle> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Eliminar vehículo
   */
  async deleteVehicle(vehicleId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }
  },

  /**
   * Listar SOATs de un vehículo
   */
  async getVehicleSOATs(vehicleId: number): Promise<SOAT[]> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/soats/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Obtener historial de pagos de un vehículo
   */
  async getPaymentHistory(vehicleId: number): Promise<PaymentHistory> {
    const response = await fetch(`${API_BASE_URL}/api/vehicles/${vehicleId}/payment_history/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },
};

export const soatService = {
  /**
   * Listar SOATs del usuario
   */
  async listSOATs(filters?: {
    status?: string;
    vehicle?: number;
    is_paid?: boolean;
  }): Promise<SOAT[]> {
    const queryParams = new URLSearchParams();
    if (filters?.status) queryParams.append('status', filters.status);
    if (filters?.vehicle) queryParams.append('vehicle', filters.vehicle.toString());
    if (filters?.is_paid !== undefined) queryParams.append('is_paid', filters.is_paid.toString());

    const url = `${API_BASE_URL}/api/soats/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  /**
   * Obtener detalle de un SOAT
   */
  async getSOAT(soatId: number): Promise<SOAT> {
    const response = await fetch(`${API_BASE_URL}/api/soats/${soatId}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Crear SOAT
   */
  async createSOAT(data: CreateSOATData): Promise<SOAT> {
    const response = await fetch(`${API_BASE_URL}/api/soats/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Actualizar SOAT
   */
  async updateSOAT(soatId: number, data: UpdateSOATData): Promise<SOAT> {
    const response = await fetch(`${API_BASE_URL}/api/soats/${soatId}/`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Eliminar SOAT
   */
  async deleteSOAT(soatId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/soats/${soatId}/`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }
  },

  /**
   * Registrar pago de SOAT
   */
  async registerPayment(soatId: number, data: SOATPaymentData): Promise<SOATPaymentResponse> {
    const response = await fetch(`${API_BASE_URL}/api/soats/${soatId}/register_payment/`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Actualizar estado del SOAT
   */
  async updateStatus(soatId: number): Promise<{ message: string; soat: SOAT }> {
    const response = await fetch(`${API_BASE_URL}/api/soats/${soatId}/update_status/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Listar SOATs próximos a vencer
   */
  async getExpiringSoon(days: number = 30): Promise<{ count: number; days_range: number; soats: SOAT[] }> {
    const response = await fetch(`${API_BASE_URL}/api/soats/expiring_soon/?days=${days}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Listar SOATs vencidos
   */
  async getExpired(): Promise<{ count: number; soats: SOAT[] }> {
    const response = await fetch(`${API_BASE_URL}/api/soats/expired/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },
};

export const soatAlertService = {
  /**
   * Listar alertas de SOAT
   */
  async listAlerts(filters?: {
    is_read?: boolean;
    alert_type?: string;
    soat?: number;
  }): Promise<SOATAlert[]> {
    const queryParams = new URLSearchParams();
    if (filters?.is_read !== undefined) queryParams.append('is_read', filters.is_read.toString());
    if (filters?.alert_type) queryParams.append('alert_type', filters.alert_type);
    if (filters?.soat) queryParams.append('soat', filters.soat.toString());

    const url = `${API_BASE_URL}/api/soat-alerts/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.results || []);
  },

  /**
   * Obtener detalle de una alerta
   */
  async getAlert(alertId: number): Promise<SOATAlert> {
    const response = await fetch(`${API_BASE_URL}/api/soat-alerts/${alertId}/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Marcar alerta como leída
   */
  async markAsRead(alertId: number): Promise<{ message: string; alert: SOATAlert }> {
    const response = await fetch(`${API_BASE_URL}/api/soat-alerts/${alertId}/mark_read/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },

  /**
   * Marcar todas las alertas como leídas
   */
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/soat-alerts/mark_all_read/`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await parseError(response);
      throw new Error(error);
    }

    return response.json();
  },
};

