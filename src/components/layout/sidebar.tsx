"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-auth";
import {
  Ship,
  Home,
  Users,
  Route,
  Anchor,
  UserPlus,
  ShoppingCart,
  Settings,
  BarChart3,
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
    name: "Clientes",
    href: "/dashboard/clientes",
    icon: Users,
    description: "Gestionar información de clientes",
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
    icon: Anchor,
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
  const { user, hasAnyRole } = useRequireAuth();

  // Filtrar navegación basada en roles
  const filteredNavigation = navigation.filter(
    (item) => !item.roles || hasAnyRole(item.roles)
  );

  return (
    <div
      className={cn(
        "bg-white shadow-lg border-r border-gray-200 h-full flex flex-col transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo y título */}
      <div className="flex items-center justify-center p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <Ship className="h-6 w-6 text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">Alto Impacto</h1>
              <p className="text-xs text-gray-500">Travel System</p>
            </div>
          )}
        </div>
      </div>

      {/* Información del usuario */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.role === "ADMINISTRADOR" ? "Administrador" : "Vendedor"}
              </p>
            </div>
          </div>
        </div>
      )}

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
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={isCollapsed ? item.description : undefined}
            >
              <Icon
                className={cn(
                  "flex-shrink-0 h-5 w-5",
                  isActive
                    ? "text-blue-600"
                    : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && isActive && (
                <div className="ml-auto">
                  <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Información adicional en la parte inferior */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-500 text-center">
            <p>Sistema v1.0.0</p>
            <p className="mt-1">TDS_G01 - 2025</p>
          </div>
        </div>
      )}
    </div>
  );
}
