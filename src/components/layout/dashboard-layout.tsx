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
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="flex-shrink-0">
        <Sidebar isCollapsed={isCollapsed} />
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header isCollapsed={isCollapsed} onToggleSidebar={toggleSidebar} />

        {/* Contenido */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
