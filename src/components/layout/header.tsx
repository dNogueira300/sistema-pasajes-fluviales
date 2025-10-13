// components/layout/header.tsx
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

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 h-20 flex items-center justify-between px-6 relative z-10">
      {/* Toggle sidebar con más espacio */}
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-3.5 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <Menu className="h-6 w-6 text-slate-300" />
        </button>
      </div>

      {/* Perfil de usuario con más espacio */}
      <div className="flex items-center">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-4 p-3 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
          >
            <div className="bg-blue-600 rounded-xl p-2.5">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-base font-semibold text-slate-200">
                {user?.name}
              </p>
              <p className="text-sm text-slate-400">
                {user?.role === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown del usuario con diseño más amplio */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 z-50">
              {/* Información del usuario */}
              <div className="p-5 border-b border-slate-700/50">
                <p className="text-base font-semibold text-slate-100">
                  {user?.name}
                </p>
                <p className="text-sm text-slate-400 mt-1">{user?.email}</p>
                <p className="text-sm text-slate-500 mt-2">
                  {user?.role === "ADMINISTRADOR"
                    ? "Administrador del Sistema"
                    : "Vendedor"}
                </p>
              </div>

              {/* Opciones del menú */}
              <div className="py-2">
                <button className="flex items-center space-x-4 w-full px-5 py-3.5 text-base text-slate-300 hover:bg-slate-700/30 transition-all duration-200 rounded-lg mx-2">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Mi Perfil</span>
                </button>
                <button className="flex items-center space-x-4 w-full px-5 py-3.5 text-base text-slate-300 hover:bg-slate-700/30 transition-all duration-200 rounded-lg mx-2">
                  <Settings className="h-5 w-5" />
                  <span className="font-medium">Configuración</span>
                </button>
              </div>

              {/* Cerrar sesión */}
              <div className="border-t border-slate-700/50 py-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-4 w-full px-5 py-3.5 text-base text-red-400 hover:bg-red-900/20 transition-all duration-200 rounded-lg mx-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-semibold">Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay para cerrar dropdown */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}
