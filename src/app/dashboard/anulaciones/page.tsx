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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Anulaciones
          </h1>
          <p className="text-gray-600">
            Registro y seguimiento de todas las anulaciones y reembolsos
          </p>
        </div>
      </div>

      {/* Estadísticas con colores de fondo suaves */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Anulaciones - Rojo suave */}
          <div className="bg-red-50 border border-red-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-red-100 p-2 rounded-lg">
                <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-red-700 truncate">
                  Total Anulaciones
                </p>
                <p className="text-lg sm:text-xl font-bold text-red-900">
                  {estadisticas.totalAnulaciones}
                </p>
                <p className="text-xs text-red-600">
                  Hoy: {estadisticas.totalAnulacionesHoy}
                </p>
              </div>
            </div>
          </div>

          {/* Reembolsos - Naranja suave */}
          <div className="bg-orange-50 border border-orange-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-orange-100 p-2 rounded-lg">
                <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-orange-700 truncate">
                  Reembolsos
                </p>
                <p className="text-lg sm:text-xl font-bold text-orange-900">
                  {estadisticas.totalReembolsos}
                </p>
                <p className="text-xs text-orange-600 truncate">
                  S/ {estadisticas.montoTotalReembolsado.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Asientos Liberados - Azul suave */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">
                  Asientos Liberados
                </p>
                <p className="text-lg sm:text-xl font-bold text-blue-900">
                  {estadisticas.asientosTotalesLiberados}
                </p>
                <p className="text-xs text-blue-600">Este mes</p>
              </div>
            </div>
          </div>

          {/* Motivo Principal - Amarillo suave */}
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-yellow-700 truncate">
                  Motivo Principal
                </p>
                <p className="text-sm font-bold text-yellow-900 truncate">
                  {estadisticas.motivosComunes[0]?.motivo || "N/A"}
                </p>
                <p className="text-xs text-yellow-600">
                  {estadisticas.motivosComunes[0]?.cantidad || 0} casos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por número de venta o cliente..."
                  value={filtros.busqueda || ""}
                  onChange={(e) =>
                    handleFiltroChange("busqueda", e.target.value)
                  }
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 w-80"
                />
              </div>
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 bg-white text-gray-700"
              >
                <Filter className="h-5 w-5 mr-2" />
                Filtros
                <ChevronDown
                  className={`h-4 w-4 ml-2 transform transition-transform ${
                    showFiltros ? "rotate-180" : ""
                  }`}
                />
              </button>
            </div>
          </div>

          {showFiltros && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaInicio || ""}
                    onChange={(e) =>
                      handleFiltroChange("fechaInicio", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={filtros.fechaFin || ""}
                    onChange={(e) =>
                      handleFiltroChange("fechaFin", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="ANULACION">Anulación</option>
                    <option value="REEMBOLSO">Reembolso</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={limpiarFiltros}
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
              <span className="ml-3 text-gray-600">
                Cargando anulaciones...
              </span>
            </div>
          ) : anulaciones.length === 0 ? (
            <div className="text-center py-12">
              <Ban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay anulaciones registradas
              </h3>
              <p className="text-gray-600">
                Las anulaciones y reembolsos aparecerán aquí.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Fecha Anulación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Venta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Viaje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Motivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Asientos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {anulaciones.map((anulacion) => (
                  <tr
                    key={anulacion.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setSelectedAnulacion(anulacion);
                      setShowDetalles(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(
                          anulacion.fechaAnulacion
                        ).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(
                          anulacion.fechaAnulacion
                        ).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{anulacion.venta?.numeroVenta || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        S/ {Number(anulacion.venta?.total || 0).toFixed(2)}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {anulacion.venta?.cliente?.nombre || "N/A"}{" "}
                        {anulacion.venta?.cliente?.apellido || ""}
                      </div>
                      <div className="text-sm text-gray-500">
                        DNI: {anulacion.venta?.cliente?.dni || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {anulacion.venta?.ruta?.nombre || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {anulacion.venta?.fechaViaje
                          ? formatearFechaViaje(anulacion.venta.fechaViaje)
                          : "N/A"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Ship className="h-3 w-3 mr-1" />
                        {anulacion.venta?.embarcacion?.nombre || "N/A"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          anulacion.tipoAnulacion === "REEMBOLSO"
                            ? "bg-orange-100 text-orange-800"
                            : "bg-red-100 text-red-800"
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
                        <div className="text-xs text-orange-600 font-medium mt-1">
                          S/ {Number(anulacion.montoReembolso).toFixed(2)}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div
                        className="text-sm text-gray-900 max-w-xs truncate"
                        title={anulacion.motivo}
                      >
                        {anulacion.motivo}
                      </div>
                      {anulacion.observaciones && (
                        <div
                          className="text-xs text-gray-500 max-w-xs truncate"
                          title={anulacion.observaciones}
                        >
                          {anulacion.observaciones}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {anulacion.usuario?.nombre}{" "}
                        {anulacion.usuario?.apellido}
                      </div>
                      <div className="text-sm text-gray-500">
                        @{anulacion.usuario?.username}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">
                        +{anulacion.asientosLiberados}
                      </div>
                      <div className="text-xs text-gray-500">liberados</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Paginación */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando{" "}
              {(pagination.currentPage - 1) * (filtros.limit || 10) + 1} a{" "}
              {Math.min(
                pagination.currentPage * (filtros.limit || 10),
                pagination.total
              )}{" "}
              de {pagination.total} resultados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  handleFiltroChange("page", pagination.currentPage - 1)
                }
                disabled={!pagination.hasPrev}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Página {pagination.currentPage} de {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  handleFiltroChange("page", pagination.currentPage + 1)
                }
                disabled={!pagination.hasNext}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detalles de Anulación */}
      {showDetalles && selectedAnulacion && (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Detalles de{" "}
                {selectedAnulacion.tipoAnulacion === "REEMBOLSO"
                  ? "Reembolso"
                  : "Anulación"}
              </h2>
              <button
                onClick={() => setShowDetalles(false)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Información de la anulación */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Información de la{" "}
                  {selectedAnulacion.tipoAnulacion === "REEMBOLSO"
                    ? "Reembolso"
                    : "Anulación"}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-700">Fecha:</span>
                    <div className="font-medium text-gray-900">
                      {new Date(
                        selectedAnulacion.fechaAnulacion
                      ).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-700">Procesado por:</span>
                    <div className="font-medium text-gray-900">
                      {selectedAnulacion.usuario?.nombre}{" "}
                      {selectedAnulacion.usuario?.apellido}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-700">Asientos liberados:</span>
                    <div className="font-medium text-green-600">
                      {selectedAnulacion.asientosLiberados}
                    </div>
                  </div>
                  {selectedAnulacion.montoReembolso && (
                    <div>
                      <span className="text-gray-700">Monto reembolsado:</span>
                      <div className="font-medium text-orange-600">
                        S/ {Number(selectedAnulacion.montoReembolso).toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Motivo y observaciones */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Motivo</h4>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedAnulacion.motivo}
                </p>
                {selectedAnulacion.observaciones && (
                  <>
                    <h4 className="font-semibold text-gray-900 mb-2 mt-4">
                      Observaciones
                    </h4>
                    <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                      {selectedAnulacion.observaciones}
                    </p>
                  </>
                )}
              </div>

              {/* Información de la venta original */}
              {selectedAnulacion.venta && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Venta Original
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-700">Número de venta:</span>
                        <div className="font-medium text-gray-900">
                          #{selectedAnulacion.venta.numeroVenta || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-700">Cliente:</span>
                        <div className="font-medium text-gray-900">
                          {selectedAnulacion.venta.cliente?.nombre || "N/A"}{" "}
                          {selectedAnulacion.venta.cliente?.apellido || ""}
                        </div>
                        <div className="text-gray-700">
                          DNI: {selectedAnulacion.venta.cliente?.dni || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-700">Total:</span>
                        <div className="font-medium text-gray-900">
                          S/{" "}
                          {Number(selectedAnulacion.venta.total || 0).toFixed(
                            2
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-700">Ruta:</span>
                        <div className="font-medium text-gray-900">
                          {selectedAnulacion.venta.ruta?.nombre || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-700">Embarcación:</span>
                        <div className="font-medium text-gray-900">
                          {selectedAnulacion.venta.embarcacion?.nombre || "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-700">Fecha de viaje:</span>
                        <div className="font-medium text-gray-900">
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

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowDetalles(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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
