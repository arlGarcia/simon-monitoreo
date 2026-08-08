import { openDB } from 'idb';

const DB_NAME = 'monitoreo_cache';
const DB_VERSION = 1;

function openDatabase() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('vehicles')) {
        db.createObjectStore('vehicles', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('readings')) {
        db.createObjectStore('readings', { keyPath: 'vehicleId' });
      }
      if (!db.objectStoreNames.contains('alerts')) {
        db.createObjectStore('alerts', { keyPath: 'id' });
      }
    },
  });
}

export async function cacheVehicles(vehicles) {
  if (!Array.isArray(vehicles)) return;
  const db = await openDatabase();
  const tx = db.transaction('vehicles', 'readwrite');
  // Clear first to avoid accumulating stale vehicles from previous DB resets
  await tx.store.clear();
  await Promise.all(
    vehicles.map((v) => {
      const id = v.id || v.ID;
      if (!id) return Promise.resolve();
      return tx.store.put({ id, ...v });
    })
  );
  await tx.done;
}

export async function getCachedVehicles() {
  const db = await openDatabase();
  return db.getAll('vehicles');
}

export async function cacheLatestReading(vehicleId, reading) {
  const db = await openDatabase();
  const vId = vehicleId || reading?.vehicle_id || reading?.VehicleID;
  if (!vId) return;
  // Normalize coordinates to avoid NaN on read-back
  const normalized = {
    ...reading,
    vehicleId: vId,
    latitude:  reading?.latitude  ?? reading?.Latitude  ?? 0,
    longitude: reading?.longitude ?? reading?.Longitude ?? 0,
    speed:       reading?.speed       ?? reading?.Speed       ?? 0,
    fuel_level:  reading?.fuel_level  ?? reading?.FuelLevel   ?? 0,
    temperature: reading?.temperature ?? reading?.Temperature ?? 0,
  };
  await db.put('readings', normalized);
}

export async function getCachedReading(vehicleId) {
  const db = await openDatabase();
  return db.get('readings', vehicleId);
}

export async function cacheAlert(alert) {
  if (!alert) return;
  const db = await openDatabase();
  const alertId = alert.id || alert.ID || alert.vehicle_id || alert.VehicleID || `alert-${Date.now()}-${Math.random()}`;
  await db.put('alerts', { id: alertId, ...alert });
}

export async function getCachedAlerts() {
  const db = await openDatabase();
  return db.getAll('alerts');
}
