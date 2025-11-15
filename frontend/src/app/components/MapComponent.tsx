'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';

type Location = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
};

type Props = {
  locations: Location[];
  userLocation?: { lat: number; lng: number } | null;
  onSelect?: (location: Location) => void;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  /** If true, use initialCenter (or first location) instead of fitting all markers */
  preferCenter?: boolean;
};

const MapComponent: React.FC<Props> = ({
  locations,
  userLocation,
  onSelect,
  initialCenter,
  initialZoom = 12,
  preferCenter,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  const fallbackCenter = useMemo(() => ({ lat: 32.7357, lng: -97.1081 }), []);
  const firstCenter = useMemo(() => {
    if (initialCenter) return initialCenter;
    if (locations && locations[0])
      return { lat: locations[0].latitude, lng: locations[0].longitude };
    return fallbackCenter;
  }, [initialCenter, locations, fallbackCenter]);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Create the map once (only on client)
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    if (!containerRef.current || mapRef.current) return;

    // Dynamically import Leaflet only on client
    import('leaflet').then((L) => {
      // Patch default marker icons (Next bundlers won't resolve the default URLs)
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      // Create fresh Leaflet map
      const map = L.default.map(containerRef.current!, {
        center: [firstCenter.lat, firstCenter.lng],
        zoom: initialZoom,
        preferCanvas: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
      });

      // Tile layer
      const tiles = L.default.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          attribution:
            '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
        }
      );
      tiles.addTo(map);

      mapRef.current = map;
    });

    // Clean up on unmount (important for Fast Refresh)
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.remove();
        } catch {
          /* ignore */
        }
        mapRef.current = null;
      }
      // also clear markers cache
      markersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {}
      });
      markersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, firstCenter.lat, firstCenter.lng, initialZoom]); // do not depend on props — we update below

  // Add/update markers + view whenever locations/userLocation change
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    const map = mapRef.current;
    if (!map) return;

    // Dynamically import Leaflet for marker operations
    import('leaflet').then((L) => {
      // remove existing markers
      markersRef.current.forEach((m) => {
        try {
          m.remove();
        } catch {}
      });
      markersRef.current = [];

      // add user location marker if present
      if (userLocation) {
        const um = L.default.marker([userLocation.lat, userLocation.lng]);
        um.bindPopup('<div style="color:#111">Your Location</div>', {
          closeButton: true,
          autoPan: true,
        });
        um.on('click', () => {
          um.openPopup();
        });
        um.addTo(map);
        markersRef.current.push(um);
      }

      // add location markers
      locations.forEach((loc) => {
        const m = L.default.marker([loc.latitude, loc.longitude]);
        const html =
          `<div style="color:#111">` +
          `<a href="/location?id=${encodeURIComponent(
            loc.id
          )}" style="font-weight:600;color:#059669;text-decoration:none;">${loc.name}</a>` +
          (loc.description
            ? `<p style="margin:.25rem 0 0;color:#4b5563;font-size:.85rem;">${loc.description}</p>`
            : '') +
          `</div>`;
        
        // Bind popup and ensure it opens on click
        m.bindPopup(html, {
          closeButton: true,
          autoPan: true,
        });
        
        // Open popup on marker click
        m.on('click', () => {
          m.openPopup();
          if (onSelect) {
            onSelect(loc);
          }
        });
        
        m.addTo(map);
        markersRef.current.push(m);
      });

      // set view
      if (!preferCenter && locations.length > 1) {
        const bounds = L.default.latLngBounds(
          locations.map((l) => [l.latitude, l.longitude]) as [number, number][]
        );
        if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
        map.fitBounds(bounds, { padding: [56, 56] });
      } else if (preferCenter) {
        const c = initialCenter ?? firstCenter;
        map.setView([c.lat, c.lng], initialZoom, { animate: false });
      } else if (locations.length === 1) {
        const c = { lat: locations[0].latitude, lng: locations[0].longitude };
        map.setView([c.lat, c.lng], initialZoom, { animate: false });
      } else {
        // fallback
        map.setView([firstCenter.lat, firstCenter.lng], initialZoom, {
          animate: false,
        });
      }

      // Invalidate size after layout settles (helps inside blurred card)
      setTimeout(() => {
        try {
          map.invalidateSize();
        } catch {}
      }, 0);
    });
  }, [
    isClient,
    locations,
    userLocation?.lat,
    userLocation?.lng,
    preferCenter,
    initialCenter?.lat,
    initialCenter?.lng,
    initialZoom,
    firstCenter.lat,
    firstCenter.lng,
    onSelect,
  ]);

  return (
    <div className="w-full h-96 rounded-2xl overflow-hidden border border-neutral-800 shadow-lg">
      <div ref={containerRef} className="w-full h-96" />
    </div>
  );
};

export default MapComponent;
