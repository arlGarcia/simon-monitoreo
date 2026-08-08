import { useEffect, useRef, useCallback } from 'react';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://10.0.2.2:8080';
const RECONNECT_DELAY_MS = 4000;

export function useWebSocket({ onSensorReading, onAlert }) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const ws = new WebSocket(`${WS_URL}/ws`);
    wsRef.current = ws;

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'sensor_reading') onSensorReading?.(msg.payload);
        if (msg.type === 'alert') onAlert?.(msg.payload);
      } catch {}
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => ws.close();
  }, [onSensorReading, onAlert]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
