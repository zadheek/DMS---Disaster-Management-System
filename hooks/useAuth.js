"use client";
import { useSession } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();
  return {
    user: session?.user || null,
    isAdmin: session?.user?.role === "ADMIN",
    isLoading: status === "loading",
    isAuthenticated: !!session,
  };
}
