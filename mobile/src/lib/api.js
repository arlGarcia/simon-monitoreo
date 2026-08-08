const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080';

async function request(path, options = {}) {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  const token = await AsyncStorage.getItem('token');

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
  login: (username, password) =>
    request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  listVehicles: () => request('/api/v1/vehicles'),

  getLatestReading: (vehicleId) =>
    request(`/api/v1/vehicles/${vehicleId}/sensor/latest`),

  getHistoricalReadings: (vehicleId, limit = 30) =>
    request(`/api/v1/vehicles/${vehicleId}/readings?limit=${limit}`),

  getAlerts: (vehicleId) => request(`/api/v1/vehicles/${vehicleId}/alerts`),
};
