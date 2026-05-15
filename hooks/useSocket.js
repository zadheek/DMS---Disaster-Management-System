"use client";
import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

/**
 * Subscribe to a Socket.io event and call handler when it fires.
 * Automatically cleans up on unmount.
 * @param {string} event - Socket event name
 * @param {Function} handler - Callback function
 */
export function useSocket(event, handler) {
  useEffect(() => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, [event, handler]);
}
