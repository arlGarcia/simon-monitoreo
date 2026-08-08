import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = useCallback(async (username, password) => {
    setLoading(true);
    setError('');
    try {
      const { token, role } = await api.login(username, password);
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);
      setUser({ token, role });
      return true;
    } catch (err) {
      setError(err.message || 'Authentication failed');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['token', 'role']);
    setUser(null);
  }, []);

  const restoreSession = useCallback(async () => {
    const token = await AsyncStorage.getItem('token');
    const role = await AsyncStorage.getItem('role');
    if (token && role) {
      setUser({ token, role });
      return true;
    }
    return false;
  }, []);

  return {
    user,
    loading,
    error,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    restoreSession,
  };
}
