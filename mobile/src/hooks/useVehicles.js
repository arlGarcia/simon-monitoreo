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

      const readingsMap = {};
      await Promise.all(
        list.map(async (v) => {
          const vId = v.id || v.ID;
          if (!vId) return;
          try {
            const reading = await api.getLatestReading(vId);
            if (reading) readingsMap[vId] = reading;
          } catch {}
        })
      );
      setLatestReadings((prev) => ({ ...prev, ...readingsMap }));
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
