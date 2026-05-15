// Utility function — no JSX, no "use client"
export function createMapPin(type, L) {
  const pinColors = {
    LANDSLIDE: "#ef4444",
    FLOOD: "#ef4444",
    FIRE: "#f97316",
    BUILDING_COLLAPSE: "#ef4444",
    OTHER: "#f59e0b",
    MISSING_PERSON: "#2563eb",
    ROAD_ALERT: "#f97316",
    RELIEF_CAMP: "#64748b",
    DONATION: "#94a3b8",
    VOLUNTEER: "#1e40af",
  };

  const pinLabels = {
    LANDSLIDE: "LS",
    FLOOD: "FL",
    FIRE: "FI",
    BUILDING_COLLAPSE: "BC",
    OTHER: "!",
    MISSING_PERSON: "MP",
    ROAD_ALERT: "RA",
    RELIEF_CAMP: "RC",
    DONATION: "DN",
    VOLUNTEER: "V",
  };

  const color = pinColors[type] || "#94a3b8";
  const label = pinLabels[type] || "?";

  return L.divIcon({
    className: "",
    html: `<div style="
      width: 22px; height: 22px;
      background: ${color}14;
      border: 2px solid ${color};
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 2px ${color}1e, 0 4px 10px rgba(16,35,64,0.14);
      font-size: 8px; font-weight: 700; color: ${color};
      font-family: inherit;
      position: relative;
    ">${label}<span style="position:absolute;width:3px;height:3px;border-radius:999px;background:${color};left:50%;top:50%;transform:translate(-50%,-50%)"></span></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -18],
  });
}
