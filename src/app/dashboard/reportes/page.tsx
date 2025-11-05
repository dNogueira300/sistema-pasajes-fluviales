// app/dashboard/reportes/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useReportes } from "@/hooks/use-reportes";
import { useMemo } from "react";
import {
  BarChart,
  FileText,
  TrendingUp,
  Users,
  Ship,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Printer,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import {
  FiltrosReporte,
  ReporteCompleto,
  OpcionesReporte,
  ConfiguracionExportacion,
} from "@/types/reportes";
import FiltrosReporteComponent from "@/components/reportes/filtros-reporte";
import {
  GraficoVentasPorRuta,
  GraficoVentasPorVendedor,
  GraficoMetodosPago,
  GraficoTendenciaVentas,
  GraficoEmbarcaciones,
  ExportableChart,
} from "@/components/reportes/graficos";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function PaginaReportes() {
  const { isLoading, hasRequiredRole } = useRequireAuth();

  const {
    estado,
    generarReporte,
    obtenerOpciones,
    exportarPDF,
    exportarExcel,
    limpiarError,
  } = useReportes();

  // Estados principales
  const [reporte, setReporte] = useState<ReporteCompleto | null>(null);
  const [opciones, setOpciones] = useState<OpcionesReporte | null>(null);

  // Totales calculados (solo ventas confirmadas)
  const confirmedStats = useMemo(() => {
    if (!reporte) return { count: 0, total: 0, avg: 0 };
    const confirmed = reporte.ventasDetalladas.filter((v) =>
      String(v.estado || "")
        .toUpperCase()
        .includes("CONFIRMA")
    );
    const total = confirmed.reduce((s, v) => s + (Number(v.total) || 0), 0);
    const avg = confirmed.length > 0 ? total / confirmed.length : 0;
    return { count: confirmed.length, total, avg };
  }, [reporte]);

  // Inicializar filtros con fecha de hoy en Perú
  const [filtros, setFiltros] = useState<FiltrosReporte>(() => {
    const fechaEnPeru = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Lima" })
    );
    const fechaHoy = format(fechaEnPeru, "yyyy-MM-dd");

    return {
      fechaInicio: fechaHoy,
      fechaFin: fechaHoy,
    };
  });

  const handleFiltrosChange = useCallback((nuevosFiltros: FiltrosReporte) => {
    setFiltros(nuevosFiltros);
  }, []);

  // Estados de UI
  const [vistaActiva, setVistaActiva] = useState<
    "resumen" | "graficos" | "detalles"
  >("resumen");
  const [tipoGraficoRutas, setTipoGraficoRutas] = useState<"bar" | "pie">(
    "bar"
  );
  const [reporteCargadoAutomaticamente, setReporteCargadoAutomaticamente] =
    useState(false);

  // Función para mostrar notificaciones
  const mostrarNotificacion = useCallback(
    (tipo: "success" | "error", texto: string) => {
      const notification = document.createElement("div");
      notification.className = `fixed top-4 right-4 ${
        tipo === "success"
          ? "bg-green-900/90 border border-green-700 text-green-100"
          : "bg-red-900/90 border border-red-700 text-red-100"
      } px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 z-50 backdrop-blur-sm`;

      notification.innerHTML = `
        <svg class="h-5 w-5 ${
          tipo === "success" ? "text-green-400" : "text-red-400"
        }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${
            tipo === "success"
              ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
              : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
          }
        </svg>
        <div>
          <p class="font-medium">${texto}</p>
        </div>
      `;

      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add("opacity-0", "transition-opacity");
        setTimeout(() => notification.remove(), 300);
      }, 5000);
    },
    []
  );

  // Cargar opciones para filtros
  const cargarOpciones = useCallback(async () => {
    const opcionesResult = await obtenerOpciones();
    if (opcionesResult) {
      setOpciones(opcionesResult);
    }
  }, [obtenerOpciones]);

  // Cargar opciones al montar el componente
  useEffect(() => {
    if (hasRequiredRole) {
      cargarOpciones();
    }
  }, [hasRequiredRole, cargarOpciones]);

  // Limpiar errores cuando cambian
  useEffect(() => {
    if (estado.error) {
      mostrarNotificacion("error", estado.error);
      limpiarError();
    }
  }, [estado.error, mostrarNotificacion, limpiarError]);

  // Generar reporte
  const handleGenerarReporte = useCallback(async () => {
    if (!filtros.fechaInicio || !filtros.fechaFin) {
      mostrarNotificacion(
        "error",
        "Por favor selecciona las fechas de inicio y fin"
      );
      return;
    }

    const reporteResult = await generarReporte(filtros);
    if (reporteResult) {
      setReporte(reporteResult);
      if (!reporteCargadoAutomaticamente) {
        mostrarNotificacion("success", "Reporte generado exitosamente");
      }
    }
  }, [
    filtros,
    generarReporte,
    reporteCargadoAutomaticamente,
    mostrarNotificacion,
  ]);

  // Cargar reporte del día automáticamente
  useEffect(() => {
    if (hasRequiredRole && opciones && !reporteCargadoAutomaticamente) {
      handleGenerarReporte();
      setReporteCargadoAutomaticamente(true);
    }
  }, [
    hasRequiredRole,
    opciones,
    reporteCargadoAutomaticamente,
    handleGenerarReporte,
  ]);

  // Cargar opciones al montar
  useEffect(() => {
    if (hasRequiredRole) {
      cargarOpciones();
    }
  }, [hasRequiredRole, cargarOpciones]);

  // Limpiar errores
  useEffect(() => {
    if (estado.error) {
      mostrarNotificacion("error", estado.error);
      limpiarError();
    }
  }, [estado.error, mostrarNotificacion, limpiarError]);

  // Exportar a PDF
  const handleExportarPDF = async () => {
    if (!reporte) {
      mostrarNotificacion("error", "Primero genera un reporte");
      return;
    }

    const configuracion: ConfiguracionExportacion = {
      formato: "PDF",
      incluirGraficos: true,
      incluirDetalles: true,
      orientacion: "portrait",
    };

    const resultado = await exportarPDF(reporte, configuracion);
    if (resultado) {
      mostrarNotificacion("success", "PDF exportado exitosamente");
    }
  };

  // Exportar a Excel
  const handleExportarExcel = async () => {
    if (!reporte) {
      mostrarNotificacion("error", "Primero genera un reporte");
      return;
    }

    const configuracion: ConfiguracionExportacion = {
      formato: "EXCEL",
      incluirGraficos: false,
      incluirDetalles: true,
    };

    const resultado = await exportarExcel(reporte, configuracion);
    if (resultado) {
      mostrarNotificacion("success", "Excel exportado exitosamente");
    }
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-300">Cargando reportes...</span>
      </div>
    );
  }

  // Pantalla de acceso denegado (solo para vendedores sin permisos)
  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl p-8 text-center max-w-md">
          <div className="bg-orange-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Acceso Limitado
          </h2>
          <p className="text-slate-300 mb-4">
            Los vendedores pueden ver reportes básicos. Para reportes avanzados
            contacta a tu administrador.
          </p>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full overflow-visible">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Título y descripción */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">
            Reportes y Análisis
          </h1>
          <p className="text-slate-300 mt-1">
            Genera reportes detallados y visualiza estadísticas de ventas
          </p>
        </div>

        {/* Botones de acción - responsive */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* Botones de exportación */}
          <div className="flex flex-col xs:flex-row gap-3">
            {reporte && (
              <>
                <button
                  onClick={handleExportarPDF}
                  disabled={estado.generando}
                  className="flex-1 xs:flex-none flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  PDF
                </button>
                <button
                  onClick={handleExportarExcel}
                  disabled={estado.generando}
                  className="flex-1 xs:flex-none flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </button>
              </>
            )}
          </div>

          {/* Botón principal de generar reporte */}
          <button
            onClick={() => {
              setReporteCargadoAutomaticamente(false);
              handleGenerarReporte();
            }}
            disabled={
              estado.generando || !filtros.fechaInicio || !filtros.fechaFin
            }
            className="flex-1 sm:flex-none group bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-6 py-3 rounded-xl flex items-center justify-center space-x-3 font-medium shadow-lg hover:shadow-2xl transition-all duration-200 ease-out border-2 border-blue-600 hover:border-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {estado.generando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generando...</span>
              </>
            ) : (
              <>
                <div className="bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700 p-1.5 rounded-lg transition-colors duration-200">
                  <BarChart className="h-4 w-4" />
                </div>
                <span className="whitespace-nowrap">Actualizar Reporte</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Barra de progreso */}
      {estado.generando && estado.progreso > 0 && (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-600/50 relative z-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Generando reporte...</span>
            <span className="text-sm text-blue-400">{estado.progreso}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${estado.progreso}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Filtros */}
      {opciones && (
        <FiltrosReporteComponent
          filtros={filtros}
          opciones={opciones}
          onFiltrosChange={handleFiltrosChange}
          loading={estado.generando}
        />
      )}

      {/* Contenido del reporte */}
      {reporte && (
        <>
          {/* Navegación de vistas */}
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50 p-6 relative z-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {/* Navegación de vistas - responsive */}
              <div className="flex justify-center sm:justify-start">
                <div className="flex space-x-1 bg-slate-700/50 rounded-xl p-1">
                  <button
                    onClick={() => setVistaActiva("resumen")}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center ${
                      vistaActiva === "resumen"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                    }`}
                  >
                    <FileText className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="whitespace-nowrap">Resumen</span>
                  </button>
                  <button
                    onClick={() => setVistaActiva("graficos")}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center ${
                      vistaActiva === "graficos"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                    }`}
                  >
                    <BarChart className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="whitespace-nowrap">Gráficos</span>
                  </button>
                  <button
                    onClick={() => setVistaActiva("detalles")}
                    className={`px-3 sm:px-4 py-2 rounded-lg transition-all flex items-center ${
                      vistaActiva === "detalles"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "text-slate-300 hover:text-white hover:bg-slate-600/50"
                    }`}
                  >
                    <Eye className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="whitespace-nowrap">Detalles</span>
                  </button>
                </div>
              </div>

              {/* Fecha de generación - responsive */}
              <div className="text-center sm:text-right">
                <div className="text-sm text-slate-400 whitespace-nowrap">
                  Generado:{" "}
                  {format(
                    new Date(reporte.fechaGeneracion),
                    "dd/MM/yyyy HH:mm",
                    {
                      locale: es,
                    }
                  )}
                </div>
              </div>
            </div>

            {/* Vista de Resumen */}
            {vistaActiva === "resumen" && (
              <div className="space-y-6">
                {/* Estadísticas principales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/10 border border-blue-600/30 p-6 rounded-2xl">
                    <div className="flex items-center">
                      <div className="bg-blue-600 p-3 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-300">
                          Total Ventas
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {confirmedStats.count}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-600/20 to-green-800/10 border border-green-600/30 p-6 rounded-2xl">
                    <div className="flex items-center">
                      <div className="bg-green-600 p-3 rounded-xl">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-green-300">
                          Total Recaudado
                        </p>
                        <p className="text-2xl font-bold text-white">
                          S/ {confirmedStats.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-600/30 p-6 rounded-2xl">
                    <div className="flex items-center">
                      <div className="bg-purple-600 p-3 rounded-xl">
                        <Users className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-300">
                          Total Pasajes
                        </p>
                        <p className="text-2xl font-bold text-white">
                          {reporte.resumen.totalPasajes}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/10 border border-orange-600/30 p-6 rounded-2xl">
                    <div className="flex items-center">
                      <div className="bg-orange-600 p-3 rounded-xl">
                        <TrendingUp className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-orange-300">
                          Promedio/Venta
                        </p>
                        <p className="text-2xl font-bold text-white">
                          S/ {confirmedStats.avg.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estados de ventas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Confirmadas</p>
                        <p className="text-xl font-bold text-green-400">
                          {reporte.resumen.ventasConfirmadas}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    </div>
                  </div>
                  <div className="bg-slate-700/50 p-4 rounded-xl border border-slate-600/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Anuladas</p>
                        <p className="text-xl font-bold text-red-400">
                          {reporte.resumen.ventasAnuladas}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                  </div>
                </div>

                {/* Top performers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top rutas */}
                  <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                      <Ship className="h-5 w-5 mr-2 text-blue-400" />
                      Top 5 Rutas
                    </h3>
                    <div className="space-y-3">
                      {reporte.porRuta.slice(0, 5).map((ruta, index) => (
                        <div
                          key={ruta.rutaId}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <span className="bg-blue-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center mr-3">
                              {index + 1}
                            </span>
                            <span className="text-slate-300 text-sm">
                              {ruta.nombreRuta}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-white">
                              S/ {ruta.totalRecaudado.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {ruta.totalVentas} ventas
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top vendedores */}
                  <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-green-400" />
                      Top 5 Vendedores
                    </h3>
                    <div className="space-y-3">
                      {reporte.porVendedor
                        .slice(0, 5)
                        .map((vendedor, index) => (
                          <div
                            key={vendedor.vendedorId}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              <span className="bg-green-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center mr-3">
                                {index + 1}
                              </span>
                              <span className="text-slate-300 text-sm">
                                {vendedor.nombreVendedor}
                              </span>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-white">
                                S/ {vendedor.totalRecaudado.toFixed(2)}
                              </p>
                              <p className="text-xs text-slate-400">
                                {vendedor.totalVentas} ventas
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Vista de Gráficos */}
            {vistaActiva === "graficos" && (
              <div className="space-y-8">
                {/* Gráfico de tendencia */}
                {reporte.porFecha.length > 0 && (
                  <ExportableChart
                    chartId="tendencia-ventas"
                    title="Tendencia de Ventas"
                  >
                    <GraficoTendenciaVentas datos={reporte.porFecha} />
                  </ExportableChart>
                )}

                {/* Gráficos de distribución */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Ventas por rutas */}
                  {reporte.porRuta.length > 0 && (
                    <ExportableChart
                      chartId="ventas-rutas"
                      title="Ventas por Ruta"
                    >
                      <div className="mb-4 flex justify-end">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setTipoGraficoRutas("bar")}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              tipoGraficoRutas === "bar"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            Barras
                          </button>
                          <button
                            onClick={() => setTipoGraficoRutas("pie")}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                              tipoGraficoRutas === "pie"
                                ? "bg-blue-600 text-white"
                                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                            }`}
                          >
                            Circular
                          </button>
                        </div>
                      </div>
                      <GraficoVentasPorRuta
                        datos={reporte.porRuta}
                        tipo={tipoGraficoRutas}
                      />
                    </ExportableChart>
                  )}

                  {/* Métodos de pago */}
                  {reporte.porMetodoPago.length > 0 && (
                    <ExportableChart
                      chartId="metodos-pago"
                      title="Distribución por Método de Pago"
                    >
                      <GraficoMetodosPago datos={reporte.porMetodoPago} />
                    </ExportableChart>
                  )}
                </div>

                {/* Más gráficos */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vendedores */}
                  {reporte.porVendedor.length > 0 && (
                    <ExportableChart
                      chartId="vendedores"
                      title="Rendimiento por Vendedor"
                    >
                      <GraficoVentasPorVendedor datos={reporte.porVendedor} />
                    </ExportableChart>
                  )}

                  {/* Embarcaciones */}
                  {reporte.porEmbarcacion.length > 0 && (
                    <ExportableChart
                      chartId="embarcaciones"
                      title="Ventas por Embarcación"
                    >
                      <GraficoEmbarcaciones datos={reporte.porEmbarcacion} />
                    </ExportableChart>
                  )}
                </div>
              </div>
            )}

            {/* Vista de Detalles */}
            {vistaActiva === "detalles" && (
              <div className="space-y-6">
                {/* Detalles por ruta */}
                {reporte.porRuta.length > 0 && (
                  <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">
                      Detalle por Rutas
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-2 text-slate-300">
                              Ruta
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Ventas
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Recaudado
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Pasajes
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporte.porRuta.map((ruta) => (
                            <tr
                              key={ruta.rutaId}
                              className="border-b border-slate-700/50"
                            >
                              <td className="py-3 text-slate-200">
                                {ruta.nombreRuta}
                              </td>
                              <td className="py-3 text-right text-slate-200">
                                {ruta.totalVentas}
                              </td>
                              <td className="py-3 text-right text-green-400">
                                S/ {ruta.totalRecaudado.toFixed(2)}
                              </td>
                              <td className="py-3 text-right text-slate-200">
                                {ruta.totalPasajes}
                              </td>
                              <td className="py-3 text-right text-blue-400">
                                {ruta.porcentaje.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Detalles por vendedor */}
                {reporte.porVendedor.length > 0 && (
                  <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">
                      Detalle por Vendedores
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-2 text-slate-300">
                              Vendedor
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Ventas
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Recaudado
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Pasajes
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporte.porVendedor.map((vendedor) => (
                            <tr
                              key={vendedor.vendedorId}
                              className="border-b border-slate-700/50"
                            >
                              <td className="py-3 text-slate-200">
                                {vendedor.nombreVendedor}
                              </td>
                              <td className="py-3 text-right text-slate-200">
                                {vendedor.totalVentas}
                              </td>
                              <td className="py-3 text-right text-green-400">
                                S/ {vendedor.totalRecaudado.toFixed(2)}
                              </td>
                              <td className="py-3 text-right text-slate-200">
                                {vendedor.totalPasajes}
                              </td>
                              <td className="py-3 text-right text-blue-400">
                                {vendedor.porcentaje.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Detalles por método de pago */}
                {reporte.porMetodoPago.length > 0 && (
                  <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600/50">
                    <h3 className="text-lg font-semibold text-slate-100 mb-4">
                      Detalle por Métodos de Pago
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-600">
                            <th className="text-left py-2 text-slate-300">
                              Método
                            </th>
                            <th className="text-left py-2 text-slate-300">
                              Tipo
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Ventas
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              Recaudado
                            </th>
                            <th className="text-right py-2 text-slate-300">
                              %
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {reporte.porMetodoPago.map((metodo, index) => (
                            <tr
                              key={index}
                              className="border-b border-slate-700/50"
                            >
                              <td className="py-3 text-slate-200">
                                {metodo.metodoPago}
                              </td>
                              <td className="py-3 text-slate-200">
                                {metodo.tipoPago}
                              </td>
                              <td className="py-3 text-right text-slate-200">
                                {metodo.totalVentas}
                              </td>
                              <td className="py-3 text-right text-green-400">
                                S/ {metodo.totalRecaudado.toFixed(2)}
                              </td>
                              <td className="py-3 text-right text-blue-400">
                                {metodo.porcentaje.toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Estado vacío */}
      {!reporte && !estado.generando && (
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50 p-12 text-center relative z-0">
          <div className="bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-2">
            Genera tu primer reporte
          </h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Selecciona las fechas y filtros que necesites, luego haz clic en
            Generar Reporte para ver los análisis detallados.
          </p>
          <div className="text-sm text-slate-500">
            Los reportes se generan en tiempo real y incluyen gráficos
            interactivos
          </div>
        </div>
      )}
    </div>
  );
}
