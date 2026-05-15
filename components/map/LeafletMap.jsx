"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import { createMapPin } from "./MapPin";

// Sri Lanka geographic bounds
const SRI_LANKA_BOUNDS = [
  [5.85, 79.5],  // SW corner
  [9.85, 81.9],  // NE corner
];
const SRI_LANKA_CENTER = [7.8731, 80.7718];
const ALERT_SAMPLE_IMAGES = {
  FLOOD: "/samples/flood-alert.svg",
  LANDSLIDE: "/samples/landslide-alert.svg",
  FIRE: "/samples/fire-alert.svg",
  BUILDING_COLLAPSE: "/samples/collapse-alert.svg",
  OTHER: "/samples/wind-alert.svg",
};
const ROAD_SAMPLE_IMAGE = "/samples/road-alert.svg";
const SEVERITY_HEAT = {
  CRITICAL: { color: "#dc2626", fillColor: "#ef4444", radius: 2200, fillOpacity: 0.22 },
  HIGH: { color: "#ef4444", fillColor: "#f97316", radius: 1700, fillOpacity: 0.18 },
  MEDIUM: { color: "#f59e0b", fillColor: "#facc15", radius: 1200, fillOpacity: 0.14 },
  LOW: { color: "#2563eb", fillColor: "#60a5fa", radius: 850, fillOpacity: 0.12 },
};

const routeForPin = (pin) => {
  switch (pin.pinType) {
    case "alert":
      return "/alerts";
    case "roadAlert":
      return "/roads";
    case "missingPerson":
      return "/missing";
    case "reliefCamp":
      return "/checkin";
    case "donation":
      return "/donations";
    default:
      return "/map";
  }
};

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const imageForPin = (pin) => {
  if (pin.data?.photoUrl) return pin.data.photoUrl;
  if (pin.pinType === "alert") {
    return ALERT_SAMPLE_IMAGES[pin.data?.type || pin.type] || ALERT_SAMPLE_IMAGES.OTHER;
  }
  if (pin.pinType === "roadAlert") {
    return ROAD_SAMPLE_IMAGE;
  }
  return "";
};

const bearingForRoad = (pin) => {
  const text = `${pin.data?.fromLocation || ""}-${pin.data?.toLocation || ""}-${pin.data?.roadName || ""}`;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) % 360;
  }
  return (hash || 72) * (Math.PI / 180);
};

const roadCorridorPoints = (pin) => {
  const bearing = bearingForRoad(pin);
  const lengthKm = 3.2;
  const latKm = 110.574;
  const lngKm = 111.32 * Math.cos((Number(pin.lat) * Math.PI) / 180);
  const dLat = (Math.cos(bearing) * lengthKm) / latKm;
  const dLng = (Math.sin(bearing) * lengthKm) / lngKm;
  return [
    [pin.lat - dLat, pin.lng - dLng],
    [pin.lat, pin.lng],
    [pin.lat + dLat, pin.lng + dLng],
  ];
};

export default function LeafletMap({
  pins = [],
  height = "100%",
  fitSignal = 0,
  locateSignal = 0,
  focusTarget = null,
  focusSignal = 0,
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const markerByKeyRef = useRef(new Map());
  const userMarkerRef = useRef(null);

  // Leaflet must be imported in the browser only. The map instance is kept in a
  // ref so React rerenders do not recreate the map canvas.
  useEffect(() => {
    let isMounted = true;
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      if (!isMounted || mapInstanceRef.current || !mapRef.current) return;

      const map = L.map(mapRef.current, {
        center: SRI_LANKA_CENTER,
        zoom: 8,
        minZoom: 7,
        maxZoom: 18,
        zoomControl: true,
        attributionControl: true,
        maxBounds: SRI_LANKA_BOUNDS,
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
        updateWhenIdle: true,
        keepBuffer: 2,
        detectRetina: false,
      }).addTo(map);

      // Fit to Sri Lanka on load
      map.fitBounds(SRI_LANKA_BOUNDS);

      if (!isMounted) {
        map.remove();
        return;
      }

      mapInstanceRef.current = map;
      renderPins(L, map, pins);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rebuild markers whenever filtered pins change. Marker objects are tracked
  // separately from React because Leaflet owns DOM nodes outside React.
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateMarkers = async () => {
      const L = (await import("leaflet")).default;
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      markerByKeyRef.current.clear();
      renderPins(L, mapInstanceRef.current, pins);
    };

    updateMarkers();
  }, [pins]);

  useEffect(() => {
    if (!focusSignal || !focusTarget || !mapInstanceRef.current) return;
    focusMapTarget(focusTarget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusSignal, focusTarget, pins]);

  useEffect(() => {
    if (!fitSignal || !mapInstanceRef.current) return;
    fitToVisiblePins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitSignal]);

  useEffect(() => {
    if (!locateSignal || !mapInstanceRef.current || typeof navigator === "undefined") return;

    navigator.geolocation?.getCurrentPosition(
      async ({ coords }) => {
        const latLng = [coords.latitude, coords.longitude];
        const L = (await import("leaflet")).default;
        if (userMarkerRef.current) userMarkerRef.current.remove();
        userMarkerRef.current = L.circleMarker(latLng, {
          radius: 8,
          color: "#1d62c8",
          fillColor: "#ffffff",
          fillOpacity: 1,
          weight: 3,
        }).bindPopup("Your location").addTo(mapInstanceRef.current);
        mapInstanceRef.current.setView(latLng, 13, { animate: true });
      },
      () => {
        mapInstanceRef.current?.fitBounds(SRI_LANKA_BOUNDS, { padding: [20, 20] });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, [locateSignal]);

  function fitToVisiblePins() {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (!pins.length) {
      map.fitBounds(SRI_LANKA_BOUNDS, { padding: [20, 20] });
      return;
    }

    const bounds = pins.map((pin) => [pin.lat, pin.lng]);
    map.fitBounds(bounds, { padding: [42, 42], maxZoom: 13 });
  }

  // Supports URLs such as /map?pinType=alert&id=...&lat=...&lng=...
  // so list cards can open the map directly on the exact incident location.
  function focusMapTarget(target) {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (target.pinType && target.id) {
      const key = `${target.pinType}:${target.id}`;
      const marker = markerByKeyRef.current.get(key);
      const pin = pins.find((item) => `${item.pinType}:${item.id}` === key);

      if (marker && pin) {
        map.setView([pin.lat, pin.lng], target.zoom || 14, { animate: true });
        setTimeout(() => marker.openPopup(), 250);
        return;
      }
    }

    if (Number.isFinite(target.lat) && Number.isFinite(target.lng)) {
      map.setView([target.lat, target.lng], target.zoom || 14, { animate: true });
    }
  }

  // Convert normalized database records into Leaflet markers with an accessible
  // popup containing the emergency summary and a details link.
  function renderPins(L, map, pinList) {
    pinList.forEach((pin) => {
      try {
        const key = `${pin.pinType}:${pin.id}`;
        const icon = createMapPin(pin.type, L);
        const marker = L.marker([pin.lat, pin.lng], { icon });

        if (pin.pinType === "alert") {
          const heat = SEVERITY_HEAT[pin.data?.severity] || SEVERITY_HEAT.MEDIUM;
          const heatZone = L.circle([pin.lat, pin.lng], {
            radius: heat.radius,
            color: heat.color,
            weight: 1,
            opacity: 0.45,
            fillColor: heat.fillColor,
            fillOpacity: heat.fillOpacity,
            interactive: false,
          }).addTo(map);
          markersRef.current.push(heatZone);
        }

        if (pin.pinType === "roadAlert") {
          const corridor = L.polyline(roadCorridorPoints(pin), {
            color: "#f97316",
            weight: 8,
            opacity: 0.28,
            lineCap: "round",
            interactive: false,
          }).addTo(map);
          const centerLine = L.polyline(roadCorridorPoints(pin), {
            color: "#ea580c",
            weight: 3,
            opacity: 0.9,
            dashArray: "10 8",
            lineCap: "round",
            interactive: false,
          }).addTo(map);
          markersRef.current.push(corridor, centerLine);
        }

        const label = escapeHtml(pin.data?.title || pin.data?.name || pin.data?.roadName || "Map item");
        const location = escapeHtml(pin.data?.location || pin.data?.lastSeenLocation || pin.data?.fromLocation || "");
        const status = escapeHtml(pin.data?.status || "Active");
        const preciseLat = Number(pin.lat).toFixed(6);
        const preciseLng = Number(pin.lng).toFixed(6);
        const href = routeForPin(pin);
        const imageUrl = escapeHtml(imageForPin(pin));

        marker.bindPopup(`
          <div style="min-width:190px;max-width:260px;font-family:inherit;color:#0f2340;">
            <p style="margin:0 0 6px;font-weight:700;font-size:13px;color:#0f2340;">${label}</p>
            ${location ? `<p style="margin:0 0 8px;font-size:11px;color:#5f7190;">${location}</p>` : ""}
            ${imageUrl ? `<img src="${imageUrl}" alt="" style="display:block;width:100%;height:94px;object-fit:cover;border-radius:12px;margin:0 0 10px;background:#e2e8f0;" />` : ""}
            <p style="margin:0 0 10px;font-size:11px;color:#5f7190;">Status: ${status}</p>
            <p style="margin:0 0 10px;font-size:11px;color:#5f7190;">Coords: ${preciseLat}, ${preciseLng}</p>
            <a href="${href}" style="display:inline-flex;align-items:center;border-radius:999px;background:#1d4ed8;color:white;text-decoration:none;padding:6px 10px;font-size:11px;font-weight:700;">Open details</a>
          </div>
        `);

        marker.addTo(map);
        markersRef.current.push(marker);
        markerByKeyRef.current.set(key, marker);
      } catch (e) {
        console.warn("Failed to render pin:", e);
      }
    });

    if (focusTarget) {
      setTimeout(() => focusMapTarget(focusTarget), 100);
    }
  }

  return (
    <div
      ref={mapRef}
      style={{ height, width: "100%" }}
      className="z-0"
    />
  );
}
