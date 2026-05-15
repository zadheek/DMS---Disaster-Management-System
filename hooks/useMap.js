"use client";
import { useState, useCallback } from "react";

export function useMap() {
  const [filters, setFilters] = useState({
    alerts: true,
    roadAlerts: true,
    missingPersons: true,
    reliefCamps: true,
    donations: false,
  });

  const toggleFilter = useCallback((key) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const filterPins = useCallback((pins, activeFilters) => {
    return pins.filter(pin => {
      switch (pin.pinType) {
        case "alert": return activeFilters.alerts;
        case "roadAlert": return activeFilters.roadAlerts;
        case "missingPerson": return activeFilters.missingPersons;
        case "reliefCamp": return activeFilters.reliefCamps;
        case "donation": return activeFilters.donations;
        default: return true;
      }
    });
  }, []);

  return { filters, setFilters, toggleFilter, filterPins };
}
