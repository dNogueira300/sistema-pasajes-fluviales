// components/layout/dashboard-layout.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true); // Asumir móvil por defecto

  // Configurar el estado inicial del sidebar basado en el tamaño de pantalla
  useEffect(() => {
    const checkDevice = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      // En móvil: sidebar cerrado por defecto
      // En desktop: sidebar abierto por defecto
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Verificar al montar el componente
    checkDevice();

    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">
      {/* Solo renderizar Sidebar si no es móvil O si está abierto en móvil */}
      {(isSidebarOpen || !isMobile) && (
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
