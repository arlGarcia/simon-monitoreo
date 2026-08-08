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
  const db = await openDatabase();
  const tx = db.transaction('vehicles', 'readwrite');
  await Promise.all(vehicles.map((v) => tx.store.put(v)));
  await tx.done;
}

export async function getCachedVehicles() {
  const db = await openDatabase();
  return db.getAll('vehicles');
}

export async function cacheLatestReading(vehicleId, reading) {
  const db = await openDatabase();
  await db.put('readings', { vehicleId, ...reading });
}

export async function getCachedReading(vehicleId) {
  const db = await openDatabase();
  return db.get('readings', vehicleId);
}

export async function cacheAlert(alert) {
  const db = await openDatabase();
  await db.put('alerts', alert);
}

export async function getCachedAlerts() {
  const db = await openDatabase();
  return db.getAll('alerts');
}
