'use client';

import styles from './VehicleList.module.css';

function FuelBadge({ level }) {
  const color = level < 20 ? 'critical' : level < 40 ? 'low' : 'ok';
  return <span className={`${styles.fuelBadge} ${styles[`fuelBadge--${color}`]}`}>{level?.toFixed(0)}%</span>;
}

function VehicleCard({ vehicle, reading, isSelected, onClick }) {
  return (
    <button
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <span className={styles.vehicleName}>{vehicle.name}</span>
        {reading && <FuelBadge level={reading.fuel_level} />}
      </div>
      <div className={styles.cardMeta}>
        <span className={styles.deviceId}>{vehicle.display_id}</span>
        <span className={styles.plate}>{vehicle.license_plate}</span>
      </div>
      {reading && (
        <div className={styles.cardStats}>
          <span>⚡ {reading.speed?.toFixed(0)} km/h</span>
          <span>🌡 {reading.temperature?.toFixed(1)}°C</span>
        </div>
      )}
      {!reading && <span className={styles.noData}>Awaiting data…</span>}
    </button>
  );
}

export function VehicleList({ vehicles, latestReadings, selectedVehicleId, onSelect }) {
  if (!vehicles.length) {
    return <div className={styles.empty}>No vehicles registered</div>;
  }

  return (
    <div className={styles.list}>
      {vehicles.map((v) => (
        <VehicleCard
          key={v.id}
          vehicle={v}
          reading={latestReadings[v.id]}
          isSelected={selectedVehicleId === v.id}
          onClick={() => onSelect(v.id)}
        />
      ))}
    </div>
  );
}
