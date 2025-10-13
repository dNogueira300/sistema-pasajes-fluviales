// ============================================
// components/layout/sidebar.tsx - Diseño actualizado
// ============================================
"use client";

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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("ADMINISTRADOR" | "VENDEDOR")[];
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
    description: "Gestionar venta de pasajes",
  },
  {
    name: "Anulaciones",
    href: "/dashboard/anulaciones",
    icon: Ban,
    description: "Gestionar anulaciones y reembolsos",
  },
  {
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
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
    description: "Administrar usuarios del sistema",
  },
  {
    name: "Reportes",
    href: "/dashboard/reportes",
    icon: BarChart3,
    description: "Reportes y estadísticas",
  },
  {
    name: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
    roles: ["ADMINISTRADOR"],
    description: "Configuraciones del sistema",
  },
];

interface SidebarProps {
  isCollapsed?: boolean;
}

export default function Sidebar({ isCollapsed = false }: SidebarProps) {
  const pathname = usePathname();
  const { hasAnyRole } = useRequireAuth();

  // Filtrar navegación basada en roles
  const filteredNavigation = navigation.filter(
    (item) => !item.roles || hasAnyRole(item.roles)
  );

  return (
    <div
      className={cn(
        "bg-slate-900 border-r border-slate-800 h-full flex flex-col transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-74"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo centrado verticalmente con ícono arriba */}
        <div className="flex flex-col items-center justify-center py-8 px-4">
          {/* Ícono del barco */}
          <div className="bg-blue-600 rounded-2xl p-4 mb-4 shadow-lg shadow-blue-600/20">
            <Ship className="h-10 w-10 text-white" />
          </div>

          {/* Título debajo del ícono */}
          {!isCollapsed && (
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
                className={cn(
                  "flex items-center relative group",
                  isCollapsed ? "justify-center" : "space-x-3",
                  "px-4 py-3.5 rounded-xl text-base font-semibold transition-all duration-200",
                  isActive
                    ? "bg-blue-600/20 text-blue-300 shadow-lg shadow-blue-600/10"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-slate-100"
                )}
                title={isCollapsed ? item.description : undefined}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0 h-6 w-6",
                    isActive
                      ? "text-blue-400"
                      : "text-slate-400 group-hover:text-slate-200"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate text-base">{item.name}</span>
                )}
                {!isCollapsed && isActive && (
                  <div className="ml-auto">
                    <div className="h-2.5 w-2.5 bg-blue-400 rounded-full animate-pulse"></div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Información inferior */}
        {!isCollapsed && (
          <div className="px-4 pb-4">
            <div className="text-sm text-slate-500 text-center space-y-1">
              <p className="font-semibold">Sistema v1.0.0</p>
              <p className="text-xs">© 2025 Alto Impacto Travel</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
