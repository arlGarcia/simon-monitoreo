'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { cacheVehicles, getCachedVehicles, cacheLatestReading, getCachedReading } from '@/lib/offline';

export function useVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [latestReadings, setLatestReadings] = useState({});
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  const fetchVehicles = useCallback(async () => {
    try {
      const data = await api.listVehicles();
      const raw = data || [];
      // deduplicar por id
      const seen = new Set();
      const list = raw.filter((v) => {
        const id = v.id || v.ID;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setVehicles(list);
      setOffline(false);
      await cacheVehicles(list);

      // Fetch latest reading for each vehicle
      const readingsMap = {};
      await Promise.all(
        list.map(async (v) => {
          const vId = v.id || v.ID;
          if (!vId) return;
          try {
            const reading = await api.getLatestReading(vId);
            if (reading) {
              readingsMap[vId] = reading;
              cacheLatestReading(vId, reading);
            }
          } catch {
            const cached = await getCachedReading(vId);
            if (cached) readingsMap[vId] = cached;
          }
        })
      );
      setLatestReadings(readingsMap);
    } catch {
      setOffline(true);
      // Limpiar estado anterior para evitar que se sumen los datos online + caché
      setVehicles([]);
      setLatestReadings({});

      const cachedList = await getCachedVehicles();
      const raw = cachedList || [];
      // deduplicar por id
      const seen = new Set();
      const list = raw.filter((v) => {
        const id = v.id || v.ID;
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
      setVehicles(list);

      const readingsMap = {};
      await Promise.all(
        list.map(async (v) => {
          const vId = v.id || v.ID;
          if (!vId) return;
          const cached = await getCachedReading(vId);
          if (cached) readingsMap[vId] = cached;
        })
      );
      setLatestReadings(readingsMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const updateReadingForVehicle = useCallback((reading) => {
    const vId = reading?.vehicle_id || reading?.VehicleID;
    if (!vId) return;
    setLatestReadings((prev) => ({ ...prev, [vId]: reading }));
    cacheLatestReading(vId, reading);
  }, []);

  return { vehicles, latestReadings, updateReadingForVehicle, loading, offline, refresh: fetchVehicles };
}
