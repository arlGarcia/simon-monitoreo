import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('fleet-alerts', {
        name: 'Fleet Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#22d3ee',
        sound: 'default',
      });
    }

    const token = await Notifications.getExpoPushTokenAsync();
    return token.data;
  } catch (err) {
    // En Expo Go SDK 53+ esto arroja advertencia/error de push remoto.
    // Ignoramos silenciosamente para no ralentizar la app en entorno Go.
    console.log('[Notifications] Push remote disabled in Expo Go environment.');
    return null;
  }
}

export async function scheduleLocalAlert(title, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { type: 'fleet_alert' },
      },
      trigger: null,
    });
  } catch (err) {
    console.log('[Notifications] Local schedule bypass:', err.message);
  }
}

