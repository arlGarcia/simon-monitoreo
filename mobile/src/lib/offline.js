import AsyncStorage from '@react-native-async-storage/async-storage';

const VEHICLES_KEY = 'cache:vehicles';
const READINGS_KEY = 'cache:readings';
const ALERTS_KEY = 'cache:alerts';

export async function cacheVehicles(vehicles) {
  await AsyncStorage.setItem(VEHICLES_KEY, JSON.stringify(vehicles));
}

export async function getCachedVehicles() {
  const raw = await AsyncStorage.getItem(VEHICLES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function cacheReading(vehicleId, reading) {
  const raw = await AsyncStorage.getItem(READINGS_KEY);
  const all = raw ? JSON.parse(raw) : {};
  all[vehicleId] = reading;
  await AsyncStorage.setItem(READINGS_KEY, JSON.stringify(all));
}

export async function getCachedReadings() {
  const raw = await AsyncStorage.getItem(READINGS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function cacheAlerts(alerts) {
  await AsyncStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
}

export async function getCachedAlerts() {
  const raw = await AsyncStorage.getItem(ALERTS_KEY);
  return raw ? JSON.parse(raw) : [];
}
