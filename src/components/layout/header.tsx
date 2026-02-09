// components/layout/header.tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth";
import { Menu, User, LogOut, Settings, ChevronDown } from "lucide-react";
import Modal from "@/components/ui/Modal";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export default function Header({
  isSidebarOpen,
  onToggleSidebar,
}: HeaderProps) {
  const { user } = useRequireAuth();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  };

  // Navegación a Configuración y Gestión de Usuarios
  const handleConfiguracion = () => {
    setShowUserMenu(false);
    router.push("/dashboard/configuracion");
  };

  const handleUserPerfil = () => {
    setShowUserMenu(false);
    router.push("/dashboard/usuarios");
  };

  const handleMiPerfil = () => {
    setShowUserMenu(false);
    setShowProfileModal(true);
  };

  const profileFooterContent = (
    <div className="flex justify-end">
      <button
        onClick={() => setShowProfileModal(false)}
        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl font-medium transition-all duration-200"
      >
        Cerrar
      </button>
    </div>
  );

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 h-20 flex items-center justify-between px-6 relative z-50">
        {/* Toggle sidebar con más espacio */}
        <div className="flex items-center">
          <button
            onClick={onToggleSidebar}
            className="p-3.5 rounded-xl hover:bg-slate-800/50 transition-all duration-200"
            title={isSidebarOpen ? "Expandir menú" : "Colapsar menú"}
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
                  {user?.role === "ADMINISTRADOR"
                    ? "Administrador"
                    : user?.role === "OPERADOR_EMBARCACION"
                    ? "Operador"
                    : "Vendedor"}
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
                      : user?.role === "OPERADOR_EMBARCACION"
                      ? "Operador de Embarcación"
                      : "Vendedor"}
                  </p>
                </div>

                {/* Opciones del menú */}
                <div className="py-2">
                  <button
                    onClick={handleMiPerfil}
                    className="flex items-center space-x-4 w-full px-5 py-3.5 text-base text-slate-300 hover:bg-slate-700/30 transition-all duration-200 rounded-lg mx-2"
                  >
                    <User className="h-5 w-5" />
                    <span className="font-medium">Mi Perfil</span>
                  </button>

                  {/* Solo mostrar Configuración si es ADMINISTRADOR */}
                  {user?.role === "ADMINISTRADOR" && (
                    <button
                      onClick={handleConfiguracion}
                      className="flex items-center space-x-4 w-full px-5 py-3.5 text-base text-slate-300 hover:bg-slate-700/30 transition-all duration-200 rounded-lg mx-2"
                    >
                      <Settings className="h-5 w-5" />
                      <span className="font-medium">Configuración</span>
                    </button>
                  )}
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

      {/* Modal de Perfil */}
      <Modal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        title="Mi Perfil"
        maxWidth="2xl"
        hasChanges={false}
        footer={profileFooterContent}
      >
        <div className="p-6 space-y-6">
          {/* Información Personal */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-600/50 pb-2">
              Información Personal
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Nombre Completo
                </label>
                <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl text-slate-200">
                  {user?.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Usuario
                </label>
                <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl text-slate-200">
                  {user?.username}
                </div>
              </div>
            </div>
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-600/50 pb-2">
              Información de Contacto
            </h3>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Correo Electrónico
              </label>
              <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl text-slate-200">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Información del Sistema */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-200 border-b border-slate-600/50 pb-2">
              Información del Sistema
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Rol
                </label>
                <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                      user?.role === "ADMINISTRADOR"
                        ? "bg-purple-900/30 text-purple-300 border border-purple-700/50"
                        : user?.role === "OPERADOR_EMBARCACION"
                        ? "bg-amber-900/30 text-amber-300 border border-amber-700/50"
                        : "bg-blue-900/30 text-blue-300 border border-blue-700/50"
                    }`}
                  >
                    {user?.role === "ADMINISTRADOR"
                      ? "Administrador"
                      : user?.role === "OPERADOR_EMBARCACION"
                      ? "Operador de Embarcación"
                      : "Vendedor"}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  ID de Usuario
                </label>
                <div className="px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl text-slate-200 font-mono text-xs">
                  {user?.id}
                </div>
              </div>
            </div>
          </div>

          {/* Nota informativa */}
          <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-300 mb-1">
                  Información
                </h4>
                {user?.role === "ADMINISTRADOR" ? (
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="text-xs text-blue-200 flex-1 min-w-[200px]">
                      Diríjase al módulo de{" "}
                      <span className="font-semibold">
                        Gestión de Usuarios
                      </span>{" "}
                      si desea modificar su perfil.
                    </p>
                    <button
                      onClick={() => {
                        setShowProfileModal(false);
                        handleUserPerfil();
                      }}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-blue-100 text-xs rounded-lg font-medium transition-all duration-200 flex-shrink-0"
                    >
                      Ir a Gestión de Usuarios
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-blue-200">
                    Para modificar tu información de perfil, contacta con
                    el administrador del sistema.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
