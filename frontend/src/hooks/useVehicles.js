'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { cacheVehicles, getCachedVehicles, cacheLatestReading } from '@/lib/offline';

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchVehicles = useCallback(async () => {
    try {
      const data = await api.listVehicles();
      const list = data || [];
      setVehicles(list);
      setOffline(false);
      await cacheVehicles(list);
    } catch {
      setOffline(true);
      const cached = await getCachedVehicles();
      setVehicles(cached || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const updateReadingForVehicle = useCallback((reading) => {
    setLatestReadings((prev) => ({ ...prev, [reading.vehicle_id]: reading }));
    cacheLatestReading(reading.vehicle_id, reading);
  }, []);

  return { vehicles, latestReadings, updateReadingForVehicle, loading, offline, refresh: fetchVehicles };
}
