const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';
const TOKEN_KEY = 'kk_admin_token_v1';

export function getStoredAdminToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredAdminToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearStoredAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function getAuthHeaders() {
  const token = getStoredAdminToken();
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Clear expired / invalid token
      clearStoredAdminToken();
    }
    const errorMsg = data.error || `HTTP error! Status: ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data.code;
    throw error;
  }
  return data;
}

export const api = {
  // Auth API
  auth: {
    async login(username, password) {
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await handleResponse(response);
      if (data.token) {
        setStoredAdminToken(data.token);
      }
      return data;
    },

    async getMe() {
      const response = await fetch(`${API_BASE}/admin/me`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    },

    async logout() {
      try {
        await fetch(`${API_BASE}/admin/logout`, {
          method: 'POST',
          headers: getAuthHeaders()
        });
      } catch (err) {
        console.warn('Logout notification failed, proceeding with local cleanup:', err);
      } finally {
        clearStoredAdminToken();
      }
      return { success: true };
    },

    async sendResetOtp(email, role = 'user') {
      const response = await fetch(`${API_BASE}/auth/send-reset-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      return await handleResponse(response);
    },

    async resetAdminPassword(payload) {
      // payload can be { email, otp, newPassword } or legacy args
      const body = typeof payload === 'object'
        ? payload
        : { email: arguments[0], newPassword: arguments[1] };

      const response = await fetch(`${API_BASE}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await handleResponse(response);
    },

    async resetUserPassword(payload) {
      // payload can be { email, otp, newPassword } or legacy args
      const body = typeof payload === 'object'
        ? payload
        : { email: arguments[0], newPassword: arguments[1] };

      const response = await fetch(`${API_BASE}/user/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return await handleResponse(response);
    }
  },

  // Cars / Fleet API
  cars: {
    async getAll() {
      const response = await fetch(`${API_BASE}/cars`);
      return await handleResponse(response);
    },

    async add(carData) {
      const response = await fetch(`${API_BASE}/admin/cars`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(carData)
      });
      return await handleResponse(response);
    },

    async update(id, carData) {
      const response = await fetch(`${API_BASE}/admin/cars/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(carData)
      });
      return await handleResponse(response);
    },

    async delete(id) {
      const response = await fetch(`${API_BASE}/admin/cars/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    }
  },

  // Rental Requests API
  requests: {
    async create(requestData) {
      const response = await fetch(`${API_BASE}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      return await handleResponse(response);
    },

    async getPublic(params = {}) {
      const query = new URLSearchParams(params).toString();
      const url = query ? `${API_BASE}/requests?${query}` : `${API_BASE}/requests`;
      const response = await fetch(url);
      return await handleResponse(response);
    },

    async getAllForAdmin() {
      const response = await fetch(`${API_BASE}/admin/requests`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    },

    async updateStatus(id, status, adminNotes) {
      const response = await fetch(`${API_BASE}/admin/requests/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, adminNotes })
      });
      return await handleResponse(response);
    },

    async updateNotes(id, adminNotes) {
      const response = await fetch(`${API_BASE}/admin/requests/${id}/notes`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ adminNotes })
      });
      return await handleResponse(response);
    },

    async getDashboardMetrics() {
      const response = await fetch(`${API_BASE}/admin/dashboard`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      return await handleResponse(response);
    }
  }
};
