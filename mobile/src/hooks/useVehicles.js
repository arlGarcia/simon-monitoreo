import { useState, useCallback } from 'react';
import { api } from '../lib/api';
import { cacheVehicles, getCachedVehicles, cacheReading, getCachedReadings } from '../lib/offline';

function deduplicateVehicles(list) {
  const map = new Map();
  for (const item of list) {
    const id = item.id || item.ID;
    if (id && !map.has(id)) {
      map.set(id, item);
    }
  }
  return Array.from(map.values());
}

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listVehicles();
      const list = deduplicateVehicles(data || []);
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
            if (reading) {
              readingsMap[vId] = reading;
              await cacheReading(vId, reading);
            }
          } catch {}
        })
      );
      setLatestReadings((prev) => ({ ...prev, ...readingsMap }));
    } catch {
      setOffline(true);
      const cachedList = await getCachedVehicles();
      const cachedReadings = await getCachedReadings();
      setVehicles(deduplicateVehicles(cachedList || []));
      setLatestReadings(cachedReadings || {});
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReading = useCallback((reading) => {
    const vId = reading.vehicle_id || reading.VehicleID;
    if (!vId) return;
    setLatestReadings((prev) => ({ ...prev, [vId]: reading }));
    cacheReading(vId, reading);
  }, []);

  return { vehicles, latestReadings, updateReading, loading, offline, fetchVehicles };
}

