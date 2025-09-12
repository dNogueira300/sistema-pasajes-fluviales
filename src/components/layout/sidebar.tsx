"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth";
import {
  Ship,
  Home,
  Users,
  Route,
  //Anchor,
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
        "bg-gray-900 shadow-lg border-r border-gray-800 h-full flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo y título */}
      <div className="flex items-center justify-center p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <Ship className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="flex-shrink-0">
              <h1 className="text-lg font-bold text-white whitespace-nowrap">
                Alto Impacto Travel
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center relative",
                isCollapsed ? "justify-center" : "space-x-3",
                "px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-blue-900/50 text-blue-300 border border-blue-800"
                  : "text-gray-300 hover:bg-gray-800 hover:text-blue-200"
              )}
              title={isCollapsed ? item.description : undefined}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isActive
                    ? "text-blue-400"
                    : "text-gray-400 group-hover:text-blue-300"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && isActive && (
                <div className="ml-auto">
                  <div className="h-2 w-2 bg-blue-400 rounded-full"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Información adicional en la parte inferior */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-800 bg-gray-800">
          <div className="text-xs text-gray-400 text-center">
            <p>Sistema v1.0.0</p>
            <p>© 2025 Alto Impacto Travel</p>
          </div>
        </div>
      )}
    </div>
  );
}
