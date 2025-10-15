// src/app/dashboard/anulaciones/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useAnulaciones } from "@/hooks/use-anulaciones";
import {
  Anulacion,
  FiltrosAnulaciones,
  EstadisticasAnulaciones,
} from "@/types";
import { formatearFechaViaje } from "@/lib/utils/fecha-utils";
import {
  Search,
  Filter,
  Calendar,
  AlertTriangle,
  TrendingDown,
  Users,
  RefreshCw,
  Ban,
  ChevronDown,
  Ship,
  X,
} from "lucide-react";

export default function AnulacionesPage() {
  useRequireAuth();
  const { obtenerAnulaciones, obtenerEstadisticas } = useAnulaciones();

  const [anulaciones, setAnulaciones] = useState<Anulacion[]>([]);
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasAnulaciones | null>(null);
  const [loading, setLoading] = useState(false);
  const [showFiltros, setShowFiltros] = useState(false);
  const [selectedAnulacion, setSelectedAnulacion] = useState<Anulacion | null>(
    null
  );
  const [showDetalles, setShowDetalles] = useState(false);

  const [filtros, setFiltros] = useState<FiltrosAnulaciones>({
    fechaInicio: "",
    fechaFin: "",
    tipoAnulacion: undefined,
    busqueda: "",
    page: 1,
    limit: 10,
  });

  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false,
  });

  // Cargar anulaciones
  const cargarAnulaciones = useCallback(async () => {
    setLoading(true);
    try {
      const resultado = await obtenerAnulaciones(filtros);
      if (resultado) {
        setAnulaciones(resultado.anulaciones);
        setPagination(resultado.pagination);
      }
    } catch (error) {
      console.error("Error cargando anulaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [filtros, obtenerAnulaciones]);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const stats = await obtenerEstadisticas("mes");
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, [obtenerEstadisticas]);

  useEffect(() => {
    cargarAnulaciones();
  }, [cargarAnulaciones]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const handleFiltroChange = (
    key: keyof FiltrosAnulaciones,
    value: string | number | undefined
  ) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : (value as number), // Reset page unless we're changing page
    }));
  };

  const limpiarFiltros = () => {
    setFiltros({
      fechaInicio: "",
      fechaFin: "",
      tipoAnulacion: undefined,
      busqueda: "",
      page: 1,
      limit: 10,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            Gestión de Anulaciones
          </h1>
          <p className="text-slate-300">
            Registro y seguimiento de todas las anulaciones y reembolsos
          </p>
        </div>
      </div>

      {/* Estadísticas con tema oscuro, glassmorphism y efectos mejorados */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Anulaciones - Rojo */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-red-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-red-600 p-3 rounded-xl shadow-lg">
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Total Anulaciones
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalAnulaciones}
                </p>
                <p className="text-xs text-red-400">
                  Hoy: {estadisticas.totalAnulacionesHoy}
                </p>
              </div>
            </div>
          </div>

          {/* Reembolsos - Naranja */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-orange-600 p-3 rounded-xl shadow-lg">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Reembolsos
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalReembolsos}
                </p>
                <p className="text-xs text-orange-400 truncate">
                  S/ {estadisticas.montoTotalReembolsado.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Asientos Liberados - Azul */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Asientos Liberados
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.asientosTotalesLiberados}
                </p>
                <p className="text-xs text-blue-400">Este mes</p>
              </div>
            </div>
          </div>

          {/* Motivo Principal - Amarillo */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-yellow-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-yellow-600 p-3 rounded-xl shadow-lg">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Motivo Principal
                </p>
                <p className="text-sm font-bold text-slate-100 truncate">
                  {estadisticas.motivosComunes[0]?.motivo || "N/A"}
                </p>
                <p className="text-xs text-yellow-400">
                  {estadisticas.motivosComunes[0]?.cantidad || 0} casos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros integrados con la tabla */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50">
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {/* Campo de búsqueda - ocupa todo el ancho en móvil */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-100 z-10" />
                <input
                  type="text"
                  placeholder="Buscar por número de venta o cliente..."
                  value={filtros.busqueda || ""}
                  onChange={(e) =>
                    handleFiltroChange("busqueda", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>
            {/* Botón para mostrar/ocultar filtros adicionales */}
            <div className="w-full sm:w-auto">
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className="flex items-center justify-center px-4 py-3 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200 sm:w-auto w-full"
              >
                <Filter className="h-5 w-5 mr-2 flex-shrink-0" />
                <span>Filtros</span>
                <ChevronDown
                  className={`h-4 w-4 ml-2 flex-shrink-0 transform transition-transform ${
                    showFiltros ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {showFiltros && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio || ""}
                    onChange={(e) =>
                      handleFiltroChange("fechaInicio", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaFin || ""}
                    onChange={(e) =>
                      handleFiltroChange("fechaFin", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo
                  </label>
                  <select
                    value={filtros.tipoAnulacion || ""}
                    onChange={(e) =>
                      handleFiltroChange(
                        "tipoAnulacion",
                        e.target.value || undefined
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="ANULACION">Anulación</option>
                    <option value="REEMBOLSO">Reembolso</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full px-6 py-3 bg-slate-600/50 text-slate-200 rounded-xl hover:bg-slate-500/50 transition-all duration-200 backdrop-blur-sm"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Lista de anulaciones */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-300">
                Cargando anulaciones...
              </span>
            </div>
          ) : anulaciones.length === 0 ? (
            <div className="text-center py-12">
              <Ban className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                No hay anulaciones registradas
              </h3>
              <p className="text-slate-400">
                Las anulaciones y reembolsos aparecerán aquí.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Fecha Anulación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Viaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Asientos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-600">
                {anulaciones.map((anulacion) => (
                  <tr
                    key={anulacion.id}
                    className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedAnulacion(anulacion);
                      setShowDetalles(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-100">
                        {new Date(
                          anulacion.fechaAnulacion
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-slate-400">
                        {new Date(
                          anulacion.fechaAnulacion
                        ).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-100">
                        #{anulacion.venta?.numeroVenta || "N/A"}
                      </div>
                      <div className="text-sm text-slate-400">
                        S/ {Number(anulacion.venta?.total || 0).toFixed(2)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-100">
                        {anulacion.venta?.cliente?.nombre || "N/A"}{" "}
                        {anulacion.venta?.cliente?.apellido || ""}
                      </div>
                      <div className="text-sm text-slate-400">
                        DNI: {anulacion.venta?.cliente?.dni || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-200">
                        {anulacion.venta?.ruta?.nombre || "N/A"}
                      </div>
                      <div className="text-sm text-slate-400 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {anulacion.venta?.fechaViaje
                          ? formatearFechaViaje(anulacion.venta.fechaViaje)
                          : "N/A"}
                      </div>
                      <div className="text-sm text-slate-400 flex items-center">
                        <Ship className="h-3 w-3 mr-1" />
                        {anulacion.venta?.embarcacion?.nombre || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium transition-all duration-200 ${
                          anulacion.tipoAnulacion === "REEMBOLSO"
                            ? "bg-orange-900/40 text-orange-300 border border-orange-700/50"
                            : "bg-red-900/40 text-red-300 border border-red-700/50"
                        }`}
                      >
                        {anulacion.tipoAnulacion === "REEMBOLSO" ? (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        ) : (
                          <Ban className="h-3 w-3 mr-1" />
                        )}
                        {anulacion.tipoAnulacion === "REEMBOLSO"
                          ? "Reembolso"
                          : "Anulación"}
                      </span>
                      {anulacion.montoReembolso && (
                        <div className="text-xs text-orange-400 font-medium mt-1">
                          S/ {Number(anulacion.montoReembolso).toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-slate-200 max-w-xs truncate"
                        title={anulacion.motivo}
                      >
                        {anulacion.motivo}
                      </div>
                      {anulacion.observaciones && (
                        <div
                          className="text-xs text-slate-400 max-w-xs truncate"
                          title={anulacion.observaciones}
                        >
                          {anulacion.observaciones}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-100">
                        {anulacion.usuario?.nombre}{" "}
                        {anulacion.usuario?.apellido}
                      </div>
                      <div className="text-sm text-slate-400">
                        @{anulacion.usuario?.username}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-400">
                        +{anulacion.asientosLiberados}
                      </div>
                      <div className="text-xs text-slate-400">liberados</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-5 border-t border-slate-600/50 flex items-center justify-between">
            <div className="text-sm text-slate-300">
              Mostrando{" "}
              {(pagination.currentPage - 1) * (filtros.limit || 10) + 1} a{" "}
              {Math.min(
                pagination.currentPage * (filtros.limit || 10),
                pagination.total
              )}{" "}
              de {pagination.total} resultados
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() =>
                  handleFiltroChange("page", pagination.currentPage - 1)
                }
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-slate-300 flex items-center">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  handleFiltroChange("page", pagination.currentPage + 1)
                }
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalles de Anulación con tema oscuro */}
      {showDetalles && selectedAnulacion && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-2xl border border-slate-600/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
              <h2 className="text-xl font-bold text-slate-100">
                Detalles de{" "}
                {selectedAnulacion.tipoAnulacion === "REEMBOLSO"
                  ? "Reembolso"
                  : "Anulación"}
              </h2>
              <button
                onClick={() => setShowDetalles(false)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información de la anulación */}
              <div className="bg-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-slate-100 mb-3">
                  Información de la{" "}
                  {selectedAnulacion.tipoAnulacion === "REEMBOLSO"
                    ? "Reembolso"
                    : "Anulación"}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-300">Fecha:</span>
                    <div className="font-medium text-slate-100">
                      {new Date(
                        selectedAnulacion.fechaAnulacion
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-300">Procesado por:</span>
                    <div className="font-medium text-slate-100">
                      {selectedAnulacion.usuario?.nombre}{" "}
                      {selectedAnulacion.usuario?.apellido}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-300">Asientos liberados:</span>
                    <div className="font-medium text-green-400">
                      {selectedAnulacion.asientosLiberados}
                    </div>
                  </div>
                  {selectedAnulacion.montoReembolso && (
                    <div>
                      <span className="text-slate-300">Monto reembolsado:</span>
                      <div className="font-medium text-orange-400">
                        S/ {Number(selectedAnulacion.montoReembolso).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo y observaciones */}
              <div>
                <h4 className="font-semibold text-slate-100 mb-2">Motivo</h4>
                <p className="text-slate-200 bg-slate-700/50 p-3 rounded-xl">
                  {selectedAnulacion.motivo}
                </p>
                {selectedAnulacion.observaciones && (
                  <>
                    <h4 className="font-semibold text-slate-100 mb-2 mt-4">
                      Observaciones
                    </h4>
                    <p className="text-slate-200 bg-slate-700/50 p-3 rounded-xl">
                      {selectedAnulacion.observaciones}
                    </p>
                  </>
                )}
              </div>

              {/* Información de la venta original */}
              {selectedAnulacion.venta && (
                <div className="border-t border-slate-600/50 pt-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">
                    Venta Original
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="text-slate-300">Ruta:</span>
                        <div className="font-medium text-slate-100">
                          {selectedAnulacion.venta.ruta?.nombre || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-300">Embarcación:</span>
                        <div className="font-medium text-slate-100">
                          {selectedAnulacion.venta.embarcacion?.nombre || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-300">Fecha de viaje:</span>
                        <div className="font-medium text-slate-100">
                          {selectedAnulacion.venta.fechaViaje
                            ? formatearFechaViaje(
                                selectedAnulacion.venta.fechaViaje
                              )
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-slate-600/50">
                <button
                  onClick={() => setShowDetalles(false)}
                  className="px-6 py-3 bg-slate-600 text-white rounded-xl hover:bg-slate-500 transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
