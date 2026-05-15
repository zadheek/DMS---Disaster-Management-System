"use client";
import { SessionProvider } from "next-auth/react";
import { SocketProvider } from "@/context/SocketContext";
import { BroadcastProvider } from "@/context/BroadcastContext";
import { Toaster } from "sonner";

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <SocketProvider>
        <BroadcastProvider>
          {children}
          <Toaster
            theme="light"
            position="bottom-right"
            richColors
            toastOptions={{
              style: {
                background: "var(--bg-surface)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                boxShadow: "0 8px 22px rgba(20, 52, 102, 0.12)",
              },
            }}
          />
        </BroadcastProvider>
      </SocketProvider>
    </SessionProvider>
  );
}
