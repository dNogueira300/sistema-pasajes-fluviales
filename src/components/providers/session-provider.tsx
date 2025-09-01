"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

interface SessionProviderWrapperProps {
  children: ReactNode;
}

export default function SessionProviderWrapper({
  children,
}: SessionProviderWrapperProps) {
  return (
    <SessionProvider
      // Refetch session every 5 minutes
      refetchInterval={5 * 60}
      // Refetch session when window is focused
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
}
