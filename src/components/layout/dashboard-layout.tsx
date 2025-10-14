// components/layout/dashboard-layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">
      {/* Sidebar con comportamiento drawer en móvil */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Contenido principal fluido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header integrado sin separación */}
        <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />

        {/* Contenido principal con fondo continuo */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
