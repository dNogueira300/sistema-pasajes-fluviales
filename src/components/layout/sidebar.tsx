// components/layout/sidebar.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth";
import {
  Ship,
  Home,
  Users,
  Route,
  UserPlus,
  ShoppingCart,
  Settings,
  BarChart3,
  Ban,
  MapPin,
  ClipboardCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  description?: string;
}

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    roles: ["ADMINISTRADOR"],
    description: "Resumen general del sistema",
  },
  {
    name: "Ventas",
    href: "/dashboard/ventas",
    icon: ShoppingCart,
    roles: ["ADMINISTRADOR", "VENDEDOR"],
    description: "Gestionar venta de pasajes",
  },
  {
    name: "Anulaciones",
    href: "/dashboard/anulaciones",
    icon: Ban,
    roles: ["ADMINISTRADOR"],
    description: "Gestionar anulaciones y reembolsos",
  },
  {
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    roles: ["ADMINISTRADOR", "VENDEDOR"],
    description: "Gestionar información de clientes",
  },
  {
    name: "Puertos de Embarque",
    href: "/dashboard/puertos",
    icon: MapPin,
    roles: ["ADMINISTRADOR"],
    description: "Gestión de puertos de embarque",
  },
  {
    name: "Rutas",
    href: "/dashboard/rutas",
    icon: Route,
    roles: ["ADMINISTRADOR"],
    description: "Administrar rutas de navegación",
  },
  {
    name: "Embarcaciones",
    href: "/dashboard/embarcaciones",
    icon: Ship,
    roles: ["ADMINISTRADOR"],
    description: "Gestionar embarcaciones",
  },
  {
    name: "Usuarios",
    href: "/dashboard/usuarios",
    icon: UserPlus,
    roles: ["ADMINISTRADOR"],
    description: "Administrar usuarios y operadores",
  },
  {
    name: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart3,
    roles: ["ADMINISTRADOR"],
    description: "Reportes y estadísticas",
  },
  {
    name: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
    roles: ["ADMINISTRADOR"],
    description: "Configuraciones del sistema",
  },
  {
    name: "Control de Embarque",
    href: "/dashboard/control-embarque",
    icon: ClipboardCheck,
    roles: ["OPERADOR_EMBARCACION"],
    description: "Control de embarque y desembarque",
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { hasAnyRole } = useRequireAuth();
  const [isMobile, setIsMobile] = useState(false);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Cerrar sidebar al hacer clic en un link (solo en móvil)
  const handleLinkClick = () => {
    if (isMobile && isOpen) {
      onClose();
    }
  };

  // Filtrar navegación basada en roles
  const filteredNavigation = navigation.filter(
    (item) => !item.roles || hasAnyRole(item.roles),
  );

  return (
    <>
      {/* Overlay - Solo en móvil y cuando está abierto */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-slate-900 border-r border-slate-800 h-full flex flex-col transition-all duration-300",
          // En móvil: drawer con posición fija
          isMobile
            ? cn(
                "fixed top-0 left-0 z-50 w-64",
                isOpen ? "translate-x-0" : "-translate-x-full",
              )
            : // En desktop: comportamiento normal con collapse
              cn("relative", isOpen ? "w-64" : "w-16"),
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo centrado verticalmente con ícono arriba */}
          <div className="flex flex-col items-center justify-center py-8 px-2">
            {/* Ícono del barco */}
            <div
              className={cn(
                "bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 transition-all duration-300",
                isMobile || isOpen
                  ? "p-4 mb-4 rounded-2xl"
                  : "p-2 mb-2 rounded-lg",
              )}
            >
              <Ship
                className={cn(
                  "text-white transition-all duration-300",
                  isMobile || isOpen ? "h-10 w-10" : "h-6 w-6",
                )}
              />
            </div>

            {/* Título debajo del ícono */}
            {(isMobile || isOpen) && (
              <div className="text-center">
                <h1 className="text-xl font-bold text-slate-100 leading-tight">
                  Alto Impacto
                </h1>
                <h2 className="text-xl font-bold text-blue-400 leading-tight">
                  Travel
                </h2>
              </div>
            )}
          </div>

          {/* Navegación */}
          <nav className="flex-1 px-3 pb-4 space-y-2 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "flex items-center relative group",
                    isMobile || isOpen ? "space-x-3" : "justify-center",
                    "px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200",
                    isActive
                      ? "bg-blue-600/20 text-blue-300 shadow-lg shadow-blue-600/10"
                      : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100",
                  )}
                  title={!isMobile && !isOpen ? item.description : undefined}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 h-6 w-6",
                      isActive
                        ? "text-blue-400"
                        : "text-slate-400 group-hover:text-slate-200",
                    )}
                  />
                  {(isMobile || isOpen) && (
                    <span className="truncate text-base">{item.name}</span>
                  )}
                  {(isMobile || isOpen) && isActive && (
                    <div className="ml-auto">
                      <div className="h-2.5 w-2.5 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Información inferior */}
          {(isMobile || isOpen) && (
            <div className="px-4 pb-4">
              <div className="text-sm text-slate-500 text-center space-y-1">
                <p className="font-semibold">Sistema v1.0.0</p>
                <p className="text-xs">
                  © {new Date().getFullYear()} Alto Impacto Travel
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
