"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRequireAuth } from "@/hooks/use-auth";
import { Menu, User, LogOut, Settings, ChevronDown } from "lucide-react";

interface HeaderProps {
  isCollapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Header({ isCollapsed, onToggleSidebar }: HeaderProps) {
  const { user } = useRequireAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  };

  return (
    <header className="bg-gray-900 shadow-sm border-b border-gray-800 h-22 flex items-center justify-between px-6">
      {/* Lado izquierdo - Toggle y búsqueda */}
      <div className="flex items-center space-x-4">
        {/* Toggle sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <Menu className="h-5 w-5 text-gray-300" />
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {/* Separador */}
        <div className="h-8 w-px bg-gray-700"></div>

        {/* Perfil de usuario */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <div className="bg-blue-900 rounded-full p-2">
              <User className="h-4 w-4 text-blue-400" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-200">{user?.name}</p>
              <p className="text-xs text-gray-400">
                {user?.role === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {/* Dropdown del usuario */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-900 rounded-lg shadow-lg border border-gray-800 z-50">
              <div className="p-4 border-b border-gray-800">
                <p className="text-sm font-medium text-gray-200">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-400">{user?.email}</p>
              </div>
              <div className="py-2">
                <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
                  <User className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </button>
                <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-800">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </button>
              </div>
              <div className="border-t border-gray-800 py-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-800"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlays para cerrar dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
