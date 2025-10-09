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
    <header className="bg-slate-900 border-b border-slate-800 h-16 flex items-center justify-between px-4 relative z-10">
      {/* Toggle sidebar minimalista */}
      <div className="flex items-center">
        <button
          onClick={onToggleSidebar}
          className="p-2.5 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
          title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
        >
          <Menu className="h-5 w-5 text-slate-300" />
        </button>
      </div>

      {/* Perfil de usuario minimalista */}
      <div className="flex items-center">
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
          >
            <div className="bg-blue-600 rounded-xl p-2">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-slate-200">{user?.name}</p>
              <p className="text-xs text-slate-400">
                {user?.role === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown del usuario con diseño limpio */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-700/50 z-50">
              <div className="p-4 border-b border-slate-700/50">
                <p className="text-sm font-medium text-slate-100">
                  {user?.name}
                </p>
                <p className="text-sm text-slate-400">{user?.email}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {user?.role === "ADMINISTRADOR"
                    ? "Administrador del Sistema"
                    : "Vendedor"}
                </p>
              </div>
              <div className="py-2">
                <button className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/30 transition-all duration-200 rounded-lg mx-2">
                  <User className="h-4 w-4" />
                  <span>Mi Perfil</span>
                </button>
                <button className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-slate-300 hover:bg-slate-700/30 transition-all duration-200 rounded-lg mx-2">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </button>
              </div>
              <div className="border-t border-slate-700/50 py-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-all duration-200 rounded-lg mx-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar Sesión</span>
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
