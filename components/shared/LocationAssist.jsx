"use client";
import { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Search, Navigation, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { reverseGeocode } from "@/lib/geocode";

const PrecisionMapPicker = dynamic(() => import("@/components/shared/PrecisionMapPicker"), {
  ssr: false,
});

export default function LocationAssist({ onLocationSelect, currentLat, currentLng }) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const selectedLat = Number.isFinite(currentLat) ? currentLat : 7.8731;
  const selectedLng = Number.isFinite(currentLng) ? currentLng : 80.7718;

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (value) => {
    if (!value.trim() || value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setLoadingSuggestions(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&countrycodes=lk`,
        { headers: { "User-Agent": "DisasterManagementSystem/1.0 (disaster@keys.lk)" } }
      );
      if (!res.ok) return;
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
    } catch {
      // silently ignore network errors
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 350);
  };

  const handleSuggestionSelect = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    const address = suggestion.display_name;
    setQuery(address);
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect({ lat, lng, address });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setShowSuggestions(false);
    if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) handleSuggestionSelect(suggestions[0]);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const address = await reverseGeocode(latitude, longitude);
          onLocationSelect({ lat: latitude, lng: longitude, address });
          setQuery(address);
          toast.success("Location acquired");
        } catch {
          onLocationSelect({ lat: latitude, lng: longitude, address: "" });
          toast.success("Location acquired (address unknown)");
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Failed to get your location. Please check permissions.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  return (
    <div className="col-span-2 space-y-3 mb-2 p-3 sm:p-4 bg-[var(--bg-elevated)]/88 border border-[var(--border)] rounded-xl shadow-[0_4px_12px_rgba(20,52,102,0.06)]">
      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">
        Location Assist
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Search input with autocomplete dropdown */}
        <div className="relative flex-1" ref={wrapperRef}>
          <div className="flex gap-2">
            <Input
              aria-label="Address search"
              placeholder="Type to search location (e.g. Gampaha)..."
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="bg-[var(--bg-surface)] border-[var(--border)] text-sm min-h-[44px]"
            />
            <Button
              type="button"
              variant="outline"
              disabled={loadingSuggestions}
              aria-label="Search location"
              className="border-[var(--border)] min-h-[44px] min-w-[44px] px-3 shrink-0"
              onClick={() => suggestions.length > 0 && handleSuggestionSelect(suggestions[0])}
            >
              <Search className={`w-4 h-4 text-[var(--text-muted)] ${loadingSuggestions ? "animate-pulse" : ""}`} />
            </Button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button
                    type="button"
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] transition-colors border-b border-[var(--border)] last:border-0"
                    onClick={() => handleSuggestionSelect(s)}
                  >
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[var(--accent)]" />
                    <span className="line-clamp-2 leading-snug">{s.display_name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleUseLocation}
          disabled={locating}
          aria-label="Use my current location"
          className="bg-[var(--info)]/10 text-[var(--info)] hover:bg-[var(--info)]/20 border-none min-h-[44px] flex-shrink-0 gap-2 w-full sm:w-auto"
        >
          <Navigation className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
          {locating ? "Locating..." : "Use My Location"}
        </Button>
      </div>

      {/* Map pin picker */}
      <PrecisionMapPicker
        lat={selectedLat}
        lng={selectedLng}
        onChange={(lat, lng) => {
          onLocationSelect({ lat, lng, address: "" });
        }}
      />
    </div>
  );
}
