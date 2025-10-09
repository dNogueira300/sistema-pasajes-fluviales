// components/reportes/reporte-diario.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  TrendingUp,
  Users,
  Ship,
  CreditCard,
  Eye,
} from "lucide-react";
import { useReportes } from "@/hooks/use-reportes";
import { ReporteDiario } from "@/types/reportes";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ReporteDiarioProps {
  className?: string;
}

export default function ReporteDiarioComponent({
  className = "",
}: ReporteDiarioProps) {
  const { generarReporteDiario, estado } = useReportes();
  const [reporte, setReporte] = useState<ReporteDiario | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [autoRefresh, setAutoRefresh] = useState(false);

  const cargarReporteDiario = useCallback(async () => {
    const resultado = await generarReporteDiario(fechaSeleccionada);
    if (resultado) {
      setReporte(resultado);
    }
  }, [generarReporteDiario, fechaSeleccionada]);

  useEffect(() => {
    cargarReporteDiario();
  }, [cargarReporteDiario]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        cargarReporteDiario();
      }, 300000); // Actualizar cada 5 minutos
    }
    return () => clearInterval(interval);
  }, [autoRefresh, cargarReporteDiario]);

  const formatearMoneda = (valor: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
      minimumFractionDigits: 2,
    }).format(valor);
  };

  return (
    <div
      className={`bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Reporte Diario
            </h3>
            <p className="text-sm text-slate-400">
              {format(
                new Date(fechaSeleccionada),
                "EEEE, dd 'de' MMMM 'de' yyyy",
                { locale: es }
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-refresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label
              htmlFor="auto-refresh"
              className="ml-2 text-sm text-slate-300"
            >
              Auto-actualizar
            </label>
          </div>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            className="px-3 py-2 border border-slate-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 text-sm"
          />
        </div>
      </div>

      {estado.generando ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-slate-300">
            Generando reporte diario...
          </span>
        </div>
      ) : reporte ? (
        <div className="space-y-6">
          {/* Resumen del día */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-600/30 p-4 rounded-xl">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-blue-400 mr-3" />
                <div>
                  <p className="text-xs text-blue-300">Ventas del día</p>
                  <p className="text-xl font-bold text-white">
                    {reporte.resumen.totalVentas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-600/30 p-4 rounded-xl">
              <div className="flex items-center">
                <CreditCard className="h-6 w-6 text-green-400 mr-3" />
                <div>
                  <p className="text-xs text-green-300">Recaudado</p>
                  <p className="text-lg font-bold text-white">
                    {formatearMoneda(reporte.resumen.totalRecaudado)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-600/30 p-4 rounded-xl">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-purple-400 mr-3" />
                <div>
                  <p className="text-xs text-purple-300">Pasajes</p>
                  <p className="text-xl font-bold text-white">
                    {reporte.resumen.totalPasajes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-600/30 p-4 rounded-xl">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-orange-400 mr-3" />
                <div>
                  <p className="text-xs text-orange-300">Promedio</p>
                  <p className="text-lg font-bold text-white">
                    {formatearMoneda(reporte.resumen.promedioVenta)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top performers del día */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top rutas del día */}
            {reporte.topRutas.length > 0 && (
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
                <h4 className="text-md font-semibold text-slate-100 mb-3 flex items-center">
                  <Ship className="h-4 w-4 mr-2 text-blue-400" />
                  Top Rutas del Día
                </h4>
                <div className="space-y-2">
                  {reporte.topRutas.map((ruta, index) => (
                    <div
                      key={ruta.rutaId}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-2">
                          {index + 1}
                        </span>
                        <span className="text-slate-300 truncate">
                          {ruta.nombreRuta}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formatearMoneda(ruta.totalRecaudado)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {ruta.totalVentas} ventas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Top vendedores del día */}
            {reporte.topVendedores.length > 0 && (
              <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
                <h4 className="text-md font-semibold text-slate-100 mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2 text-green-400" />
                  Top Vendedores del Día
                </h4>
                <div className="space-y-2">
                  {reporte.topVendedores.map((vendedor, index) => (
                    <div
                      key={vendedor.vendedorId}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center">
                        <span className="bg-green-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center mr-2">
                          {index + 1}
                        </span>
                        <span className="text-slate-300 truncate">
                          {vendedor.nombreVendedor}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-white">
                          {formatearMoneda(vendedor.totalRecaudado)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {vendedor.totalVentas} ventas
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Métodos de pago del día */}
          {reporte.metodosPago.length > 0 && (
            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
              <h4 className="text-md font-semibold text-slate-100 mb-3 flex items-center">
                <CreditCard className="h-4 w-4 mr-2 text-purple-400" />
                Métodos de Pago Utilizados
              </h4>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {reporte.metodosPago.map((metodo, index) => (
                  <div
                    key={index}
                    className="bg-slate-800/50 p-3 rounded-lg border border-slate-600/30"
                  >
                    <p className="text-xs text-slate-400">
                      {metodo.metodoPago}
                    </p>
                    <p className="text-xs text-slate-500">
                      ({metodo.tipoPago})
                    </p>
                    <p className="text-sm font-semibold text-white">
                      {formatearMoneda(metodo.totalRecaudado)}
                    </p>
                    <p className="text-xs text-slate-400">
                      {metodo.totalVentas} ventas
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Últimas ventas del día */}
          {reporte.ventasDelDia.length > 0 && (
            <div className="bg-slate-700/30 p-4 rounded-xl border border-slate-600/50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-slate-100 flex items-center">
                  <Eye className="h-4 w-4 mr-2 text-yellow-400" />
                  Últimas Ventas del Día ({reporte.ventasDelDia.length})
                </h4>
                <span className="text-xs text-slate-400">
                  Actualizado: {format(new Date(), "HH:mm")}
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {reporte.ventasDelDia.slice(0, 10).map((venta) => (
                    <div
                      key={venta.id}
                      className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg border border-slate-600/20"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-blue-400">
                            #{venta.numeroVenta}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              venta.estado === "CONFIRMADA"
                                ? "bg-green-900/30 text-green-400"
                                : venta.estado === "ANULADA"
                                ? "bg-red-900/30 text-red-400"
                                : "bg-yellow-900/30 text-yellow-400"
                            }`}
                          >
                            {venta.estado}
                          </span>
                        </div>
                        <p className="text-sm text-slate-300 truncate">
                          {venta.cliente}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {venta.ruta}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">
                          {formatearMoneda(venta.total)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {venta.metodoPago}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(venta.fechaVenta), "HH:mm")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {reporte.ventasDelDia.length > 10 && (
                  <div className="text-center mt-3">
                    <p className="text-xs text-slate-400">
                      Mostrando 10 de {reporte.ventasDelDia.length} ventas del
                      día
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Indicador de actualización automática */}
          {autoRefresh && (
            <div className="flex items-center justify-center py-2">
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <div className="animate-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>Actualizando automáticamente cada 5 minutos</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-200 mb-2">
            No hay datos para esta fecha
          </h3>
          <p className="text-slate-400">
            Selecciona una fecha diferente o verifica que haya ventas
            registradas.
          </p>
        </div>
      )}
    </div>
  );
}

// Hook para usar el reporte diario en dashboard
export function useReporteDiarioWidget() {
  const { generarReporteDiario, estado } = useReportes();
  const [reporte, setReporte] = useState<ReporteDiario | null>(null);

  const cargarReporteHoy = useCallback(async () => {
    const resultado = await generarReporteDiario();
    if (resultado) {
      setReporte(resultado);
    }
  }, [generarReporteDiario]);

  useEffect(() => {
    cargarReporteHoy();

    // Actualizar cada 10 minutos
    const interval = setInterval(cargarReporteHoy, 600000);
    return () => clearInterval(interval);
  }, [cargarReporteHoy]);

  return { reporte, loading: estado.generando, error: estado.error };
}
