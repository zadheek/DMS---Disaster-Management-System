"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { LocateFixed, Maximize2 } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import MapFilters from "@/components/map/MapFilters";
import LeafletMap from "@/components/map/LeafletMap";
import { Button } from "@/components/ui/button";

export default function MapPage() {
  const [data, setData] = useState({
    alerts: [],
    roadAlerts: [],
    missingPersons: [],
    reliefCamps: [],
    donations: [],
  });
  const [filters, setFilters] = useState({
    alerts: true,
    roadAlerts: true,
    missingPersons: true,
    reliefCamps: true,
    donations: true,
  });
  const [fitSignal, setFitSignal] = useState(0);
  const [locateSignal, setLocateSignal] = useState(0);
  const [focusTarget, setFocusTarget] = useState(null);
  const [focusSignal, setFocusSignal] = useState(0);

  const fetchMapData = useCallback(async () => {
    const [alerts, roads, missing, camps, donations] = await Promise.all([
      axios.get("/api/alerts?status=ACTIVE&limit=100"),
      axios.get("/api/roads?status=ACTIVE&limit=100"),
      axios.get("/api/missing?status=MISSING&limit=100"),
      axios.get("/api/camps"),
      axios.get("/api/donations"),
    ]);

    setData({
      alerts: alerts.data?.data?.items || [],
      roadAlerts: roads.data?.data?.items || [],
      missingPersons: missing.data?.data?.items || [],
      reliefCamps: camps.data?.data || [],
      donations: donations.data?.data?.items || donations.data?.data || [],
    });
  }, []);

  useEffect(() => {
    fetchMapData().catch(() => {});
  }, [fetchMapData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // params.get() returns null when absent; Number(null)=0 which is isFinite,
    // so we must check the param exists before converting to avoid setView([0,0])
    const latStr = params.get("lat");
    const lngStr = params.get("lng");
    const lat = latStr !== null ? Number(latStr) : NaN;
    const lng = lngStr !== null ? Number(lngStr) : NaN;
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setFocusTarget({
        pinType: params.get("pinType"),
        id: params.get("id"),
        lat,
        lng,
        zoom: Number(params.get("zoom")) || 14,
      });
      setFocusSignal((value) => value + 1);
    }
  }, []);

  const pins = useMemo(() => {
    const next = [];
    if (filters.alerts) {
      next.push(...data.alerts.map((item) => ({
        id: item.id,
        pinType: "alert",
        lat: item.lat,
        lng: item.lng,
        title: item.title,
        type: item.type,
        severity: item.severity,
        description: item.description,
        data: item,
      })));
    }
    if (filters.roadAlerts) {
      next.push(...data.roadAlerts.map((item) => ({
        id: item.id,
        pinType: "roadAlert",
        lat: item.lat,
        lng: item.lng,
        title: item.roadName,
        type: "ROAD_ALERT",
        description: item.description,
        data: item,
      })));
    }
    if (filters.missingPersons) {
      next.push(...data.missingPersons.map((item) => ({
        id: item.id,
        pinType: "missingPerson",
        lat: item.lat,
        lng: item.lng,
        title: item.name,
        type: "MISSING_PERSON",
        description: item.lastSeenLocation,
        data: item,
      })));
    }
    if (filters.reliefCamps) {
      next.push(...data.reliefCamps.map((item) => ({
        id: item.id,
        pinType: "reliefCamp",
        lat: item.lat,
        lng: item.lng,
        title: item.name,
        type: "RELIEF_CAMP",
        description: item.location,
        data: item,
      })));
    }
    if (filters.donations) {
      next.push(...data.donations.map((item, index) => ({
        id: item.id,
        pinType: "donation",
        lat: 6.9271 + index * 0.04,
        lng: 79.8612 + index * 0.04,
        title: item.organizationName,
        type: "DONATION",
        description: item.description,
        data: item,
      })));
    }
    return next.filter((pin) => Number.isFinite(Number(pin.lat)) && Number.isFinite(Number(pin.lng)));
  }, [data, filters]);

  const counts = {
    alerts: data.alerts.length,
    roadAlerts: data.roadAlerts.length,
    missingPersons: data.missingPersons.length,
    reliefCamps: data.reliefCamps.length,
    donations: data.donations.length,
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Live Map">
          <Button size="icon" variant="outline" onClick={() => setLocateSignal((value) => value + 1)} title="Find my location">
            <LocateFixed className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={() => setFitSignal((value) => value + 1)} title="Fit visible pins">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </TopBar>
        <main className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_1fr]">
          <aside className="border-b border-slate-200 bg-white p-4 md:border-b-0 md:border-r" data-testid="map-filters">
            <MapFilters
              filters={filters}
              counts={counts}
              onToggle={(key) => setFilters((prev) => ({ ...prev, [key]: !prev[key] }))}
              onSetAll={(value) =>
                setFilters({
                  alerts: value,
                  roadAlerts: value,
                  missingPersons: value,
                  reliefCamps: value,
                  donations: value,
                })
              }
            />
          </aside>
          <section className="h-full min-h-[480px]">
            <LeafletMap
              pins={pins}
              fitSignal={fitSignal}
              locateSignal={locateSignal}
              focusTarget={focusTarget}
              focusSignal={focusSignal}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
