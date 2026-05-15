"use client";
import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SRI_LANKA_CENTER = [7.8731, 80.7718];
const SRI_LANKA_BOUNDS = [
  [5.85, 79.5],
  [9.85, 81.9],
];

function DragAndClickMarker({ lat, lng, onChange, markerIcon }) {
  useMapEvents({
    click(event) {
      onChange(event.latlng.lat, event.latlng.lng);
    },
  });

  return (
    <Marker
      position={[lat, lng]}
      draggable
      icon={markerIcon}
      eventHandlers={{
        dragend(event) {
          const { lat: nextLat, lng: nextLng } = event.target.getLatLng();
          onChange(nextLat, nextLng);
        },
      }}
    />
  );
}

export default function PrecisionMapPicker({ lat, lng, onChange }) {
  const markerIcon = useMemo(
    () =>
      L.divIcon({
        className: "",
        html: '<span style="display:block;width:16px;height:16px;border-radius:999px;background:#1d4ed8;border:3px solid #ffffff;box-shadow:0 0 0 2px #1d4ed8,0 4px 10px rgba(15,35,64,0.25)"></span>',
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
    []
  );

  const safeLat = Number.isFinite(lat) ? lat : SRI_LANKA_CENTER[0];
  const safeLng = Number.isFinite(lng) ? lng : SRI_LANKA_CENTER[1];

  return (
    <div className="space-y-2">
      <div className="h-52 rounded-xl overflow-hidden border border-[var(--border)] shadow-[0_6px_16px_rgba(20,52,102,0.12)]">
        <MapContainer
          center={[safeLat, safeLng]}
          zoom={14}
          style={{ width: "100%", height: "100%" }}
          maxZoom={19}
          minZoom={7}
          maxBounds={SRI_LANKA_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DragAndClickMarker lat={safeLat} lng={safeLng} onChange={onChange} markerIcon={markerIcon} />
        </MapContainer>
      </div>
      <p className="text-[11px] text-[var(--text-muted)]">
        Click map or drag marker for exact coordinates. Precision: {safeLat.toFixed(6)}, {safeLng.toFixed(6)}
      </p>
    </div>
  );
}
