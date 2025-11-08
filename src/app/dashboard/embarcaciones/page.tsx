// app/dashboard/embarcaciones/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useEmbarcaciones } from "@/hooks/use-embarcaciones";
import {
  Plus,
  Search,
  Filter,
  Edit,
  //Trash2,
  Ship,
  Users,
  Settings,
  AlertTriangle,
  X,
  EyeOff,
  ChevronDown,
  Wrench,
  Activity,
} from "lucide-react";
import {
  Embarcacion,
  FiltrosEmbarcaciones,
  EstadisticasEmbarcaciones,
  CrearEmbarcacionData,
  ActualizarEmbarcacionData,
  EstadoEmbarcacion,
} from "@/types";
import NuevaEmbarcacionForm from "@/components/embarcaciones/nueva-embarcacion-form";
import EditarEmbarcacionForm from "@/components/embarcaciones/editar-embarcacion-form";

export default function GestionEmbarcaciones() {
  useRequireAuth();
  const {
    obtenerEmbarcaciones,
    crearEmbarcacion,
    actualizarEmbarcacion,
    eliminarEmbarcacion,
    obtenerEstadisticas,
    cambiarEstado,
    loading,
    error,
  } = useEmbarcaciones();

  // Estados para la lista de embarcaciones
  const [embarcaciones, setEmbarcaciones] = useState<Embarcacion[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [estadisticas, setEstadisticas] =
    useState<EstadisticasEmbarcaciones | null>(null);

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosEmbarcaciones>({
    busqueda: "",
    estado: undefined,
    page: 1,
    limit: 10,
  });

  // Estados para modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [embarcacionSeleccionada, setEmbarcacionSeleccionada] =
    useState<Embarcacion | null>(null);

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

  // Cargar embarcaciones
  const cargarEmbarcaciones = useCallback(async () => {
    try {
      const resultado = await obtenerEmbarcaciones(filtros);
      if (resultado) {
        setEmbarcaciones(resultado.embarcaciones);
        setPagination(resultado.pagination);
      }
    } catch (error) {
      console.error("Error cargando embarcaciones:", error);
    }
  }, [obtenerEmbarcaciones, filtros]);

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
    cargarEmbarcaciones();
  }, [cargarEmbarcaciones]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Manejar cambios en filtros
  const handleFiltroChange = (
    key: keyof FiltrosEmbarcaciones,
    value: string | EstadoEmbarcacion | number | undefined
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
      estado: undefined,
      page: 1,
      limit: 10,
    });
  };

  // Manejar creación de embarcación
  const handleCrearEmbarcacion = async (
    datos: CrearEmbarcacionData
  ): Promise<boolean> => {
    const resultado = await crearEmbarcacion(datos);
    if (resultado) {
      mostrarNotificacion("success", "¡Embarcación creada correctamente!");
      cargarEmbarcaciones();
      cargarEstadisticas();
      return true;
    }
    return false;
  };

  // Manejar actualización de embarcación
  const handleActualizarEmbarcacion = async (
    id: string,
    datos: ActualizarEmbarcacionData
  ): Promise<boolean> => {
    const resultado = await actualizarEmbarcacion(id, datos);
    if (resultado) {
      mostrarNotificacion("success", "¡Embarcación actualizada correctamente!");
      setEmbarcacionSeleccionada(null);
      cargarEmbarcaciones();
      cargarEstadisticas();
      return true;
    }
    return false;
  };

  // Manejar editar embarcación
  const abrirModalEditar = (embarcacion: Embarcacion) => {
    setEmbarcacionSeleccionada(embarcacion);
    setModalEditar(true);
  };

  // Manejar eliminar embarcación
  // const abrirModalEliminar = (embarcacion: Embarcacion) => {
  //   setEmbarcacionSeleccionada(embarcacion);
  //   setModalConfirmarEliminar(true);
  // };

  // Manejar eliminación de embarcación
  const handleEliminarEmbarcacion = async () => {
    if (!embarcacionSeleccionada) return;

    const resultado = await eliminarEmbarcacion(embarcacionSeleccionada.id);
    if (resultado) {
      mostrarNotificacion("success", "¡Embarcación eliminada correctamente!");
      setModalConfirmarEliminar(false);
      setEmbarcacionSeleccionada(null);
      cargarEmbarcaciones();
      cargarEstadisticas();
    }
  };

  // Manejar cambio de estado
  const handleCambiarEstado = async (
    embarcacion: Embarcacion,
    nuevoEstado: EstadoEmbarcacion
  ) => {
    const resultado = await cambiarEstado(embarcacion.id, nuevoEstado);
    if (resultado) {
      const mensaje = {
        ACTIVA: "Embarcación activada exitosamente",
        MANTENIMIENTO: "Embarcación puesta en mantenimiento",
        INACTIVA: "Embarcación desactivada exitosamente",
      };
      mostrarNotificacion("success", mensaje[nuevoEstado]);
      cargarEmbarcaciones();
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
      (embarcacionSeleccionada?._count?.ventas &&
        embarcacionSeleccionada._count.ventas > 0) ||
      (embarcacionSeleccionada?._count?.embarcacionRutas &&
        embarcacionSeleccionada._count.embarcacionRutas > 0) ||
      false
    );
  };

  // Helper para obtener el color del estado
  const getEstadoColor = (estado: EstadoEmbarcacion) => {
    const colores = {
      ACTIVA: "bg-green-900/40 text-green-300 border-green-700/50",
      MANTENIMIENTO: "bg-orange-900/40 text-orange-300 border-orange-700/50",
      INACTIVA: "bg-slate-700/50 text-slate-300 border-slate-600/50",
    };
    return colores[estado];
  };

  // Helper para obtener el icono del estado
  const getEstadoIcon = (estado: EstadoEmbarcacion) => {
    const iconos = {
      ACTIVA: <Activity className="h-4 w-4" />,
      MANTENIMIENTO: <Wrench className="h-4 w-4" />,
      INACTIVA: <EyeOff className="h-4 w-4" />,
    };
    return iconos[estado];
  };

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">
            Gestión de Embarcaciones
          </h1>
          <p className="text-slate-300 mt-1">
            Administra las embarcaciones y su disponibilidad
          </p>
        </div>
        <div className="w-full lg:w-auto">
          <button
            onClick={() => setModalNuevo(true)}
            className="group bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 sm:px-6 py-3 rounded-xl flex items-center justify-center space-x-3 font-medium shadow-lg hover:shadow-2xl transition-all duration-200 ease-out border-2 border-blue-600 hover:border-blue-700 w-full lg:w-auto touch-manipulation hover:-translate-y-1 active:translate-y-0 active:shadow-lg hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 hover:ring-offset-slate-800"
          >
            <div className="bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700 p-1.5 rounded-lg transition-colors duration-200">
              <Plus className="h-4 w-4" />
            </div>
            <span className="whitespace-nowrap">Nueva Embarcación</span>
            <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>

      {/* Botón flotante de Nueva Embarcación con efecto de borde animado */}
      <button
        onClick={() => setModalNuevo(true)}
        className="fab-button group fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 ease-out z-50 hover:scale-110 active:scale-95"
        title="Nueva Embarcación"
      >
        <svg className="fab-progress-ring" width="64" height="64" viewBox="0 0 64 64">
          <circle
            className="fab-progress-circle"
            cx="32"
            cy="32"
            r="30"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="3"
          />
        </svg>
        <Plus className="h-6 w-6 relative z-10" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl border border-slate-600">
          Nueva Embarcación
        </span>
      </button>

      <style jsx>{`
        .fab-button {
          position: relative;
          overflow: visible;
        }

        .fab-progress-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .fab-progress-circle {
          stroke-dasharray: 188.5;
          stroke-dashoffset: 188.5;
          transform-origin: center;
          transform: rotate(-90deg);
        }

        .fab-button:hover .fab-progress-ring {
          opacity: 1;
        }

        .fab-button:hover .fab-progress-circle {
          animation: progress-animation 2s ease-in-out infinite;
        }

        @keyframes progress-animation {
          0% {
            stroke-dashoffset: 188.5;
          }
          50% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -188.5;
          }
        }
      `}</style>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Embarcaciones */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Ship className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Total Embarcaciones
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalEmbarcaciones}
                </p>
                <p className="text-xs text-blue-400">
                  Capacidad: {estadisticas.capacidadTotal}
                </p>
              </div>
            </div>
          </div>

          {/* Activas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Activas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.embarcacionesActivas}
                </p>
                <p className="text-xs text-green-400">Operativas</p>
              </div>
            </div>
          </div>

          {/* En Mantenimiento */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-orange-600 p-3 rounded-xl shadow-lg">
                <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Mantenimiento
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.embarcacionesMantenimiento}
                </p>
                <p className="text-xs text-orange-400">En reparación</p>
              </div>
            </div>
          </div>

          {/* Con Ventas */}
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
                  {estadisticas.embarcacionesConVentas}
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
            {/* Contenedor para búsqueda y filtros que se apila en móvil */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4 flex-1">
              {/* Campo de búsqueda - se adapta en móvil */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-100 z-10" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o tipo..."
                    value={filtros.busqueda || ""}
                    onChange={(e) =>
                      handleFiltroChange("busqueda", e.target.value)
                    }
                    className="w-full pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
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
                    value={filtros.estado || ""}
                    onChange={(e) =>
                      handleFiltroChange(
                        "estado",
                        e.target.value === ""
                          ? undefined
                          : (e.target.value as EstadoEmbarcacion)
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Todos los estados</option>
                    <option value="ACTIVA">Activas</option>
                    <option value="MANTENIMIENTO">En Mantenimiento</option>
                    <option value="INACTIVA">Inactivas</option>
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

        {/* Tabla de embarcaciones */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-300">
                Cargando embarcaciones...
              </span>
            </div>
          ) : embarcaciones.length === 0 ? (
            <div className="text-center py-12">
              <Ship className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                No hay embarcaciones registradas
              </h3>
              <p className="text-slate-400">
                Las embarcaciones aparecerán aquí una vez que las registres.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Embarcación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Capacidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Tipo
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
                {embarcaciones.map((embarcacion) => (
                  <tr
                    key={embarcacion.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-100">
                          {embarcacion.nombre}
                        </div>
                        <div className="text-sm text-slate-400">
                          {new Date(embarcacion.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-slate-200">
                        <Users className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                        <span className="font-semibold text-blue-400">
                          {embarcacion.capacidad}
                        </span>
                        <span className="ml-1 text-slate-400">pasajeros</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-200">
                        {embarcacion.tipo || "Sin especificar"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${getEstadoColor(
                            embarcacion.estado
                          )}`}
                        >
                          {getEstadoIcon(embarcacion.estado)}
                          <span className="ml-1">{embarcacion.estado}</span>
                        </span>
                        <div className="relative group">
                          <button className="p-1 text-slate-400 hover:text-slate-300 transition-colors">
                            <Settings className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                            <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                              {Object.values([
                                "ACTIVA",
                                "MANTENIMIENTO",
                                "INACTIVA",
                              ] as EstadoEmbarcacion[]).map(
                                (estado) =>
                                  estado !== embarcacion.estado && (
                                    <button
                                      key={estado}
                                      onClick={() =>
                                        handleCambiarEstado(embarcacion, estado)
                                      }
                                      className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                                    >
                                      Cambiar a {estado}
                                    </button>
                                  )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                          embarcacion._count?.ventas &&
                          embarcacion._count.ventas > 0
                            ? "bg-green-900/40 text-green-300 border-green-700/50"
                            : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                        }`}
                      >
                        {embarcacion._count?.ventas || 0} ventas
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => abrirModalEditar(embarcacion)}
                          className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                          title="Editar embarcación"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {/* <button
                          onClick={() => abrirModalEliminar(embarcacion)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                          title="Eliminar embarcación"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button> */}
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
      <NuevaEmbarcacionForm
        isOpen={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onSubmit={handleCrearEmbarcacion}
        loading={loading}
        error={error}
      />

      <EditarEmbarcacionForm
        isOpen={modalEditar}
        onClose={() => setModalEditar(false)}
        onSubmit={handleActualizarEmbarcacion}
        embarcacion={embarcacionSeleccionada}
        loading={loading}
        error={error}
      />

      {/* Modal Confirmar Eliminar */}
      {modalConfirmarEliminar && embarcacionSeleccionada && (
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
                ¿Estás seguro de que deseas eliminar la embarcación{" "}
                <span className="font-semibold text-slate-100">
                  {embarcacionSeleccionada.nombre}
                </span>
                ?
              </p>
              {((embarcacionSeleccionada._count?.ventas &&
                embarcacionSeleccionada._count.ventas > 0) ||
                (embarcacionSeleccionada._count?.embarcacionRutas &&
                  embarcacionSeleccionada._count.embarcacionRutas > 0)) && (
                <div className="bg-orange-900/40 border border-orange-700/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-orange-400 mr-3 flex-shrink-0" />
                    <p className="text-sm text-orange-300">
                      Esta embarcación tiene{" "}
                      {embarcacionSeleccionada._count?.ventas || 0} ventas y{" "}
                      {embarcacionSeleccionada._count?.embarcacionRutas || 0}{" "}
                      rutas asignadas. No podrás eliminarla.
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
                  onClick={handleEliminarEmbarcacion}
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
