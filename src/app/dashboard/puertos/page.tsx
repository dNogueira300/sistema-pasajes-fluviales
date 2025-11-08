// app/dashboard/puertos/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { usePuertos } from "@/hooks/use-puertos";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  MapPin,
  Users,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ChevronDown,
} from "lucide-react";
import {
  Puerto,
  FiltrosPuertos,
  EstadisticasPuertos,
  CrearPuertoData,
  ActualizarPuertoData,
} from "@/types";
import NuevoPuertoForm from "@/components/puertos/nuevo-puerto-form";
import EditarPuertoForm from "@/components/puertos/editar-puerto-form";

export default function GestionPuertos() {
  useRequireAuth();
  const {
    obtenerPuertos,
    crearPuerto,
    actualizarPuerto,
    eliminarPuerto,
    obtenerEstadisticas,
    cambiarEstado,
    loading,
    error,
  } = usePuertos();

  // Estados para la lista de puertos
  const [puertos, setPuertos] = useState<Puerto[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [estadisticas, setEstadisticas] = useState<EstadisticasPuertos | null>(
    null
  );

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosPuertos>({
    busqueda: "",
    activo: undefined,
    page: 1,
    limit: 10,
  });

  // Estados para modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [puertoSeleccionado, setPuertoSeleccionado] = useState<Puerto | null>(
    null
  );

  // Estados de UI
  const [showFiltros, setShowFiltros] = useState(false);

  // Función para mostrar notificaciones
  const mostrarNotificacion = (tipo: "success" | "error", texto: string) => {
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
  };

  // Cargar puertos
  const cargarPuertos = useCallback(async () => {
    try {
      const resultado = await obtenerPuertos(filtros);
      if (resultado) {
        setPuertos(resultado.puertos);
        setPagination(resultado.pagination);
      }
    } catch (error) {
      console.error("Error cargando puertos:", error);
    }
  }, [obtenerPuertos, filtros]);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const resultado = await obtenerEstadisticas();
      if (resultado) {
        setEstadisticas(resultado);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, [obtenerEstadisticas]);

  // Efectos
  useEffect(() => {
    cargarPuertos();
  }, [cargarPuertos]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Manejar cambios en filtros
  const handleFiltroChange = (
    key: keyof FiltrosPuertos,
    value: string | boolean | number | undefined
  ) => {
    setFiltros((prev) => ({
      ...prev,
      [key]: value,
      page: key !== "page" ? 1 : typeof value === "number" ? value : prev.page,
    }));
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      activo: undefined,
      page: 1,
      limit: 10,
    });
  };

  // Manejar creación de puerto
  const handleCrearPuerto = async (
    datos: CrearPuertoData
  ): Promise<boolean> => {
    const resultado = await crearPuerto(datos);
    if (resultado) {
      mostrarNotificacion("success", "¡Puerto creado correctamente!");
      cargarPuertos();
      cargarEstadisticas();
      return true;
    }
    return false;
  };

  // Manejar actualización de puerto
  const handleActualizarPuerto = async (
    id: string,
    datos: ActualizarPuertoData
  ): Promise<boolean> => {
    const resultado = await actualizarPuerto(id, datos);
    if (resultado) {
      mostrarNotificacion("success", "¡Puerto actualizado correctamente!");
      setPuertoSeleccionado(null);
      cargarPuertos();
      cargarEstadisticas();
      return true;
    }
    return false;
  };

  // Manejar editar puerto
  const abrirModalEditar = (puerto: Puerto) => {
    setPuertoSeleccionado(puerto);
    setModalEditar(true);
  };

  // Manejar eliminar puerto
  const abrirModalEliminar = (puerto: Puerto) => {
    setPuertoSeleccionado(puerto);
    setModalConfirmarEliminar(true);
  };

  // Manejar eliminación de puerto
  const handleEliminarPuerto = async () => {
    if (!puertoSeleccionado) return;

    const resultado = await eliminarPuerto(puertoSeleccionado.id);
    if (resultado) {
      mostrarNotificacion("success", "¡Puerto eliminado correctamente!");
      setModalConfirmarEliminar(false);
      setPuertoSeleccionado(null);
      cargarPuertos();
      cargarEstadisticas();
    }
  };

  // Manejar cambio de estado
  const handleCambiarEstado = async (puerto: Puerto) => {
    const resultado = await cambiarEstado(puerto.id, !puerto.activo);
    if (resultado) {
      mostrarNotificacion(
        "success",
        `Puerto ${!puerto.activo ? "activado" : "desactivado"} exitosamente`
      );
      cargarPuertos();
      cargarEstadisticas();
    }
  };

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      mostrarNotificacion("error", error);
    }
  }, [error]);

  // Helper para determinar si el botón debe estar deshabilitado
  const isEliminarDisabled = () => {
    return (
      loading ||
      (puertoSeleccionado?._count?.ventas &&
        puertoSeleccionado._count.ventas > 0) ||
      false
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">
          Gestión de Puertos de Embarque
        </h1>
        <p className="text-slate-300 mt-1">
          Administra los puertos de embarque disponibles
        </p>
      </div>

      {/* Botón flotante de Nuevo Puerto */}
      <button
        onClick={() => setModalNuevo(true)}
        className="group fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 ease-out border-2 border-blue-600 hover:border-blue-500 z-50 hover:scale-110 active:scale-95 hover:ring-4 hover:ring-blue-400 hover:ring-offset-2 hover:ring-offset-slate-900"
        title="Nuevo Puerto"
      >
        <Plus className="h-6 w-6" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl border border-slate-600">
          Nuevo Puerto
        </span>
      </button>

      {/* Estadísticas con tema oscuro y glassmorphism */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Puertos */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Total Puertos
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalPuertos}
                </p>
                <p className="text-xs text-blue-400">
                  Nuevos: {estadisticas.puertosRecientes}
                </p>
              </div>
            </div>
          </div>

          {/* Puertos Activos */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Activos
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.puertosActivos}
                </p>
                <p className="text-xs text-green-400">Operativos</p>
              </div>
            </div>
          </div>

          {/* Puertos Inactivos */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-orange-600 p-3 rounded-xl shadow-lg">
                <EyeOff className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Inactivos
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.puertosInactivos}
                </p>
                <p className="text-xs text-orange-400">Suspendidos</p>
              </div>
            </div>
          </div>

          {/* Puertos con Ventas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Con Ventas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.puertosConVentas}
                </p>
                <p className="text-xs text-purple-400">En uso</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros integrados con la tabla */}
      <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-600/50">
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-stretch gap-4 flex-1">
              {/* Campo de búsqueda - se adapta en móvil */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-100 z-10" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, descripción o dirección..."
                    value={filtros.busqueda || ""}
                    onChange={(e) =>
                      handleFiltroChange("busqueda", e.target.value)
                    }
                    className="w-full sm:w-80 pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Botón de filtros - se adapta en móvil */}
              <div className="w-full sm:w-auto">
                <button
                  onClick={() => setShowFiltros(!showFiltros)}
                  className="w-full sm:w-auto flex items-center justify-center px-4 py-3 border border-slate-600/50 rounded-xl hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200 whitespace-nowrap"
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
          </div>

          {showFiltros && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={
                      filtros.activo === undefined
                        ? ""
                        : filtros.activo.toString()
                    }
                    onChange={(e) =>
                      handleFiltroChange(
                        "activo",
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true"
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Todos los estados</option>
                    <option value="true">Activos</option>
                    <option value="false">Inactivos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Resultados por página
                  </label>
                  <select
                    value={filtros.limit || 10}
                    onChange={(e) =>
                      handleFiltroChange("limit", parseInt(e.target.value))
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-end col-span-2">
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

        {/* Tabla de puertos */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-300">Cargando puertos...</span>
            </div>
          ) : puertos.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                No hay puertos registrados
              </h3>
              <p className="text-slate-400">
                Los puertos aparecerán aquí una vez que los registres.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Puerto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Dirección
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-600">
                {puertos.map((puerto) => (
                  <tr
                    key={puerto.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-100">
                          {puerto.nombre}
                        </div>
                        <div className="text-sm text-slate-400">
                          {new Date(puerto.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-200 max-w-xs truncate">
                        {puerto.descripcion || "Sin descripción"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-slate-200 max-w-xs truncate">
                        {puerto.direccion || "Sin dirección"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleCambiarEstado(puerto)}
                        className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                          puerto.activo
                            ? "bg-green-900/40 text-green-300 border border-green-700/50 hover:bg-green-900/60"
                            : "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70"
                        }`}
                      >
                        {puerto.activo ? (
                          <>
                            <ToggleRight className="h-5 w-5 mr-1" />
                            Activo
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="h-5 w-5 mr-1" />
                            Inactivo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                          puerto._count?.ventas && puerto._count.ventas > 0
                            ? "bg-green-900/40 text-green-300 border-green-700/50"
                            : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                        }`}
                      >
                        {puerto._count?.ventas || 0} ventas
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => abrirModalEditar(puerto)}
                          className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                          title="Editar puerto"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => abrirModalEliminar(puerto)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                          title="Eliminar puerto"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
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
              Mostrando {(pagination.page - 1) * (filtros.limit || 10) + 1} a{" "}
              {Math.min(
                pagination.page * (filtros.limit || 10),
                pagination.total
              )}{" "}
              de {pagination.total} resultados
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleFiltroChange("page", pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200"
              >
                Anterior
              </button>
              <span className="px-4 py-2 text-sm text-slate-300 flex items-center">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handleFiltroChange("page", pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border border-slate-600/50 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700/50 bg-slate-700/30 text-slate-200 backdrop-blur-sm transition-all duration-200"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Componentes de modales */}
      <NuevoPuertoForm
        isOpen={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onSubmit={handleCrearPuerto}
        loading={loading}
        error={error}
      />

      <EditarPuertoForm
        isOpen={modalEditar}
        onClose={() => setModalEditar(false)}
        onSubmit={handleActualizarPuerto}
        puerto={puertoSeleccionado}
        loading={loading}
        error={error}
      />

      {/* Modal Confirmar Eliminar */}
      {modalConfirmarEliminar && puertoSeleccionado && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-md w-full shadow-2xl drop-shadow-2xl border border-slate-600/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
              <h2 className="text-xl font-semibold text-slate-100">
                Confirmar Eliminación
              </h2>
              <button
                onClick={() => setModalConfirmarEliminar(false)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-300 mb-6 text-base">
                ¿Estás seguro de que deseas eliminar el puerto{" "}
                <span className="font-semibold text-slate-100">
                  {puertoSeleccionado.nombre}
                </span>
                ?
              </p>
              {puertoSeleccionado._count?.ventas &&
                puertoSeleccionado._count.ventas > 0 && (
                  <div className="bg-orange-900/40 border border-orange-700/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-orange-400 mr-3 flex-shrink-0" />
                      <p className="text-sm text-orange-300">
                        Este puerto tiene {puertoSeleccionado._count.ventas}{" "}
                        ventas asociadas. No podrás eliminarlo.
                      </p>
                    </div>
                  </div>
                )}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setModalConfirmarEliminar(false)}
                  className="px-6 py-3 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 transition-all duration-200 backdrop-blur-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarPuerto}
                  disabled={isEliminarDisabled()}
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
