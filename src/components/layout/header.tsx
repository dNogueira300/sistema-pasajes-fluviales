"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRequireAuth } from "@/hooks/use-auth";
import {
  Menu,
  X,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  // Simulamos algunas notificaciones
  const notifications = [
    {
      id: 1,
      title: "Nueva venta registrada",
      message: "Se registró una venta para la ruta Iquitos - Yurimaguas",
      time: "Hace 5 min",
      unread: true,
    },
    {
      id: 2,
      title: "Embarcación en mantenimiento",
      message: "Amazonas Express programado para mantenimiento",
      time: "Hace 1 hora",
      unread: true,
    },
    {
      id: 3,
      title: "Reporte diario listo",
      message: "El reporte de ventas diarias está disponible",
      time: "Hace 2 horas",
      unread: false,
    },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      {/* Lado izquierdo - Toggle y búsqueda */}
      <div className="flex items-center space-x-4">
        {/* Toggle sidebar */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {isCollapsed ? (
            <Menu className="h-5 w-5 text-gray-600" />
          ) : (
            <X className="h-5 w-5 text-gray-600" />
          )}
        </button>

        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-600" />
          </div>
          <input
            type="text"
            placeholder="Buscar clientes, rutas, ventas..."
            className="pl-9 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Lado derecho - Notificaciones y perfil */}
      <div className="flex items-center space-x-4">
        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            title="Notificaciones"
          >
            <Bell className="h-5 w-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown de notificaciones */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notificaciones
                </h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer",
                      notification.unread && "bg-blue-50"
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      {notification.unread && (
                        <div className="h-2 w-2 bg-blue-600 rounded-full ml-2"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-700">
                  Ver todas las notificaciones
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300"></div>

        {/* Perfil de usuario */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="bg-blue-100 rounded-full p-2">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">
                {user?.role === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {/* Dropdown del usuario */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {user?.name}
                </p>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>
              <div className="py-2">
                <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <User className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </button>
                <button className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </button>
              </div>
              <div className="border-t border-gray-100 py-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
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
