import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { cacheVehicles, getCachedVehicles, cacheReading } from '../lib/offline';

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
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

  const updateReading = useCallback((reading) => {
    setLatestReadings((prev) => ({ ...prev, [reading.vehicle_id]: reading }));
    cacheReading(reading.vehicle_id, reading);
  }, []);

  return { vehicles, latestReadings, updateReading, loading, offline, fetchVehicles };
}
