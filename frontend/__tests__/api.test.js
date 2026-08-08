import { api } from '../src/lib/api';

// Mock get/setItem globally for testing
let store = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    clear: () => { store = {}; }
  }
});

global.fetch = jest.fn();

describe('API Wrapper Tests', () => {
  beforeEach(() => {
    store = {};
    fetch.mockClear();
  });

  it('login sends correct payload and resolves data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'mockToken', role: 'admin' })
    });

    const response = await api.login('admin', 'admin123');

    expect(response.token).toBe('mockToken');
    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
  });

  it('adds Authorization header when token is present in localStorage', async () => {
    window.localStorage.setItem('token', 'realToken');

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'vehicle-1' })
    });

    await api.getVehicle('vehicle-1');

    expect(fetch).toHaveBeenCalledWith('http://localhost:8080/api/v1/vehicles/vehicle-1', {
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer realToken'
      }
    });
  });

  it('throws exact API error message on failure', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid token' })
    });

    await expect(api.listVehicles()).rejects.toThrow('invalid token');
  });
});
