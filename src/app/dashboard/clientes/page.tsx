// app/dashboard/clientes/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import {
  useClientes,
  type Cliente,
  type FiltrosClientes,
} from "@/hooks/use-clientes";
import NuevoClienteForm from "@/components/clientes/nuevo-cliente-form";
import EditarClienteForm from "@/components/clientes/editar-cliente-form";
import {
  X,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Globe,
  AlertCircle,
  Loader2,
  ChevronDown,
} from "lucide-react";

interface EstadisticasClientes {
  totalClientes: number;
  clientesConVentas: number;
  clientesSinVentas: number;
  nacionalidadesMasComunes: Array<{
    nacionalidad: string;
    _count: { nacionalidad: number };
  }>;
  clientesRecientes: number;
}

interface DatosCliente {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  nacionalidad: string;
  direccion: string;
}

export default function ClientesPage() {
  const { user } = useRequireAuth();
  const {
    obtenerClientes,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
    obtenerEstadisticas,
    validarDNI,
    formatearNombreCompleto,
    loading,
    error,
    setError,
  } = useClientes();

  // Estados para la lista de clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [estadisticas, setEstadisticas] = useState<EstadisticasClientes | null>(
    null
  );

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosClientes>({
    busqueda: "",
    nacionalidad: "",
    page: 1,
    limit: 10,
  });

  // Estados para modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<Cliente | null>(null);

  // Lista completa de nacionalidades
  const nacionalidadesCompletas = [
    "Peruana",
    "Argentina",
    "Boliviana",
    "Brasileña",
    "Chilena",
    "Colombiana",
    "Ecuatoriana",
    "Paraguaya",
    "Uruguaya",
    "Venezolana",
    "Estadounidense",
    "Canadiense",
    "Mexicana",
    "Española",
    "Francesa",
    "Italiana",
    "Alemana",
    "Británica",
    "Portuguesa",
    "Holandesa",
    "Belga",
    "Suiza",
    "Austriaca",
    "Sueca",
    "Noruega",
    "Danesa",
    "Finlandesa",
    "Rusa",
    "China",
    "Japonesa",
    "Coreana",
    "India",
    "Australiana",
    "Neozelandesa",
    "Sudafricana",
    "Israelí",
    "Turca",
    "Griega",
    "Polaca",
    "Checa",
    "Húngara",
    "Rumana",
    "Búlgara",
    "Croata",
    "Eslovena",
    "Eslovaca",
    "Estonia",
    "Letona",
    "Lituana",
    "Otra",
  ];

  // Estados de UI
  const [showFiltros, setShowFiltros] = useState(false);

  // Función para mostrar notificaciones con tema oscuro
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

  // Cargar clientes
  const cargarClientes = useCallback(async () => {
    try {
      const resultado = await obtenerClientes(filtros);
      if (resultado) {
        setClientes(resultado.clientes);
        setPagination(resultado.pagination);
      }
    } catch (error) {
      console.error("Error cargando clientes:", error);
    }
  }, [filtros, obtenerClientes]);

  // Cargar estadísticas
  const cargarEstadisticas = useCallback(async () => {
    try {
      const stats = await obtenerEstadisticas();
      setEstadisticas(stats);
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  }, [obtenerEstadisticas]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  // Manejar cambios en filtros
  const handleFiltroChange = (
    key: keyof FiltrosClientes,
    value: string | number | undefined
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
      nacionalidad: "",
      page: 1,
      limit: 10,
    });
  };

  // Handlers para los formularios
  const handleCrearCliente = async (
    datosCliente: DatosCliente
  ): Promise<boolean> => {
    setError(null);

    // Validar DNI
    const validacionDNI = validarDNI(datosCliente.dni);
    if (!validacionDNI.valido) {
      setError(validacionDNI.mensaje || "Doc. Identidad inválido");
      return false;
    }

    const resultado = await crearCliente(datosCliente);
    if (resultado) {
      mostrarNotificacion("success", "¡Cliente creado correctamente!");
      cargarClientes();
      cargarEstadisticas();
      return true;
    }
    return false;
  };

  const handleActualizarCliente = async (
    id: string,
    datosCliente: DatosCliente
  ): Promise<boolean> => {
    setError(null);

    // Validar DNI
    const validacionDNI = validarDNI(datosCliente.dni);
    if (!validacionDNI.valido) {
      setError(validacionDNI.mensaje || "Doc. Identidad inválido");
      return false;
    }

    const resultado = await actualizarCliente(id, datosCliente);
    if (resultado) {
      mostrarNotificacion("success", "¡Cliente actualizado correctamente!");
      cargarClientes();
      setClienteSeleccionado(null);
      return true;
    }
    return false;
  };

  // Manejar editar cliente
  const abrirModalEditar = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setModalEditar(true);
  };

  // Manejar eliminar cliente
  const abrirModalEliminar = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setModalConfirmarEliminar(true);
  };

  const handleEliminarCliente = async () => {
    if (!clienteSeleccionado) return;

    const resultado = await eliminarCliente(clienteSeleccionado.id);
    if (resultado) {
      mostrarNotificacion("success", "¡Cliente eliminado correctamente!");
      setModalConfirmarEliminar(false);
      setClienteSeleccionado(null);
      cargarClientes();
      cargarEstadisticas();
    }
  };

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      mostrarNotificacion("error", error);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">
            Gestión de Clientes
          </h1>
          <p className="text-slate-300 mt-1">
            Administra la información de tus clientes
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
            <span className="whitespace-nowrap">Nuevo Cliente</span>
            <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>

      {/* Botón flotante de Nuevo Cliente con efecto de borde animado */}
      <button
        onClick={() => setModalNuevo(true)}
        className="fab-button group fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl transition-all duration-300 ease-out z-50 hover:scale-110 active:scale-95"
        title="Nuevo Cliente"
      >
        <div className="fab-spinner"></div>
        <Plus className="h-6 w-6 relative z-10" />
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-slate-800 text-slate-100 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl border border-slate-600">
          Nuevo Cliente
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

      {/* Estadísticas con tema oscuro y glassmorphism */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Clientes */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Total Clientes
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalClientes}
                </p>
                <p className="text-xs text-blue-400">
                  Nuevos: {estadisticas.clientesRecientes}
                </p>
              </div>
            </div>
          </div>

          {/* Clientes con Ventas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Con Ventas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.clientesConVentas}
                </p>
                <p className="text-xs text-green-400">Activos</p>
              </div>
            </div>
          </div>

          {/* Clientes sin Ventas */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-orange-600 p-3 rounded-xl shadow-lg">
                <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Sin Ventas
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.clientesSinVentas}
                </p>
                <p className="text-xs text-orange-400">Potenciales</p>
              </div>
            </div>
          </div>

          {/* Nacionalidad Principal */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Nacionalidad Principal
                </p>
                <p className="text-sm font-bold text-slate-100 truncate">
                  {estadisticas.nacionalidadesMasComunes[0]?.nacionalidad ||
                    "N/A"}
                </p>
                <p className="text-xs text-purple-400">
                  {estadisticas.nacionalidadesMasComunes[0]?._count
                    ?.nacionalidad || 0}{" "}
                  clientes
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
            {/* Campo de búsqueda - ocupa todo el ancho disponible */}
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-100 z-10" />
                <input
                  type="text"
                  placeholder="Buscar por Doc. Identidad, nombre o apellido..."
                  value={filtros.busqueda || ""}
                  onChange={(e) =>
                    handleFiltroChange("busqueda", e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>

            {/* Botón de filtros - separado del campo de búsqueda */}
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

          {showFiltros && (
            <div className="mt-6 pt-6 border-t border-slate-600/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nacionalidad
                  </label>
                  <select
                    value={filtros.nacionalidad || ""}
                    onChange={(e) =>
                      handleFiltroChange("nacionalidad", e.target.value)
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Todas las nacionalidades</option>
                    {nacionalidadesCompletas.map((nacionalidad) => (
                      <option key={nacionalidad} value={nacionalidad}>
                        {nacionalidad}
                      </option>
                    ))}
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

        {/* Tabla de clientes */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-300">Cargando clientes...</span>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                No hay clientes registrados
              </h3>
              <p className="text-slate-400">
                Los clientes aparecerán aquí una vez que los registres.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Doc. Identidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Nacionalidad
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
                {clientes.map((cliente) => (
                  <tr
                    key={cliente.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-100">
                          {formatearNombreCompleto(cliente)}
                        </div>
                        <div className="text-sm text-slate-400">
                          {new Date(cliente.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-200">
                      {cliente.dni}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-200">
                        {cliente.telefono}
                      </div>
                      <div className="text-sm text-slate-400">
                        {cliente.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-200">
                      {cliente.nacionalidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                          cliente._count?.ventas && cliente._count.ventas > 0
                            ? "bg-green-900/40 text-green-300 border-green-700/50"
                            : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                        }`}
                      >
                        {cliente._count?.ventas || 0} ventas
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => abrirModalEditar(cliente)}
                          className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                          title="Editar cliente"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {user?.role === "ADMINISTRADOR" && (
                          <button
                            onClick={() => abrirModalEliminar(cliente)}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                            title="Eliminar cliente"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
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
      <NuevoClienteForm
        isOpen={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onSubmit={handleCrearCliente}
        loading={loading}
        error={error}
      />

      <EditarClienteForm
        isOpen={modalEditar}
        onClose={() => setModalEditar(false)}
        onSubmit={handleActualizarCliente}
        cliente={clienteSeleccionado}
        loading={loading}
        error={error}
      />

      {/* Modal Confirmar Eliminar */}
      {modalConfirmarEliminar && clienteSeleccionado && (
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
                ¿Estás seguro de que deseas eliminar al cliente{" "}
                <span className="font-semibold text-slate-100">
                  {formatearNombreCompleto(clienteSeleccionado)}
                </span>
                ?
              </p>
              {clienteSeleccionado._count?.ventas &&
                clienteSeleccionado._count.ventas > 0 && (
                  <div className="bg-orange-900/40 border border-orange-700/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-orange-400 mr-3 flex-shrink-0" />
                      <p className="text-sm text-orange-300">
                        Este cliente tiene {clienteSeleccionado._count.ventas}{" "}
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
                  onClick={handleEliminarCliente}
                  disabled={
                    loading || (clienteSeleccionado._count?.ventas || 0) > 0
                  }
                  className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
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
