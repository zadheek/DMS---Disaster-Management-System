"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const SRI_LANKA_CENTER = [7.8731, 80.7718];
const SRI_LANKA_BOUNDS = [
  [5.85, 79.5],
  [9.85, 81.9],
];

const MARKER_HTML =
  '<span style="display:block;width:16px;height:16px;border-radius:999px;background:#1d4ed8;border:3px solid #ffffff;box-shadow:0 0 0 2px #1d4ed8,0 4px 10px rgba(15,35,64,0.25)"></span>';

export default function PrecisionMapPicker({ lat, lng, onChange }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);

  // Keep onChange ref fresh so the map event handler never captures a stale closure
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const safeLat = Number.isFinite(lat) ? lat : SRI_LANKA_CENTER[0];
  const safeLng = Number.isFinite(lng) ? lng : SRI_LANKA_CENTER[1];

  // Initialize vanilla Leaflet map — same pattern as LeafletMap.jsx so that
  // React Strict Mode's double-mount is handled correctly via _leaflet_id deletion.
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (!containerRef.current) return;
      const L = (await import("leaflet")).default;
      if (!isMounted || !containerRef.current) return;

      // Strict Mode mounts twice; remove stale _leaflet_id before re-initialising
      if (containerRef.current._leaflet_id) {
        delete containerRef.current._leaflet_id;
      }
      if (mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [safeLat, safeLng],
        zoom: 14,
        minZoom: 7,
        maxZoom: 19,
        maxBounds: SRI_LANKA_BOUNDS,
        maxBoundsViscosity: 1,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: MARKER_HTML,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = L.marker([safeLat, safeLng], { icon, draggable: true }).addTo(map);

      marker.on("dragend", (e) => {
        const { lat: mLat, lng: mLng } = e.target.getLatLng();
        onChangeRef.current(mLat, mLng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current(e.latlng.lat, e.latlng.lng);
      });

      if (!isMounted) {
        map.remove();
        return;
      }

      mapRef.current = map;
      markerRef.current = marker;
      map.invalidateSize();
    };

    init();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker + view when lat/lng props change (e.g. autocomplete selection or GPS)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const newLat = Number.isFinite(lat) ? lat : SRI_LANKA_CENTER[0];
    const newLng = Number.isFinite(lng) ? lng : SRI_LANKA_CENTER[1];
    markerRef.current.setLatLng([newLat, newLng]);
    mapRef.current.setView([newLat, newLng], mapRef.current.getZoom(), { animate: true });
  }, [lat, lng]);

  return (
    <div className="space-y-2">
      <div
        className="h-52 rounded-xl overflow-hidden border border-[var(--border)] shadow-[0_6px_16px_rgba(20,52,102,0.12)]"
      >
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        Click map or drag marker · Precision: {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
      </p>
    </div>
  );
}

