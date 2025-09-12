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

  // Función para mostrar notificaciones estilo nueva-venta-form
  const mostrarNotificacion = (tipo: "success" | "error", texto: string) => {
    const notification = document.createElement("div");
    notification.className = `fixed top-4 right-4 ${
      tipo === "success"
        ? "bg-green-50 border border-green-200 text-green-800"
        : "bg-red-50 border border-red-200 text-red-800"
    } px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 z-50`;

    notification.innerHTML = `
      <svg class="h-5 w-5 ${
        tipo === "success" ? "text-green-600" : "text-red-600"
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
      setError(validacionDNI.mensaje || "DNI inválido");
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
      setError(validacionDNI.mensaje || "DNI inválido");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Clientes
          </h1>
          <p className="text-gray-600">
            Administra la información de tus clientes
          </p>
        </div>
        <button
          onClick={() => setModalNuevo(true)}
          className="group bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-6 py-3 rounded-lg flex items-center space-x-3 font-medium shadow-md hover:shadow-xl transition-all duration-200 ease-out border-2 border-blue-600 hover:border-blue-700 w-full sm:w-auto justify-center sm:justify-start touch-manipulation hover:-translate-y-1 active:translate-y-0 active:shadow-md"
        >
          <div className="bg-blue-500 group-hover:bg-blue-600 group-active:bg-blue-700 p-1.5 rounded-md transition-colors duration-200">
            <Plus className="h-4 w-4" />
          </div>
          <span>Nuevo Cliente</span>
          <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
        </button>
      </div>

      {/* Estadísticas con colores de fondo suaves */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Clientes - Azul suave */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-blue-700 truncate">
                  Total Clientes
                </p>
                <p className="text-lg sm:text-xl font-bold text-blue-900">
                  {estadisticas.totalClientes}
                </p>
                <p className="text-xs text-blue-600">
                  Nuevos: {estadisticas.clientesRecientes}
                </p>
              </div>
            </div>
          </div>

          {/* Clientes con Ventas - Verde suave */}
          <div className="bg-green-50 border border-green-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 rounded-lg">
                <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-green-700 truncate">
                  Con Ventas
                </p>
                <p className="text-lg sm:text-xl font-bold text-green-900">
                  {estadisticas.clientesConVentas}
                </p>
                <p className="text-xs text-green-600">Activos</p>
              </div>
            </div>
          </div>

          {/* Clientes sin Ventas - Amarillo suave */}
          <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <UserX className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-yellow-700 truncate">
                  Sin Ventas
                </p>
                <p className="text-lg sm:text-xl font-bold text-yellow-900">
                  {estadisticas.clientesSinVentas}
                </p>
                <p className="text-xs text-yellow-600">Potenciales</p>
              </div>
            </div>
          </div>

          {/* Nacionalidad Principal - Púrpura suave */}
          <div className="bg-purple-50 border border-purple-100 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Globe className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 flex-shrink-0" />
              </div>
              <div className="ml-3 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-purple-700 truncate">
                  Nacionalidad Principal
                </p>
                <p className="text-sm font-bold text-purple-900 truncate">
                  {estadisticas.nacionalidadesMasComunes[0]?.nacionalidad ||
                    "N/A"}
                </p>
                <p className="text-xs text-purple-600">
                  {estadisticas.nacionalidadesMasComunes[0]?._count
                    ?.nacionalidad || 0}{" "}
                  clientes
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros unidos con la tabla */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por DNI, nombre o apellido..."
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
                    Nacionalidad
                  </label>
                  <select
                    value={filtros.nacionalidad || ""}
                    onChange={(e) =>
                      handleFiltroChange("nacionalidad", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resultados por página
                  </label>
                  <select
                    value={filtros.limit || 10}
                    onChange={(e) =>
                      handleFiltroChange("limit", parseInt(e.target.value))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
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
                    className="w-full px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
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
              <span className="ml-3 text-gray-600">Cargando clientes...</span>
            </div>
          ) : clientes.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay clientes registrados
              </h3>
              <p className="text-gray-600">
                Los clientes aparecerán aquí una vez que los registres.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nacionalidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatearNombreCompleto(cliente)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(cliente.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                      {cliente.dni}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {cliente.telefono}
                      </div>
                      <div className="text-sm text-gray-500">
                        {cliente.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cliente.nacionalidad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          cliente._count?.ventas && cliente._count.ventas > 0
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {cliente._count?.ventas || 0} ventas
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-4">
                        <button
                          onClick={() => abrirModalEditar(cliente)}
                          className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar cliente"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        {user?.role === "ADMINISTRADOR" && (
                          <button
                            onClick={() => abrirModalEliminar(cliente)}
                            className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
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
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {(pagination.page - 1) * (filtros.limit || 10) + 1} a{" "}
              {Math.min(
                pagination.page * (filtros.limit || 10),
                pagination.total
              )}{" "}
              de {pagination.total} resultados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handleFiltroChange("page", pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <span className="px-3 py-2 text-sm text-gray-700">
                Página {pagination.page} de {pagination.totalPages}
              </span>
              <button
                onClick={() => handleFiltroChange("page", pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full shadow-2xl drop-shadow-xl border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Confirmar Eliminación
              </h2>
              <button
                onClick={() => setModalConfirmarEliminar(false)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas eliminar al cliente{" "}
                <span className="font-semibold">
                  {formatearNombreCompleto(clienteSeleccionado)}
                </span>
                ?
              </p>
              {clienteSeleccionado._count?.ventas &&
                clienteSeleccionado._count.ventas > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        Este cliente tiene {clienteSeleccionado._count.ventas}{" "}
                        ventas asociadas. No podrás eliminarlo.
                      </p>
                    </div>
                  </div>
                )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setModalConfirmarEliminar(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleEliminarCliente}
                  disabled={
                    loading || (clienteSeleccionado._count?.ventas || 0) > 0
                  }
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
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
