'use client';

import { useEffect, useRef, useCallback } from 'react';

export function useVehicleMap({ vehicles, latestReadings, selectedVehicleId }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      import('maplibre-gl/dist/maplibre-gl.css');

      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [-74.0721, 4.7109],
        zoom: 10,
      });

      mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  const updateMarker = useCallback((vehicle, reading) => {
    if (!mapRef.current || !reading) return;

    import('maplibre-gl').then(({ default: maplibregl }) => {
      const existing = markersRef.current[vehicle.id];
      if (existing) {
        existing.setLngLat([reading.longitude, reading.latitude]);
        return;
      }

      const el = document.createElement('div');
      el.className = 'vehicle-marker';
      el.innerHTML = `<div class="marker-dot ${reading.fuel_level < 30 ? 'marker-dot--low-fuel' : ''}"></div>`;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([reading.longitude, reading.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `<div class="map-popup">
              <h4>${vehicle.name}</h4>
              <p>🔋 Fuel: ${reading.fuel_level?.toFixed(1)}%</p>
              <p>⚡ Speed: ${reading.speed?.toFixed(1)} km/h</p>
              <p>🌡 Temp: ${reading.temperature?.toFixed(1)}°C</p>
              <p class="popup-id">${vehicle.display_id}</p>
            </div>`
          )
        )
        .addTo(mapRef.current);

      markersRef.current[vehicle.id] = marker;
    });
  }, []);

  useEffect(() => {
    vehicles.forEach((vehicle) => {
      const reading = latestReadings[vehicle.id];
      if (reading) updateMarker(vehicle, reading);
    });
  }, [vehicles, latestReadings, updateMarker]);

  useEffect(() => {
    if (!selectedVehicleId || !mapRef.current) return;
    const reading = latestReadings[selectedVehicleId];
    if (reading) {
      mapRef.current.flyTo({ center: [reading.longitude, reading.latitude], zoom: 14 });
    }
  }, [selectedVehicleId, latestReadings]);

  return { containerRef };
}
