"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { getSocket } from "@/lib/socket";

const BroadcastContext = createContext({ broadcasts: [] });

export function BroadcastProvider({ children }) {
  const [broadcasts, setBroadcasts] = useState([]);

  const fetchBroadcasts = useCallback(async () => {
    try {
      const res = await axios.get("/api/broadcast");
      if (res.data.success) {
        setBroadcasts(res.data.data.filter((b) => b.isActive));
      }
    } catch {
      // Non-critical — broadcasts may not be seeded yet
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
    const socket = getSocket();
    socket.on("broadcast:message", fetchBroadcasts);
    socket.on("broadcasts:updated", fetchBroadcasts);
    return () => {
      socket.off("broadcast:message", fetchBroadcasts);
      socket.off("broadcasts:updated", fetchBroadcasts);
    };
  }, [fetchBroadcasts]);

  return (
    <BroadcastContext.Provider value={{ broadcasts }}>
      {children}
    </BroadcastContext.Provider>
  );
}

export function useBroadcasts() {
  return useContext(BroadcastContext);
}
