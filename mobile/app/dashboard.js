import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../src/hooks/useAuth';
import { useVehicles } from '../src/hooks/useVehicles';
import { useWebSocket } from '../src/hooks/useWebSocket';
import { VehicleCard } from '../src/components/VehicleCard';
import { registerForPushNotifications, scheduleLocalAlert } from '../src/lib/notifications';

export default function DashboardScreen() {
  const { logout } = useAuth();
  const { vehicles, latestReadings, updateReading, fetchVehicles, loading, offline } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    fetchVehicles();
    registerForPushNotifications();
  }, [fetchVehicles]);

  const handleSensorReading = useCallback((reading) => {
    updateReading(reading);
  }, [updateReading]);

  const handleAlert = useCallback((alert) => {
    scheduleLocalAlert('Fleet Alert', alert.message);
  }, []);

  useWebSocket({ onSensorReading: handleSensorReading, onAlert: handleAlert });

  const renderMap = () => {
    const reading = selectedVehicle ? latestReadings[selectedVehicle.id] : null;
    
    // Default center (Bogota)
    const initialRegion = {
      latitude: 4.7109,
      longitude: -74.0721,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    const region = reading ? {
      latitude: reading.latitude,
      longitude: reading.longitude,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    } : initialRegion;

    return (
      <View style={styles.mapContainer}>
        <MapView 
          style={styles.map}
          region={region}
          userInterfaceStyle="dark"
        >
          {vehicles.map(v => {
            const r = latestReadings[v.id];
            if (!r) return null;
            return (
              <Marker
                key={v.id}
                coordinate={{ latitude: r.latitude, longitude: r.longitude }}
                title={v.name}
                description={`Fuel: ${r.fuel_level?.toFixed(1)}%`}
                pinColor={r.fuel_level < 30 ? 'orange' : 'teal'}
              />
            );
          })}
        </MapView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {offline && <Text style={styles.offlineBanner}>Offline Mode - Cached Data</Text>}
      
      {renderMap()}

      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Vehicles ({vehicles.length})</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#22d3ee" style={{ marginTop: 20 }}/>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <VehicleCard 
                vehicle={item} 
                reading={latestReadings[item.id]} 
                isSelected={selectedVehicle?.id === item.id}
                onPress={() => setSelectedVehicle(item)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1a',
  },
  offlineBanner: {
    backgroundColor: '#b7791f',
    color: '#fff',
    textAlign: 'center',
    padding: 8,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.4,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#2d3748',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e2e8f0',
    padding: 16,
    paddingBottom: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
});
