"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { Search, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { geocode, reverseGeocode } from "@/lib/geocode";

const PrecisionMapPicker = dynamic(() => import("@/components/shared/PrecisionMapPicker"), {
  ssr: false,
});

export default function LocationAssist({ onLocationSelect, currentLat, currentLng }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  const selectedLat = Number.isFinite(currentLat) ? currentLat : 7.8731;
  const selectedLng = Number.isFinite(currentLng) ? currentLng : 80.7718;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const result = await geocode(query);
      if (result) {
        onLocationSelect({ lat: result.lat, lng: result.lng, address: result.address });
        toast.success("Location found");
      } else {
        toast.error("Location not found");
      }
    } catch {
      toast.error("Error searching location");
    } finally {
      setSearching(false);
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
      <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1" id="location-assist-label">Location Assist</div>
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-1 gap-2">
          <Input 
            aria-label="Address search"
            placeholder="Search address..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
            className="bg-[var(--bg-surface)] border-[var(--border)] text-sm min-h-[44px]"
          />
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleSearch}
            disabled={searching}
            aria-label="Search location by address"
            className="border-[var(--border)] min-h-[44px] min-w-[44px] px-3 shrink-0"
          >
            <Search className="w-4 h-4 text-[var(--text-muted)]" />
          </Button>
        </div>
        <Button 
          type="button" 
          variant="secondary"
          onClick={handleUseLocation}
          disabled={locating}
          aria-label="Use my current location"
          className="bg-[var(--info)]/10 text-[var(--info)] hover:bg-[var(--info)]/20 border-none min-h-[44px] flex-shrink-0 gap-2 w-full sm:w-auto"
        >
          <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse' : ''}`} />
          {locating ? "Locating..." : "Use My Location"}
        </Button>
      </div>

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
