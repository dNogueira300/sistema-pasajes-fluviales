// src/app/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useDashboardAccess } from "@/hooks/use-dashboard-access";
import NuevaVentaForm from "@/components/ventas/nueva-venta-form";
import {
  Plus,
  X,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  UserCheck,
  UserX,
  Globe,
  Calendar,
  Activity,
  BarChart3,
  PieChart,
  Eye,
  Ship,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface EstadisticasDashboard {
  totalVentas: number;
  ventasHoy: number;
  ventasConfirmadas: number;
  ventasAnuladas: number;
  totalRecaudado: number;
  ventasReembolsadas: number;
  totalClientes: number;
  clientesConVentas: number;
  clientesSinVentas: number;
  clientesRecientes: number;
  ventasPorMes: Array<{
    mes: string;
    ventas: number;
    ingresos: number;
  }>;
  rutasMasVendidas: Array<{
    ruta: string;
    ventas: number;
    ingresos: number;
  }>;
  ventasPorDia: Array<{
    fecha: string;
    ventas: number;
    ingresos: number;
  }>;
  ventasPorEstado: Array<{
    estado: string;
    cantidad: number;
  }>;
  ingresosPorRuta: Array<{
    ruta: string;
    ingresos: number;
    porcentaje: number;
  }>;
  tendenciaVentas: {
    actual: number;
    anterior: number;
    cambio: number;
  };
}

function calcularIngresosPorRuta(
  rutasMasVendidas: Array<{ ruta: string; ingresos: number }> | undefined,
  totalRecaudado: number
) {
  // Validación: si no hay rutas, retornar array vacío
  if (
    !rutasMasVendidas ||
    !Array.isArray(rutasMasVendidas) ||
    rutasMasVendidas.length === 0
  ) {
    return [];
  }

  const top3 = rutasMasVendidas.slice(0, 3);
  const ingresosTop3 = top3.reduce((sum, r) => sum + r.ingresos, 0);
  const otrasRutas = totalRecaudado - ingresosTop3;

  const resultado = top3.map((ruta) => ({
    ruta: ruta.ruta,
    ingresos: ruta.ingresos,
    porcentaje:
      totalRecaudado > 0
        ? Number(((ruta.ingresos / totalRecaudado) * 100).toFixed(1))
        : 0,
  }));

  if (otrasRutas > 0) {
    resultado.push({
      ruta: "Otras rutas",
      ingresos: otrasRutas,
      porcentaje:
        totalRecaudado > 0
          ? Number(((otrasRutas / totalRecaudado) * 100).toFixed(1))
          : 0,
    });
  }

  return resultado;
}

export default function DashboardPage() {
  const { hasAccess, isLoading: checkingAccess } = useDashboardAccess();
  const [showNuevaVenta, setShowNuevaVenta] = useState(false);
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vistaGrafico, setVistaGrafico] = useState<"ventas" | "ingresos">(
    "ventas"
  );

  const cargarEstadisticas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ventasResponse, clientesResponse] = await Promise.all([
        fetch("/api/dashboard/estadisticas-ventas"),
        fetch("/api/dashboard/estadisticas-clientes"),
      ]);

      if (!ventasResponse.ok) {
        throw new Error("Error al cargar estadísticas de ventas");
      }

      if (!clientesResponse.ok) {
        throw new Error("Error al cargar estadísticas de clientes");
      }

      const ventasData = await ventasResponse.json();
      const clientesData = await clientesResponse.json();

      // Log para debugging
      console.log("Datos de ventas recibidos:", ventasData);
      console.log("Datos de clientes recibidos:", clientesData);

      setEstadisticas({
        totalVentas: ventasData.totalVentas || 0,
        ventasHoy: ventasData.ventasHoy || 0,
        ventasConfirmadas: ventasData.ventasConfirmadas || 0,
        ventasAnuladas: ventasData.ventasAnuladas || 0,
        totalRecaudado: ventasData.totalRecaudado || 0,
        ventasReembolsadas: ventasData.ventasReembolsadas || 0,
        totalClientes: clientesData.totalClientes || 0,
        clientesConVentas: clientesData.clientesConVentas || 0,
        clientesSinVentas: clientesData.clientesSinVentas || 0,
        clientesRecientes: clientesData.clientesRecientes || 0,
        ventasPorMes: ventasData.ventasPorMes || [],
        ventasPorDia: ventasData.ventasPorDia || [],
        ventasPorEstado: ventasData.ventasPorEstado || [],
        rutasMasVendidas: ventasData.rutasMasVendidas || [],
        ingresosPorRuta: calcularIngresosPorRuta(
          ventasData.rutasMasVendidas,
          ventasData.totalRecaudado || 0
        ),
        tendenciaVentas: ventasData.tendenciaVentas || {
          actual: 0,
          anterior: 0,
          cambio: 0,
        },
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Error al cargar las estadísticas del dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasAccess) {
      cargarEstadisticas();
    }
  }, [hasAccess, cargarEstadisticas]);

  const handleNuevaVentaSuccess = () => {
    setShowNuevaVenta(false);
    cargarEstadisticas();
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "#475569",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 12 } },
      },
      y: {
        grid: { color: "rgba(71, 85, 105, 0.3)" },
        ticks: { color: "#64748b", font: { size: 12 } },
      },
    },
    elements: {
      line: { tension: 0.4 },
      point: { radius: 4, hoverRadius: 8 },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "#475569",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "#64748b", font: { size: 12 } },
      },
      y: {
        grid: { color: "rgba(71, 85, 105, 0.3)" },
        ticks: { color: "#64748b", font: { size: 12 } },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#cbd5e1",
          padding: 20,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(30, 41, 59, 0.9)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "#475569",
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    cutout: "60%",
  };

  if (checkingAccess || !hasAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-6 max-w-md text-center">
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-8 rounded-2xl shadow-2xl">
            <div className="flex justify-center mb-4">
              <div className="bg-blue-600 p-4 rounded-xl">
                <Ship className="h-12 w-12 text-white animate-pulse" />
              </div>
            </div>
            {checkingAccess ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-slate-300 text-lg">
                  Verificando permisos de administrador...
                </p>
              </>
            ) : (
              <>
                <div className="bg-yellow-600/20 p-3 rounded-xl mb-4">
                  <Activity className="h-8 w-8 text-yellow-400 mx-auto" />
                </div>
                <p className="text-slate-300 text-lg">
                  Redirigiendo al módulo de ventas...
                </p>
                <p className="text-slate-400 text-sm mt-2">
                  No tienes permisos para acceder al dashboard principal
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-400">
            Cargando estadísticas del dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-red-900/20 border border-red-600/50 rounded-2xl p-8 max-w-md text-center">
          <div className="bg-red-600 p-4 rounded-xl w-fit mx-auto mb-4">
            <X className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">
            Error al cargar estadísticas
          </h2>
          <p className="text-slate-300 mb-4">{error}</p>
          <button
            onClick={cargarEstadisticas}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            ¡Bienvenido Administrador!
          </h1>
          <p className="text-slate-300 mt-1">
            Panel principal del sistema de ventas fluviales
          </p>
          <div className="flex items-center mt-2 text-sm text-slate-400">
            <Calendar className="h-4 w-4 mr-2" />
            {new Date().toLocaleDateString("es-PE", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <button
          onClick={() => setShowNuevaVenta(true)}
          className="group bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-xl flex items-center space-x-3 font-medium shadow-lg hover:shadow-2xl transition-all duration-200 ease-out border-2 border-blue-600 hover:border-blue-700 w-full sm:w-auto justify-center sm:justify-start touch-manipulation hover:-translate-y-1 active:translate-y-0 active:shadow-lg hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 hover:ring-offset-slate-800"
        >
          <div className="bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700 p-1.5 rounded-lg transition-colors duration-200">
            <Plus className="h-4 w-4" />
          </div>
          <span>Nueva Venta</span>
          <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>

      {estadisticas && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 lg:gap-6">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
              <div className="relative flex items-center">
                <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                  <Activity className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                    Ventas Hoy
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-100">
                    {estadisticas.ventasHoy}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-yellow-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent"></div>
              <div className="relative flex items-center">
                <div className="bg-yellow-600 p-3 rounded-xl shadow-lg">
                  <DollarSign className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                    Recaudado
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-100">
                    S/{" "}
                    {estadisticas.totalRecaudado?.toLocaleString("es-PE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  {/* {estadisticas.tendenciaVentas && (
                    <div className="flex items-center text-xs text-yellow-400">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      <span>
                        {estadisticas.tendenciaVentas.cambio > 0 ? "+" : ""}
                        {estadisticas.tendenciaVentas.cambio}% este mes
                      </span>
                    </div>
                  )} */}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
              <div className="relative flex items-center">
                <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                  <ShoppingCart className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                    Total Ventas
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-100">
                    {estadisticas.totalVentas}
                  </p>
                  <p className="text-xs text-blue-400">
                    {estadisticas.totalVentas > 0
                      ? Math.round(
                          (estadisticas.ventasConfirmadas /
                            estadisticas.totalVentas) *
                            100
                        )
                      : 0}
                    % confirmadas
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
              <div className="relative flex items-center">
                <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                    Clientes
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-100">
                    {estadisticas.totalClientes}
                  </p>
                  <p className="text-xs text-purple-400">
                    +{estadisticas.clientesRecientes} nuevos
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-emerald-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 to-transparent"></div>
              <div className="relative flex items-center">
                <div className="bg-emerald-600 p-3 rounded-xl shadow-lg">
                  <UserCheck className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                    Confirmadas
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-100">
                    {estadisticas.ventasConfirmadas}
                  </p>
                  <p className="text-xs text-emerald-400">
                    {estadisticas.totalVentas > 0
                      ? Math.round(
                          (estadisticas.ventasConfirmadas /
                            estadisticas.totalVentas) *
                            100
                        )
                      : 0}
                    % del total
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-red-500 hover:ring-offset-2 hover:ring-offset-slate-900 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
              <div className="relative flex items-center">
                <div className="bg-red-600 p-3 rounded-xl shadow-lg">
                  <UserX className="h-6 w-6 text-white flex-shrink-0" />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                    Anuladas
                  </p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-100">
                    {estadisticas.ventasAnuladas}
                  </p>
                  <p className="text-xs text-red-400">
                    {estadisticas.totalVentas > 0
                      ? Math.round(
                          (estadisticas.ventasAnuladas /
                            estadisticas.totalVentas) *
                            100
                        )
                      : 0}
                    % del total
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Ventas Semanales
                    </h3>
                    <p className="text-sm text-slate-400">Últimos 7 días</p>
                  </div>
                </div>
                <div className="flex bg-slate-700/50 rounded-lg p-1">
                  <button
                    onClick={() => setVistaGrafico("ventas")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      vistaGrafico === "ventas"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Ventas
                  </button>
                  <button
                    onClick={() => setVistaGrafico("ingresos")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      vistaGrafico === "ingresos"
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:text-white"
                    }`}
                  >
                    Ingresos
                  </button>
                </div>
              </div>
              <div className="h-80">
                <Line
                  data={{
                    labels: estadisticas.ventasPorDia.map((item) => item.fecha),
                    datasets: [
                      {
                        data:
                          vistaGrafico === "ventas"
                            ? estadisticas.ventasPorDia.map(
                                (item) => item.ventas
                              )
                            : estadisticas.ventasPorDia.map(
                                (item) => item.ingresos
                              ),
                        borderColor: "#3b82f6",
                        backgroundColor: "rgba(59, 130, 246, 0.1)",
                        fill: true,
                        borderWidth: 3,
                        pointBackgroundColor: "#3b82f6",
                        pointBorderColor: "#1e40af",
                        pointBorderWidth: 2,
                      },
                    ],
                  }}
                  options={lineChartOptions}
                />
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-green-600 p-2 rounded-lg mr-3">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Estados de Ventas
                    </h3>
                    <p className="text-sm text-slate-400">
                      Distribución actual
                    </p>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <Doughnut
                  data={{
                    labels: estadisticas.ventasPorEstado.map(
                      (item) => item.estado
                    ),
                    datasets: [
                      {
                        data: estadisticas.ventasPorEstado.map(
                          (item) => item.cantidad
                        ),
                        backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
                        borderColor: ["#047857", "#dc2626", "#d97706"],
                        borderWidth: 2,
                      },
                    ],
                  }}
                  options={doughnutOptions}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-purple-600 p-2 rounded-lg mr-3">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Tendencia Mensual
                    </h3>
                    <p className="text-sm text-slate-400">Últimos 6 meses</p>
                  </div>
                </div>
              </div>
              <div className="h-80">
                <Bar
                  data={{
                    labels: estadisticas.ventasPorMes.map((item) => item.mes),
                    datasets: [
                      {
                        data: estadisticas.ventasPorMes.map(
                          (item) => item.ventas
                        ),
                        backgroundColor: "rgba(147, 51, 234, 0.8)",
                        borderColor: "#7c3aed",
                        borderWidth: 2,
                        borderRadius: 6,
                      },
                    ],
                  }}
                  options={barChartOptions}
                />
              </div>
            </div>

            <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                    <Globe className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-100">
                      Rutas Populares
                    </h3>
                    <p className="text-sm text-slate-400">Top 5 más vendidas</p>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-lg transition-colors">
                  <Eye className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4">
                {estadisticas.rutasMasVendidas.length > 0 ? (
                  estadisticas.rutasMasVendidas.map((ruta, index) => {
                    const colors = [
                      "bg-gradient-to-r from-blue-500 to-blue-600",
                      "bg-gradient-to-r from-green-500 to-green-600",
                      "bg-gradient-to-r from-purple-500 to-purple-600",
                      "bg-gradient-to-r from-yellow-500 to-yellow-600",
                      "bg-gradient-to-r from-red-500 to-red-600",
                    ];
                    const maxVentas = Math.max(
                      ...estadisticas.rutasMasVendidas.map((r) => r.ventas)
                    );
                    const percentage =
                      maxVentas > 0 ? (ruta.ventas / maxVentas) * 100 : 0;

                    return (
                      <div
                        key={index}
                        className="group hover:bg-slate-700/30 p-3 rounded-lg transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-slate-300 text-sm font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <span className="text-slate-200 font-medium text-sm block">
                                {ruta.ruta}
                              </span>
                              <span className="text-slate-400 text-xs">
                                S/ {ruta.ingresos.toLocaleString("es-PE")}{" "}
                                recaudados
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-slate-200 font-semibold text-sm">
                              {ruta.ventas}
                            </div>
                            <div className="text-slate-400 text-xs">ventas</div>
                          </div>
                        </div>
                        <div className="bg-slate-700/50 rounded-full h-2">
                          <div
                            className={`${colors[index]} h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden`}
                            style={{ width: `${percentage}%` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20"></div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Globe className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay datos de rutas disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {showNuevaVenta && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-2xl border border-slate-600/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50 sticky top-0 bg-slate-800/95 backdrop-blur-md z-10">
              <div className="flex items-center">
                <div className="bg-blue-600 p-2 rounded-lg mr-3">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-slate-100">
                  Nueva Venta
                </h2>
              </div>
              <button
                onClick={() => setShowNuevaVenta(false)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <NuevaVentaForm onSuccess={handleNuevaVentaSuccess} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
