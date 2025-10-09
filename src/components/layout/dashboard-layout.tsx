// components/layout/dashboard-layout.tsx
"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">
      {/* Sidebar sin separaciones visuales */}
      <aside className="flex-shrink-0 z-20">
        <Sidebar isCollapsed={isCollapsed} />
      </aside>

      {/* Contenido principal fluido */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header integrado sin separación */}
        <Header isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />

        {/* Contenido principal con fondo continuo */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
