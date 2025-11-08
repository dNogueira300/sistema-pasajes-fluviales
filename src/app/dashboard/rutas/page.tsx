// app/dashboard/rutas/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useRutas } from "@/hooks/use-rutas";
import { useEmbarcacionRutas } from "@/hooks/use-embarcacion-rutas";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Route,
  DollarSign,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  ChevronDown,
  MapPin,
  Ship,
  Users,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import {
  Ruta,
  FiltrosRutas,
  EstadisticasRutas,
  CrearRutaConEmbarcaciones,
  ActualizarRutaConEmbarcaciones,
  EmbarcacionRuta,
} from "@/types";
import NuevaRutaForm from "@/components/rutas/nueva-ruta-form";
import EditarRutaForm from "@/components/rutas/editar-ruta-form";

// Componente para notificaciones mejoradas
interface NotificacionProps {
  tipo: "success" | "error" | "warning" | "info";
  titulo: string;
  mensaje: string;
  detalles?: string[];
  onClose: () => void;
}

function Notificacion({
  tipo,
  titulo,
  mensaje,
  detalles,
  onClose,
}: NotificacionProps) {
  const iconos = {
    success: <CheckCircle className="h-5 w-5 text-green-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-400" />,
    info: <AlertCircle className="h-5 w-5 text-blue-400" />,
  };

  const colores = {
    success: "bg-green-900/90 border border-green-700 text-green-100",
    error: "bg-red-900/90 border border-red-700 text-red-100",
    warning: "bg-yellow-900/90 border border-yellow-700 text-yellow-100",
    info: "bg-blue-900/90 border border-blue-700 text-blue-100",
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        onClose();
      },
      tipo === "error" || tipo === "warning" ? 10000 : 5000
    );

    return () => clearTimeout(timer);
  }, [onClose, tipo]);

  return (
    <div
      className={`fixed top-4 right-4 ${colores[tipo]} px-6 py-4 rounded-xl shadow-xl flex flex-col space-y-2 z-50 backdrop-blur-sm max-w-md`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {iconos[tipo]}
          <div>
            <p className="font-medium">{titulo}</p>
            <p className="text-sm opacity-90">{mensaje}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {detalles && detalles.length > 0 && (
        <div className="mt-2 pl-8">
          <ul className="text-xs space-y-1 opacity-90">
            {detalles.map((detalle, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{detalle}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function GestionRutas() {
  useRequireAuth();
  const {
    obtenerRutas,
    crearRuta,
    actualizarRuta,
    eliminarRuta,
    obtenerEstadisticas,
    cambiarEstado,
    loading,
    error,
    validationErrors,
    limpiarErroresValidacion,
  } = useRutas();

  const { obtenerEmbarcacionesPorRuta } = useEmbarcacionRutas();

  // Estados para la lista de rutas
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [estadisticas, setEstadisticas] = useState<EstadisticasRutas | null>(
    null
  );

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosRutas>({
    busqueda: "",
    activa: undefined,
    page: 1,
    limit: 10,
  });

  // Estados para modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [rutaSeleccionada, setRutaSeleccionada] = useState<Ruta | null>(null);

  // Estados de UI
  const [showFiltros, setShowFiltros] = useState(false);
  // Cambio aquí: usar EmbarcacionRuta[] en lugar de any[]
  const [embarcacionesPorRuta, setEmbarcacionesPorRuta] = useState<{
    [rutaId: string]: EmbarcacionRuta[];
  }>({});
  const [notificacion, setNotificacion] = useState<NotificacionProps | null>(
    null
  );

  // Función para mostrar notificaciones
  const mostrarNotificacion = (
    tipo: NotificacionProps["tipo"],
    titulo: string,
    mensaje: string,
    detalles?: string[]
  ) => {
    setNotificacion({
      tipo,
      titulo,
      mensaje,
      detalles,
      onClose: () => setNotificacion(null),
    });
  };

  // Cargar embarcaciones para cada ruta
  const cargarEmbarcacionesDeRutas = useCallback(
    async (rutasArray: Ruta[]) => {
      const embarcacionesMap: { [rutaId: string]: EmbarcacionRuta[] } = {};

      for (const ruta of rutasArray) {
        try {
          const embarcaciones = await obtenerEmbarcacionesPorRuta(ruta.id);
          embarcacionesMap[ruta.id] = embarcaciones || [];
        } catch (error) {
          console.error(
            `Error cargando embarcaciones para ruta ${ruta.id}:`,
            error
          );
          embarcacionesMap[ruta.id] = [];
        }
      }

      setEmbarcacionesPorRuta(embarcacionesMap);
    },
    [obtenerEmbarcacionesPorRuta]
  );

  // Cargar rutas
  const cargarRutas = useCallback(async () => {
    try {
      const resultado = await obtenerRutas(filtros);
      if (resultado) {
        setRutas(resultado.rutas);
        setPagination(resultado.pagination);
        // Cargar embarcaciones para cada ruta
        await cargarEmbarcacionesDeRutas(resultado.rutas);
      }
    } catch (error) {
      console.error("Error cargando rutas:", error);
    }
  }, [obtenerRutas, filtros, cargarEmbarcacionesDeRutas]);

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
    cargarRutas();
  }, [cargarRutas]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Manejar cambios en filtros
  const handleFiltroChange = (
    key: keyof FiltrosRutas,
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
      activa: undefined,
      page: 1,
      limit: 10,
    });
  };

  // Manejar creación de ruta
  const handleCrearRuta = async (
    datos: CrearRutaConEmbarcaciones
  ): Promise<boolean> => {
    limpiarErroresValidacion();
    const resultado = await crearRuta(datos);

    if (resultado) {
      if (validationErrors.length > 0) {
        mostrarNotificacion(
          "warning",
          "Ruta creada con advertencias",
          "La ruta se creó correctamente pero hubo problemas con algunas embarcaciones",
          validationErrors
        );
      } else {
        mostrarNotificacion("success", "¡Éxito!", "Ruta creada correctamente");
      }
      cargarRutas();
      cargarEstadisticas();
      return true;
    } else {
      if (validationErrors.length > 0) {
        mostrarNotificacion(
          "error",
          "Errores de validación",
          "No se pudo crear la ruta debido a problemas con las embarcaciones",
          validationErrors
        );
      } else if (error) {
        mostrarNotificacion("error", "Error", error);
      }
      return false;
    }
  };

  // Manejar actualización de ruta
  const handleActualizarRuta = async (
    id: string,
    datos: ActualizarRutaConEmbarcaciones
  ): Promise<boolean> => {
    limpiarErroresValidacion();
    const resultado = await actualizarRuta(id, datos);

    if (resultado) {
      if (validationErrors.length > 0) {
        mostrarNotificacion(
          "warning",
          "Ruta actualizada con advertencias",
          "La ruta se actualizó correctamente pero hubo problemas con algunas embarcaciones",
          validationErrors
        );
      } else {
        mostrarNotificacion(
          "success",
          "¡Éxito!",
          "Ruta actualizada correctamente"
        );
      }
      setRutaSeleccionada(null);
      cargarRutas();
      cargarEstadisticas();
      return true;
    } else {
      if (validationErrors.length > 0) {
        mostrarNotificacion(
          "error",
          "Errores de validación",
          "No se pudo actualizar la ruta debido a problemas con las embarcaciones",
          validationErrors
        );
      } else if (error) {
        mostrarNotificacion("error", "Error", error);
      }
      return false;
    }
  };

  // Manejar editar ruta
  const abrirModalEditar = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setModalEditar(true);
  };

  // Manejar eliminar ruta
  const abrirModalEliminar = (ruta: Ruta) => {
    setRutaSeleccionada(ruta);
    setModalConfirmarEliminar(true);
  };

  // Manejar eliminación de ruta
  const handleEliminarRuta = async () => {
    if (!rutaSeleccionada) return;

    const resultado = await eliminarRuta(rutaSeleccionada.id);
    if (resultado) {
      mostrarNotificacion("success", "¡Éxito!", "Ruta eliminada correctamente");
      setModalConfirmarEliminar(false);
      setRutaSeleccionada(null);
      cargarRutas();
      cargarEstadisticas();
    } else if (error) {
      mostrarNotificacion("error", "Error", error);
    }
  };

  // Manejar cambio de estado
  const handleCambiarEstado = async (ruta: Ruta) => {
    const resultado = await cambiarEstado(ruta.id, !ruta.activa);
    if (resultado) {
      mostrarNotificacion(
        "success",
        "Estado actualizado",
        `Ruta ${!ruta.activa ? "activada" : "desactivada"} exitosamente`
      );
      cargarRutas();
      cargarEstadisticas();
    } else if (error) {
      mostrarNotificacion("error", "Error", error);
    }
  };

  // Helper para determinar si el botón debe estar deshabilitado
  // Solo se deshabilita si la ruta tiene ventas, NO si solo tiene embarcaciones
  const isEliminarDisabled = () => {
    return (
      loading ||
      (rutaSeleccionada?._count?.ventas &&
        rutaSeleccionada._count.ventas > 0) ||
      false
    );
  };

  // Formatear precio
  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(precio);
  };

  // Obtener embarcaciones de una ruta
  const getEmbarcacionesRuta = (rutaId: string): EmbarcacionRuta[] => {
    return embarcacionesPorRuta[rutaId] || [];
  };

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full">
      {/* Notificación */}
      {notificacion && <Notificacion {...notificacion} />}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">
            Gestión de Rutas
          </h1>
          <p className="text-slate-300 mt-1">
            Administra las rutas y sus embarcaciones asignadas
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
            <span className="whitespace-nowrap">Nueva Ruta</span>
            <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>

      {/* Botón flotante de Nueva Ruta con efecto de borde animado */}
      <button
        onClick={() => setModalNuevo(true)}
        className="fab-button group fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 ease-out z-50 hover:scale-110 active:scale-95"
        title="Nueva Ruta"
      >
        <div className="fab-spinner"></div>
        <Plus className="h-6 w-6 relative z-10" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl border border-slate-600">
          Nueva Ruta
        </span>
      </button>

      <style jsx>{`
        .fab-button {
          position: relative;
          overflow: visible;
        }

        .fab-spinner {
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            transparent 270deg,
            #60a5fa 270deg,
            #3b82f6 360deg
          );
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .fab-button:hover .fab-spinner {
          opacity: 1;
          animation: spin-border 1.5s linear infinite;
        }

        @keyframes spin-border {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Rutas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Route className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Total Rutas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalRutas}
                </p>
                <p className="text-xs text-blue-400">
                  Nuevas: {estadisticas.rutasRecientes}
                </p>
              </div>
            </div>
          </div>

          {/* Rutas Activas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Activas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.rutasActivas}
                </p>
                <p className="text-xs text-green-400">Disponibles</p>
              </div>
            </div>
          </div>

          {/* Rutas Inactivas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-orange-600 p-3 rounded-xl shadow-lg">
                <EyeOff className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Inactivas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.rutasInactivas}
                </p>
                <p className="text-xs text-orange-400">Suspendidas</p>
              </div>
            </div>
          </div>

          {/* Rutas con Ventas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Con Ventas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.rutasConVentas}
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
              {/* Campo de búsqueda - responsive */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-100 z-10" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, origen o destino..."
                    value={filtros.busqueda || ""}
                    onChange={(e) =>
                      handleFiltroChange("busqueda", e.target.value)
                    }
                    className="w-full sm:w-80 pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                  />
                </div>
              </div>

              {/* Botón de filtros - responsive */}
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
                      filtros.activa === undefined
                        ? ""
                        : filtros.activa.toString()
                    }
                    onChange={(e) =>
                      handleFiltroChange(
                        "activa",
                        e.target.value === ""
                          ? undefined
                          : e.target.value === "true"
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Todos los estados</option>
                    <option value="true">Activas</option>
                    <option value="false">Inactivas</option>
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

        {/* Tabla de rutas */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-300">Cargando rutas...</span>
            </div>
          ) : rutas.length === 0 ? (
            <div className="text-center py-12">
              <Route className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                No hay rutas registradas
              </h3>
              <p className="text-slate-400">
                Las rutas aparecerán aquí una vez que las registres.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Ruta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Trayecto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Embarcaciones
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
                {rutas.map((ruta) => {
                  const embarcaciones = getEmbarcacionesRuta(ruta.id);
                  const embarcacionesActivas = embarcaciones.filter(
                    (er) => er.activa
                  );

                  return (
                    <tr
                      key={ruta.id}
                      className="hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-100">
                            {ruta.nombre}
                          </div>
                          <div className="text-sm text-slate-400">
                            {new Date(ruta.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-slate-200">
                          <MapPin className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0" />
                          <span className="truncate">{ruta.puertoOrigen}</span>
                          <span className="mx-2 text-slate-400">→</span>
                          <MapPin className="h-4 w-4 text-slate-400 mr-1 flex-shrink-0" />
                          <span className="truncate">{ruta.puertoDestino}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-lg font-semibold text-green-400">
                          {formatearPrecio(ruta.precio)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-slate-200">
                            <Ship className="h-4 w-4 text-blue-400 mr-2" />
                            <span>
                              {embarcaciones.length} total (
                              {embarcacionesActivas.length} activas)
                            </span>
                          </div>
                          {embarcacionesActivas.length > 0 && (
                            <div className="text-xs text-slate-400">
                              {embarcacionesActivas
                                .slice(0, 2)
                                .map((er, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <Users className="h-3 w-3 mr-1" />
                                    {er.embarcacion?.nombre || "Sin nombre"}
                                  </div>
                                ))}
                              {embarcacionesActivas.length > 2 && (
                                <div className="text-xs text-slate-500">
                                  +{embarcacionesActivas.length - 2} más
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleCambiarEstado(ruta)}
                          className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                            ruta.activa
                              ? "bg-green-900/40 text-green-300 border border-green-700/50 hover:bg-green-900/60"
                              : "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70"
                          }`}
                        >
                          {ruta.activa ? (
                            <>
                              <ToggleRight className="h-5 w-5 mr-1" />
                              Activa
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="h-5 w-5 mr-1" />
                              Inactiva
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                            ruta._count?.ventas && ruta._count.ventas > 0
                              ? "bg-green-900/40 text-green-300 border-green-700/50"
                              : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                          }`}
                        >
                          {ruta._count?.ventas || 0} ventas
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-3">
                          <button
                            onClick={() => abrirModalEditar(ruta)}
                            className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                            title="Editar ruta"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => abrirModalEliminar(ruta)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                            title="Eliminar ruta"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      <NuevaRutaForm
        isOpen={modalNuevo}
        onClose={() => {
          setModalNuevo(false);
          limpiarErroresValidacion(); // Limpiar errores al cerrar
        }}
        onSubmit={handleCrearRuta}
        loading={loading}
        error={error}
        validationErrors={validationErrors}
      />

      <EditarRutaForm
        isOpen={modalEditar}
        onClose={() => setModalEditar(false)}
        onSubmit={handleActualizarRuta}
        ruta={rutaSeleccionada}
        loading={loading}
        error={error}
        validationErrors={validationErrors}
      />

      {/* Modal Confirmar Eliminar */}
      {modalConfirmarEliminar && rutaSeleccionada && (
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
                ¿Estás seguro de que deseas eliminar la ruta{" "}
                <span className="font-semibold text-slate-100">
                  {rutaSeleccionada.nombre}
                </span>
                ?
              </p>
              {/* Mostrar información de embarcaciones si las tiene */}
              {rutaSeleccionada._count?.embarcacionRutas &&
                rutaSeleccionada._count.embarcacionRutas > 0 && (
                  <div className="bg-blue-900/40 border border-blue-700/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0" />
                      <p className="text-sm text-blue-300">
                        Esta ruta tiene{" "}
                        {rutaSeleccionada._count.embarcacionRutas}{" "}
                        embarcación(es) asignada(s). Al eliminar la ruta,
                        estas embarcaciones se liberarán y quedarán disponibles para otras rutas.
                      </p>
                    </div>
                  </div>
                )}

              {/* Mostrar warning si tiene ventas (bloquea eliminación) */}
              {rutaSeleccionada._count?.ventas &&
                rutaSeleccionada._count.ventas > 0 && (
                  <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                      <p className="text-sm text-red-300">
                        ⚠️ Esta ruta tiene {rutaSeleccionada._count.ventas}{" "}
                        venta(s) registrada(s). No se puede eliminar para
                        mantener la integridad de los registros.
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
                  onClick={handleEliminarRuta}
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
