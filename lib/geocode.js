/**
 * Reverse geocode lat/lng to a human-readable address using Nominatim (OpenStreetMap)
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>} Human-readable address
 */
export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      {
        headers: {
          "User-Agent": "DisasterManagementSystem/1.0 (disaster@keys.lk)",
        },
      }
    );
    if (!res.ok) return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const data = await res.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Forward geocode a human-readable address to lat/lng using Nominatim (OpenStreetMap)
 * @param {string} address
 * @returns {Promise<{lat: number, lng: number, address: string} | null>}
 */
export async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        headers: {
          "User-Agent": "DisasterManagementSystem/1.0 (disaster@keys.lk)",
        },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      address: data[0].display_name
    };
  } catch {
    return null;
  }
}
