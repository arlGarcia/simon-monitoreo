'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { cacheAlert, getCachedAlerts } from '@/lib/offline';

export function useAlerts(vehicleId) {
  const [alerts, setAlerts] = useState([]);

  const fetchAlerts = useCallback(async () => {
    if (!vehicleId) return;
    try {
      const data = await api.getAlerts(vehicleId);
      setAlerts(data || []);
      for (const alert of data || []) {
        await cacheAlert(alert);
      }
    } catch {
      const cached = await getCachedAlerts();
      setAlerts(cached.filter((a) => a.vehicle_id === vehicleId));
    }
  }, [vehicleId]);

  const addAlert = useCallback((alert) => {
    setAlerts((prev) => [alert, ...prev]);
    cacheAlert(alert);
  }, []);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  return { alerts, addAlert };
}
