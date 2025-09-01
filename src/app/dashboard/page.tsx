"use client";

import { useRequireAuth } from "@/hooks/use-auth";
import {
  Users,
  Ship,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  Clock,
  AlertTriangle,
  Plus,
  Eye,
} from "lucide-react";

// Componente para las tarjetas de estadísticas
function StatsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  color = "blue",
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "increase" | "decrease";
  icon: React.ComponentType<{ className?: string }>;
  color?: "blue" | "green" | "yellow" | "red";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
    red: "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm flex items-center mt-2 ${
                changeType === "increase" ? "text-green-600" : "text-red-600"
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

// Componente para las ventas recientes
function RecentSales() {
  const recentSales = [
    {
      id: "V-001",
      cliente: "Juan Pérez García",
      ruta: "Iquitos → Yurimaguas",
      fecha: "2025-01-15",
      total: "S/ 45.00",
      estado: "Confirmada",
    },
    {
      id: "V-002",
      cliente: "María Rodríguez Silva",
      ruta: "Yurimaguas → Tarapoto",
      fecha: "2025-01-15",
      total: "S/ 25.00",
      estado: "Confirmada",
    },
    {
      id: "V-003",
      cliente: "Carlos Mendoza López",
      ruta: "Iquitos → Pucallpa",
      fecha: "2025-01-14",
      total: "S/ 65.00",
      estado: "Confirmada",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Ventas Recientes
          </h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center">
            <Eye className="h-4 w-4 mr-1" />
            Ver todas
          </button>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {recentSales.map((sale) => (
            <div
              key={sale.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-900">
                    {sale.cliente}
                  </p>
                  <span className="text-sm text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    {sale.estado}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {sale.ruta}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {sale.fecha}
                  </span>
                  <span className="font-semibold text-gray-900">
                    {sale.total}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente para próximos viajes
function UpcomingTrips() {
  const upcomingTrips = [
    {
      embarcacion: "Amazonas Express",
      ruta: "Iquitos → Yurimaguas",
      hora: "06:00",
      fecha: "Mañana",
      pasajeros: 12,
      capacidad: 50,
    },
    {
      embarcacion: "Rio Veloz",
      ruta: "Yurimaguas → Tarapoto",
      hora: "08:00",
      fecha: "Mañana",
      pasajeros: 8,
      capacidad: 30,
    },
    {
      embarcacion: "Ucayali Navigator",
      ruta: "Iquitos → Pucallpa",
      hora: "07:00",
      fecha: "Sábado",
      pasajeros: 25,
      capacidad: 80,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Próximos Viajes</h3>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {upcomingTrips.map((trip, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {trip.embarcacion}
                  </h4>
                  <span className="text-sm text-gray-600">{trip.fecha}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 space-x-4">
                  <span className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {trip.ruta}
                  </span>
                  <span className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {trip.hora}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Pasajeros: {trip.pasajeros}/{trip.capacidad}
                    </span>
                    <span className="text-gray-600">
                      {Math.round((trip.pasajeros / trip.capacidad) * 100)}%
                      ocupado
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(trip.pasajeros / trip.capacidad) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useRequireAuth();

  // Datos simulados (en producción vendrían de la API)
  const stats = [
    {
      title: "Ventas Hoy",
      value: "12",
      change: "+15% vs ayer",
      changeType: "increase" as const,
      icon: TrendingUp,
      color: "green" as const,
    },
    {
      title: "Ingresos Hoy",
      value: "S/ 1,240",
      change: "+8.2% vs ayer",
      changeType: "increase" as const,
      icon: DollarSign,
      color: "blue" as const,
    },
    {
      title: "Clientes Activos",
      value: "156",
      change: "+5 nuevos",
      changeType: "increase" as const,
      icon: Users,
      color: "yellow" as const,
    },
    {
      title: "Embarcaciones",
      value: isAdmin ? "3" : "N/A",
      change: isAdmin ? "2 activas" : undefined,
      icon: Ship,
      color: "red" as const,
    },
  ];

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Buenos días"
      : currentHour < 18
      ? "Buenas tardes"
      : "Buenas noches";

  return (
    <div className="space-y-6">
      {/* Header de bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {greeting}, {user?.name?.split(" ")[0]} 👋
        </h1>
        <p className="text-blue-100">
          {user?.role === "ADMINISTRADOR"
            ? "Aquí tienes un resumen completo de tu negocio"
            : "Listo para gestionar las ventas de hoy"}
        </p>
        <div className="mt-4 flex items-center space-x-4">
          <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </button>
          <span className="text-blue-100 text-sm">
            Hoy es{" "}
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            changeType={stat.changeType}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Contenido principal en dos columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas recientes */}
        <RecentSales />

        {/* Próximos viajes */}
        <UpcomingTrips />
      </div>

      {/* Alertas y notificaciones importantes */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
          <div>
            <h3 className="text-sm font-semibold text-yellow-800">
              Recordatorios Importantes
            </h3>
            <ul className="text-sm text-yellow-700 mt-2 space-y-1">
              <li>
                • La embarcación Amazonas Express tiene mantenimiento programado
                para el próximo lunes
              </li>
              <li>
                • Revisar disponibilidad de asientos para el fin de semana
              </li>
              <li>• Actualizar precios de temporada alta si es necesario</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
