'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

export function useHistoricalReadings(vehicleId) {
  const [readings, setReadings] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReadings = useCallback(async () => {
    if (!vehicleId) {
      setReadings([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.getHistoricalReadings(vehicleId, 60);
      const normalized = (data || []).map((r) => ({
        ...r,
        time: new Date(r.recorded_at || Date.now()).toLocaleTimeString(),
      }));
      setReadings(normalized.reverse());
    } catch {
      setReadings([]);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  const addReading = useCallback(
    (newReading) => {
      const vId = newReading?.vehicle_id || newReading?.VehicleID;
      if (!vehicleId || vId !== vehicleId) return;

      setReadings((prev) => [
        ...prev,
        {
          ...newReading,
          time: new Date(newReading.recorded_at || Date.now()).toLocaleTimeString(),
        },
      ]);
    },
    [vehicleId]
  );

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  return { readings, loading, addReading, refreshReadings: fetchReadings };
}
