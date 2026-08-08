'use client';

import { useVehicleMap } from '@/hooks/useVehicleMap';
import styles from './VehicleMap.module.css';

export function VehicleMap({ vehicles, latestReadings, selectedVehicleId }) {
  const { containerRef } = useVehicleMap({ vehicles, latestReadings, selectedVehicleId });

  return <div ref={containerRef} className={styles.mapContainer} />;
}
