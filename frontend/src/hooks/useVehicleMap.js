'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useVehicleMap({ vehicles, latestReadings, selectedVehicleId }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);        // true once map.on('load') fires
  const markersRef = useRef({});            // vId -> Marker instance
  const pendingRef = useRef([]);            // [{vehicle, reading}] queued before map ready
  const maplibreRef = useRef(null);         // cached maplibre module

  // ── Helper: create or move a single marker ─────────────────────────────────
  const placeMarker = useCallback((vehicle, reading, maplibregl) => {
    if (!mapRef.current || !reading) return;
    const vId = vehicle.id || vehicle.ID;
    if (!vId) return;

    const lat = reading.latitude  ?? reading.Latitude;
    const lng = reading.longitude ?? reading.Longitude;
    if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

    const existing = markersRef.current[vId];
    if (existing) {
      existing.setLngLat([lng, lat]);
      return;
    }

    const isLowFuel = (reading.fuel_level ?? reading.FuelLevel ?? 100) < 30;
    const color = isLowFuel ? '#f97316' : '#22d3ee';
    const halo  = isLowFuel ? 'rgba(249,115,22,0.4)' : 'rgba(34,211,238,0.4)';

    const el = document.createElement('div');
    el.style.cssText = 'width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;';
    el.innerHTML = `<div style="width:24px;height:24px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 0 0 4px ${halo},0 4px 12px rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;font-size:10px;">🚚</div>`;

    const fuelVal  = (reading.fuel_level  ?? reading.FuelLevel  ?? 0).toFixed(1);
    const speedVal = (reading.speed        ?? reading.Speed       ?? 0).toFixed(1);
    const tempVal  = (reading.temperature  ?? reading.Temperature ?? 0).toFixed(1);
    const dispId   = vehicle.display_id || vehicle.DisplayID || '';

    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([lng, lat])
      .setPopup(
        new maplibregl.Popup({ offset: 25 }).setHTML(
          `<div class="map-popup">
            <h4>${vehicle.name}</h4>
            <p>🔋 Fuel: ${fuelVal}%</p>
            <p>⚡ Speed: ${speedVal} km/h</p>
            <p>🌡 Temp: ${tempVal}°C</p>
            <p class="popup-id">${dispId}</p>
          </div>`
        )
      )
      .addTo(mapRef.current);

    markersRef.current[vId] = marker;
  }, []);

  // ── Public: update or create a marker (queues if map not ready) ─────────────
  const updateMarker = useCallback((vehicle, reading) => {
    if (!reading) return;
    if (!mapReadyRef.current) {
      pendingRef.current.push({ vehicle, reading });
      return;
    }
    if (maplibreRef.current) placeMarker(vehicle, reading, maplibreRef.current);
  }, [placeMarker]);

  // ── Initialise MapLibre map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      import('maplibre-gl/dist/maplibre-gl.css');
      maplibreRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [-74.0721, 4.7109],
        zoom: 10,
      });

      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl(), 'top-right');

      map.on('load', () => {
        mapReadyRef.current = true;
        // Flush any markers that arrived before the map was ready
        pendingRef.current.forEach(({ vehicle, reading }) =>
          placeMarker(vehicle, reading, maplibregl)
        );
        pendingRef.current = [];
      });
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current  = null;
      mapReadyRef.current = false;
      markersRef.current  = {};
      pendingRef.current  = [];
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-render markers whenever vehicles or readings change ───────────────────
  useEffect(() => {
    vehicles.forEach((vehicle) => {
      const vId    = vehicle.id || vehicle.ID;
      const reading = latestReadings[vId];
      if (reading) updateMarker(vehicle, reading);
    });
  }, [vehicles, latestReadings, updateMarker]);

  // ── Fly to selected vehicle ──────────────────────────────────────────────────
  useEffect(() => {
    if (!selectedVehicleId || !mapRef.current || !mapReadyRef.current) return;
    const reading = latestReadings[selectedVehicleId];
    if (reading) {
      mapRef.current.flyTo({ center: [reading.longitude, reading.latitude], zoom: 14 });
    }
  }, [selectedVehicleId, latestReadings]);

  return { containerRef };
}
