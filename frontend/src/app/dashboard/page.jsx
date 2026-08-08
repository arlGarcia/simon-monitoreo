'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { useAuth } from '@/lib/auth-context';
import { useVehicles } from '@/hooks/useVehicles';
import { useAlerts } from '@/hooks/useAlerts';
import { useHistoricalReadings } from '@/hooks/useHistoricalReadings';
import { useWebSocket } from '@/hooks/useWebSocket';
import { VehicleList } from '@/components/ui/VehicleList';
import { AlertsPanel } from '@/components/ui/AlertsPanel';
import { FuelSpeedChart } from '@/components/charts/FuelSpeedChart';
import styles from './Dashboard.module.css';

const VehicleMap = dynamic(
  () => import('@/components/map/VehicleMap').then((m) => m.VehicleMap),
  { ssr: false }
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, ready, logout, isAdmin } = useAuth();
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  const { vehicles, latestReadings, updateReadingForVehicle, loading, offline } = useVehicles();
  const { alerts, addAlert } = useAlerts(selectedVehicleId);
  const { readings, addReading } = useHistoricalReadings(selectedVehicleId);

  useEffect(() => {
    if (ready && !user) router.push('/login');
  }, [ready, user, router]);

  const handleSensorReading = useCallback(
    (reading) => {
      updateReadingForVehicle(reading);
      addReading(reading);
    },
    [updateReadingForVehicle, addReading]
  );

  const handleAlert = useCallback(
    (alert) => addAlert(alert),
    [addAlert]
  );

  useWebSocket({ onSensorReading: handleSensorReading, onAlert: handleAlert });

  if (!ready || !user) return null;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandIcon}>🛰️</span>
          <div>
            <span className={styles.brandName}>SimonGO</span>
            <span className={styles.brandRole}>{isAdmin ? '🔑 Admin' : '👤 Viewer'}</span>
          </div>
        </div>

        {offline && (
          <div className={styles.offlineBanner}>
            ⚠️ Offline — cached data
          </div>
        )}

        <div className={styles.sidebarSection}>
          <h2 className={styles.sectionLabel}>Vehicles ({vehicles.length})</h2>
          {loading ? (
            <div className={styles.loadingList}>
              {[1, 2, 3].map((i) => <div key={i} className={styles.skeleton} />)}
            </div>
          ) : (
            <VehicleList
              vehicles={vehicles}
              latestReadings={latestReadings}
              selectedVehicleId={selectedVehicleId}
              onSelect={setSelectedVehicleId}
            />
          )}
        </div>

        <button className={styles.logoutButton} onClick={logout}>
          ← Sign out
        </button>
      </aside>

      <main className={styles.main}>
        <div className={styles.mapArea}>
          <VehicleMap
            vehicles={vehicles}
            latestReadings={latestReadings}
            selectedVehicleId={selectedVehicleId}
          />
        </div>

        <div className={styles.bottomRow}>
          <section className={styles.chartPanel}>
            <h3 className={styles.panelTitle}>
              {selectedVehicleId
                ? `Historical — ${vehicles.find((v) => v.id === selectedVehicleId)?.name ?? selectedVehicleId}`
                : 'Select a vehicle to see history'}
            </h3>
            <div className={styles.chartArea}>
              <FuelSpeedChart readings={readings} />
            </div>
          </section>

          {isAdmin && (
            <div className={styles.alertsArea}>
              <AlertsPanel alerts={alerts} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
