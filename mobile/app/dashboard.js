import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, ActivityIndicator, TouchableOpacity, Modal } from 'react-native';
import { router } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../src/hooks/useAuth';
import { useVehicles } from '../src/hooks/useVehicles';
import { useWebSocket } from '../src/hooks/useWebSocket';
import { VehicleCard } from '../src/components/VehicleCard';
import { registerForPushNotifications, scheduleLocalAlert } from '../src/lib/notifications';
import { api } from '../src/lib/api';

export default function DashboardScreen() {
  const { logout } = useAuth();
  const { vehicles, latestReadings, updateReading, fetchVehicles, loading, offline } = useVehicles();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'alerts'
  const [alerts, setAlerts] = useState([]);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [vehicleHistory, setVehicleHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchVehicleAlerts = useCallback(async (vId) => {
    if (!vId) return;
    try {
      const data = await api.getAlerts(vId);
      if (data && Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err) {
      // En modo offline no rompe la app
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    registerForPushNotifications();
  }, [fetchVehicles]);

  useEffect(() => {
    if (selectedVehicle) {
      const vId = selectedVehicle.id || selectedVehicle.ID;
      fetchVehicleAlerts(vId);
    } else {
      setAlerts([]);
    }
  }, [selectedVehicle, fetchVehicleAlerts]);

  const handleSensorReading = useCallback((reading) => {
    updateReading(reading);
  }, [updateReading]);

  const handleAlert = useCallback((alert) => {
    scheduleLocalAlert('Fleet Alert', alert.message || 'Sensor threshold exceeded');
    // Si la alerta pertenece al vehículo seleccionado (o si no hay vehículo seleccionado), agregarla
    const currentSelectedId = selectedVehicle?.id || selectedVehicle?.ID;
    const alertVehicleId = alert.vehicle_id || alert.VehicleID;
    
    if (!currentSelectedId || alertVehicleId === currentSelectedId) {
      setAlerts(prev => [alert, ...prev.slice(0, 49)]);
    }
  }, [selectedVehicle]);

  useWebSocket({ onSensorReading: handleSensorReading, onAlert: handleAlert });

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  const handleOpenHistory = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setHistoryModalVisible(true);
    setHistoryLoading(true);
    try {
      const vId = vehicle.id || vehicle.ID;
      const data = await api.getHistoricalReadings(vId, 20);
      setVehicleHistory(data || []);
    } catch (err) {
      console.warn('Error fetching history:', err.message);
      setVehicleHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const renderMap = () => {
    const vId = selectedVehicle ? (selectedVehicle.id || selectedVehicle.ID) : null;
    const reading = vId ? latestReadings[vId] : null;
    
    const lat = reading?.latitude ?? reading?.Latitude;
    const lng = reading?.longitude ?? reading?.Longitude;

    const initialRegion = {
      latitude: 4.7109,
      longitude: -74.0721,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    const region = (lat && lng && !isNaN(lat) && !isNaN(lng)) ? {
      latitude: lat,
      longitude: lng,
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
            const vId = v.id || v.ID;
            const r = latestReadings[vId];
            if (!r) return null;

            const lat = r.latitude ?? r.Latitude;
            const lng = r.longitude ?? r.Longitude;
            const fuel = r.fuel_level ?? r.FuelLevel ?? 0;

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) return null;

            return (
              <Marker
                key={vId}
                coordinate={{ latitude: lat, longitude: lng }}
                title={v.name}
                description={`Fuel: ${fuel.toFixed(1)}%`}
                pinColor={fuel < 30 ? 'orange' : 'teal'}
                onPress={() => setSelectedVehicle(v)}
              />
            );
          })}
        </MapView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>SimonGO</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {offline && <Text style={styles.offlineBanner}>Offline Mode - Cached Data</Text>}
      
      {renderMap()}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'vehicles' && styles.activeTabButton]} 
          onPress={() => setActiveTab('vehicles')}
        >
          <Text style={[styles.tabText, activeTab === 'vehicles' && styles.activeTabText]}>
            Vehicles ({vehicles.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tabButton, activeTab === 'alerts' && styles.activeTabButton]} 
          onPress={() => setActiveTab('alerts')}
        >
          <Text style={[styles.tabText, activeTab === 'alerts' && styles.activeTabText]}>
            Alerts {selectedVehicle ? `(${selectedVehicle.name})` : 'All'} ({alerts.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#22d3ee" style={{ marginTop: 20 }}/>
        ) : activeTab === 'vehicles' ? (
          <FlatList
            data={vehicles}
            keyExtractor={item => item.id || item.ID}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleOpenHistory(item)}>
                <VehicleCard 
                  vehicle={item} 
                  reading={latestReadings[item.id || item.ID]} 
                  isSelected={selectedVehicle?.id === (item.id || item.ID)}
                  onPress={() => setSelectedVehicle(item)}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <FlatList
            data={alerts}
            keyExtractor={(item, index) => item.id || `alert-${index}`}
            renderItem={({ item }) => (
              <View style={styles.alertCard}>
                <View style={styles.alertCardHeader}>
                  <Text style={styles.alertSeverity}>[{item.type || item.severity || 'WARN'}]</Text>
                  <Text style={styles.alertTime}>
                    {item.created_at ? new Date(item.created_at).toLocaleTimeString() : (item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : 'Now')}
                  </Text>
                </View>
                <Text style={styles.alertMessage}>{item.message || 'Threshold exceeded'}</Text>
                <Text style={styles.alertVehicleSub}>
                  Vehicle: {item.vehicle_id || item.VehicleID || selectedVehicle?.name || 'Unknown'}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {selectedVehicle 
                  ? `No active alerts for ${selectedVehicle.name}` 
                  : 'Select a vehicle or wait for real-time alerts'}
              </Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setHistoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Historical - {selectedVehicle?.name || 'Vehicle'}
              </Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <ActivityIndicator size="large" color="#22d3ee" style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={vehicleHistory}
                keyExtractor={(item, index) => item.id || `hist-${index}`}
                renderItem={({ item }) => (
                  <View style={styles.historyRow}>
                    <Text style={styles.historyTime}>
                      {new Date(item.timestamp || item.CreatedAt).toLocaleTimeString()}
                    </Text>
                    <Text style={styles.historyDetail}>
                      Speed: {(item.speed || item.Speed || 0).toFixed(1)} km/h | Fuel: {(item.fuel_level || item.FuelLevel || 0).toFixed(1)}%
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No historical records found</Text>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070d1a',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#0b1329',
  },
  headerTitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  offlineBanner: {
    backgroundColor: '#b7791f',
    color: '#fff',
    textAlign: 'center',
    padding: 8,
    fontWeight: 'bold',
  },
  mapContainer: {
    height: Dimensions.get('window').height * 0.35,
    width: '100%',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#38bdf8',
  },
  tabText: {
    color: '#64748b',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#38bdf8',
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  listContent: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  alertCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertSeverity: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  alertMessage: {
    color: '#e2e8f0',
    fontSize: 14,
    marginVertical: 4,
  },
  alertVehicleSub: {
    color: '#38bdf8',
    fontSize: 11,
  },
  alertTime: {
    color: '#64748b',
    fontSize: 11,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeBtn: {
    color: '#94a3b8',
    fontSize: 20,
    fontWeight: 'bold',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  historyTime: {
    color: '#38bdf8',
    fontSize: 12,
  },
  historyDetail: {
    color: '#cbd5e1',
    fontSize: 12,
  },
});

