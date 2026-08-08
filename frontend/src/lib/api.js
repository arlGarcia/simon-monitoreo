const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  login(username, password) {
    return request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  listVehicles() {
    return request('/api/v1/vehicles');
  },

  getVehicle(id) {
    return request(`/api/v1/vehicles/${id}`);
  },

  registerVehicle(data) {
    return request('/api/v1/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  ingestReading(vehicleId, data) {
    return request(`/api/v1/vehicles/${vehicleId}/sensor`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getLatestReading(vehicleId) {
    return request(`/api/v1/vehicles/${vehicleId}/sensor/latest`);
  },

  getHistoricalReadings(vehicleId, limit = 50) {
    return request(`/api/v1/vehicles/${vehicleId}/readings?limit=${limit}`);
  },

  getAlerts(vehicleId) {
    return request(`/api/v1/vehicles/${vehicleId}/alerts`);
  },
};
