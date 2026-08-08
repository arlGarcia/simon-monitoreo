import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export function VehicleCard({ vehicle, reading, isSelected, onPress }) {
  const fuelLevel = reading?.fuel_level ?? reading?.FuelLevel;
  const speed = reading?.speed ?? reading?.Speed;
  const temp = reading?.temperature ?? reading?.Temperature;

  let fgolor = '#a0aec0'; // default muted
  if (fuelLevel !== undefined && fuelLevel !== null) {
      if (fuelLevel < 20) fgolor = '#fc8181';
      else if (fuelLevel < 40) fgolor = '#f6e05e';
      else fgolor = '#68d391';
  }

  const dispId = vehicle?.display_id || vehicle?.DisplayID;
  const plate = vehicle?.license_plate || vehicle?.LicensePlate;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{vehicle.name}</Text>
        {fuelLevel !== undefined && fuelLevel !== null && (
          <View style={[styles.badge, { backgroundColor: fgolor + '20' }]}>
            <Text style={[styles.badgeText, { color: fgolor }]}>{Math.round(fuelLevel)}%</Text>
          </View>
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.idText}>{dispId}</Text>
        <Text style={styles.plate}>{plate}</Text>
      </View>
      {reading ? (
        <View style={styles.statsRow}>
          <Text style={styles.stat}>⚡ {speed !== undefined ? Math.round(speed) : 0} km/h</Text>
          <Text style={styles.stat}>🌡 {temp !== undefined ? temp.toFixed(1) : 0}°C</Text>
        </View>
      ) : (
        <Text style={styles.noData}>Awaiting data...</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a202c',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  selected: {
    borderColor: '#4fd1c5',
    backgroundColor: '#4fd1c510',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#f7fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  idText: {
    color: '#a0aec0',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  plate: {
    color: '#a0aec0',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#2d374880',
    padding: 8,
    borderRadius: 8,
  },
  stat: {
    color: '#cbd5e0',
    fontSize: 13,
  },
  noData: {
    color: '#718096',
    fontStyle: 'italic',
    fontSize: 13,
    marginTop: 4,
  },
});
