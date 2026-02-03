// app/dashboard/usuarios/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRequireAuth } from "@/hooks/use-auth";
import { useUsuarios } from "@/hooks/use-usuarios";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  UserCheck,
  UserX,
  Shield,
  ChevronDown,
  X,
  Settings,
  Key,
  Activity,
  AlertTriangle,
} from "lucide-react";
import {
  Usuario,
  FiltrosUsuarios,
  EstadisticasUsuarios,
  CrearUsuarioData,
  ActualizarUsuarioData,
  UserRole,
} from "@/types";
import NuevoUsuarioForm from "@/components/usuarios/nuevo-usuario-form";
import EditarUsuarioForm from "@/components/usuarios/editar-usuario-form";
import CambiarContrasenaForm from "@/components/usuarios/cambiar-contrasena-form";

export default function GestionUsuarios() {
  const { isLoading, hasRequiredRole } = useRequireAuth("ADMINISTRADOR");

  const {
    obtenerUsuarios,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    obtenerEstadisticas,
    cambiarEstado,
    cambiarRol,
    loading,
    error,
  } = useUsuarios();

  // Estados para la lista de usuarios
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios | null>(
    null
  );

  // Estados para filtros
  const [filtros, setFiltros] = useState<FiltrosUsuarios>({
    busqueda: "",
    role: undefined,
    activo: undefined,
    page: 1,
    limit: 10,
  });

  // Estados para modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [modalContrasena, setModalContrasena] = useState(false);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] =
    useState<Usuario | null>(null);

  // Estados de UI
  const [showFiltros, setShowFiltros] = useState(false);

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

  // Cargar usuarios
  const cargarUsuarios = useCallback(async () => {
    try {
      const resultado = await obtenerUsuarios(filtros);
      if (resultado) {
        setUsuarios(resultado.usuarios);
        setPagination(resultado.pagination);
      }
    } catch (error) {
      console.error("Error cargando usuarios:", error);
    }
  }, [obtenerUsuarios, filtros]);

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
    if (hasRequiredRole) {
      cargarUsuarios();
    }
  }, [cargarUsuarios, hasRequiredRole]);

  useEffect(() => {
    if (hasRequiredRole) {
      cargarEstadisticas();
    }
  }, [cargarEstadisticas, hasRequiredRole]);

  // Manejar cambios en filtros
  const handleFiltroChange = useCallback(
    (
      key: keyof FiltrosUsuarios,
      value: string | UserRole | boolean | number | undefined
    ) => {
      setFiltros((prev) => ({
        ...prev,
        [key]: value,
        page:
          key !== "page" ? 1 : typeof value === "number" ? value : prev.page,
      }));
    },
    []
  );

  // Limpiar filtros
  const limpiarFiltros = useCallback(() => {
    setFiltros({
      busqueda: "",
      role: undefined,
      activo: undefined,
      page: 1,
      limit: 10,
    });
  }, []);

  // Manejar creación de usuario
  const handleCrearUsuario = useCallback(
    async (datos: CrearUsuarioData): Promise<boolean> => {
      const resultado = await crearUsuario(datos);
      if (resultado) {
        mostrarNotificacion("success", "¡Usuario creado correctamente!");
        cargarUsuarios();
        cargarEstadisticas();
        return true;
      }
      return false;
    },
    [crearUsuario, cargarUsuarios, cargarEstadisticas, mostrarNotificacion]
  );

  // Manejar actualización de usuario
  const handleActualizarUsuario = useCallback(
    async (id: string, datos: ActualizarUsuarioData): Promise<boolean> => {
      const resultado = await actualizarUsuario(id, datos);
      if (resultado) {
        mostrarNotificacion("success", "¡Usuario actualizado correctamente!");
        setUsuarioSeleccionado(null);
        cargarUsuarios();
        cargarEstadisticas();
        return true;
      }
      return false;
    },
    [actualizarUsuario, cargarUsuarios, cargarEstadisticas, mostrarNotificacion]
  );

  // Manejar editar usuario
  const abrirModalEditar = useCallback((usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalEditar(true);
  }, []);

  // Manejar cambiar contraseña
  const abrirModalContrasena = useCallback((usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalContrasena(true);
  }, []);

  // Manejar eliminar usuario
  const abrirModalEliminar = useCallback((usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setModalConfirmarEliminar(true);
  }, []);

  // Manejar eliminación de usuario
  const handleEliminarUsuario = useCallback(async () => {
    if (!usuarioSeleccionado) return;

    const resultado = await eliminarUsuario(usuarioSeleccionado.id);
    if (resultado) {
      mostrarNotificacion("success", "¡Usuario eliminado correctamente!");
      setModalConfirmarEliminar(false);
      setUsuarioSeleccionado(null);
      cargarUsuarios();
      cargarEstadisticas();
    }
  }, [
    usuarioSeleccionado,
    eliminarUsuario,
    cargarUsuarios,
    cargarEstadisticas,
    mostrarNotificacion,
  ]);

  // Manejar cambio de estado
  const handleCambiarEstado = useCallback(
    async (usuario: Usuario, nuevoEstado: boolean) => {
      const resultado = await cambiarEstado(usuario.id, nuevoEstado);
      if (resultado) {
        const mensaje = nuevoEstado
          ? "Usuario activado exitosamente"
          : "Usuario desactivado exitosamente";
        mostrarNotificacion("success", mensaje);
        cargarUsuarios();
        cargarEstadisticas();
      }
    },
    [cambiarEstado, cargarUsuarios, cargarEstadisticas, mostrarNotificacion]
  );

  // Manejar cambio de rol
  const handleCambiarRol = useCallback(
    async (usuario: Usuario, nuevoRol: UserRole) => {
      const resultado = await cambiarRol(usuario.id, nuevoRol);
      if (resultado) {
        mostrarNotificacion("success", "Rol actualizado exitosamente");
        cargarUsuarios();
        cargarEstadisticas();
      }
    },
    [cambiarRol, cargarUsuarios, cargarEstadisticas, mostrarNotificacion]
  );

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      mostrarNotificacion("error", error);
    }
  }, [error, mostrarNotificacion]);

  // Helper para determinar si el botón debe estar deshabilitado
  const isEliminarDisabled = useCallback(
    (usuario: Usuario) => {
      return (
        loading ||
        (usuario._count?.ventas && usuario._count.ventas > 0) ||
        (usuario._count?.anulaciones && usuario._count.anulaciones > 0) ||
        false
      );
    },
    [loading]
  );

  // Helper para obtener el color del rol
  const getRolColor = useCallback((role: UserRole) => {
    const colores: Record<UserRole, string> = {
      ADMINISTRADOR: "bg-purple-900/40 text-purple-300 border-purple-700/50",
      VENDEDOR: "bg-blue-900/40 text-blue-300 border-blue-700/50",
      OPERADOR_EMBARCACION: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
    };
    return colores[role];
  }, []);

  // Helper para obtener el icono del rol
  const getRolIcon = useCallback((role: UserRole) => {
    const iconos: Record<UserRole, React.ReactNode> = {
      ADMINISTRADOR: <Shield className="h-4 w-4" />,
      VENDEDOR: <Users className="h-4 w-4" />,
      OPERADOR_EMBARCACION: <Users className="h-4 w-4" />,
    };
    return iconos[role];
  }, []);

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-300">Verificando permisos...</span>
      </div>
    );
  }

  // Pantalla de acceso denegado
  if (!hasRequiredRole) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl p-8 text-center max-w-md">
          <div className="bg-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-slate-300 mb-4">
            Solo los administradores pueden acceder a la gestión de usuarios.
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
    <div className="min-h-screen bg-slate-900 p-3 sm:p-4 lg:p-6 space-y-6 max-w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-100">
            Gestión de Usuarios
          </h1>
          <p className="text-slate-300 mt-1">
            Administra los usuarios del sistema y sus permisos
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
            <span className="whitespace-nowrap">Nuevo Usuario</span>
            <div className="hidden sm:block w-2 h-2 bg-blue-300 rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Total Usuarios */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Total Usuarios
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.totalUsuarios}
                </p>
                <p className="text-xs text-blue-400">
                  {estadisticas.usuariosRecientes} nuevos (30d)
                </p>
              </div>
            </div>
          </div>

          {/* Usuarios Activos */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-green-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-green-600 p-3 rounded-xl shadow-lg">
                <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Usuarios Activos
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.usuariosActivos}
                </p>
                <p className="text-xs text-green-400">Habilitados</p>
              </div>
            </div>
          </div>

          {/* Administradores */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-purple-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-purple-600 p-3 rounded-xl shadow-lg">
                <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Administradores
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.usuariosAdministradores}
                </p>
                <p className="text-xs text-purple-400">Control total</p>
              </div>
            </div>
          </div>

          {/* Con Actividad */}
          <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600/50 p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:ring-2 hover:ring-orange-500 hover:ring-offset-2 hover:ring-offset-slate-900">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/10 to-transparent"></div>
            <div className="flex items-center">
              <div className="bg-orange-600 p-3 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-white flex-shrink-0" />
              </div>
              <div className="ml-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-slate-300 truncate">
                  Con Actividad
                </p>
                <p className="text-lg sm:text-2xl font-bold text-slate-100">
                  {estadisticas.usuariosConVentas}
                </p>
                <p className="text-xs text-orange-400">Con ventas</p>
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
                    placeholder="Buscar por nombre, email o username..."
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
                    Rol
                  </label>
                  <select
                    value={filtros.role || ""}
                    onChange={(e) =>
                      handleFiltroChange(
                        "role",
                        e.target.value === ""
                          ? undefined
                          : (e.target.value as UserRole)
                      )
                    }
                    className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200"
                  >
                    <option value="">Todos los roles</option>
                    <option value="ADMINISTRADOR">Administradores</option>
                    <option value="VENDEDOR">Vendedores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado
                  </label>
                  <select
                    value={
                      filtros.activo === undefined
                        ? ""
                        : filtros.activo
                        ? "true"
                        : "false"
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
                    <option value="">Todos</option>
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

        {/* Tabla de usuarios */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-slate-300">Cargando usuarios...</span>
            </div>
          ) : usuarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-200 mb-2">
                No hay usuarios registrados
              </h3>
              <p className="text-slate-400">
                Los usuarios aparecerán aquí una vez que los registres.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-600">
              <thead className="bg-gradient-to-r from-slate-700 to-slate-600 border-b-2 border-slate-500">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Email/Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Actividad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-100 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-600">
                {usuarios.map((usuario) => (
                  <tr
                    key={usuario.id}
                    className="hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-slate-100">
                          {usuario.nombre} {usuario.apellido}
                        </div>
                        <div className="text-sm text-slate-400">
                          {new Date(usuario.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-slate-200">
                          {usuario.email}
                        </div>
                        <div className="text-sm text-slate-400">
                          @{usuario.username}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${getRolColor(
                            usuario.role
                          )}`}
                        >
                          {getRolIcon(usuario.role)}
                          <span className="ml-1">{usuario.role}</span>
                        </span>
                        <div className="relative group">
                          <button className="p-1 text-slate-400 hover:text-slate-300 transition-colors">
                            <Settings className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                            <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                              {Object.values([
                                "ADMINISTRADOR",
                                "VENDEDOR",
                              ] as UserRole[]).map(
                                (rol) =>
                                  rol !== usuario.role && (
                                    <button
                                      key={rol}
                                      onClick={() =>
                                        handleCambiarRol(usuario, rol)
                                      }
                                      className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                                    >
                                      Cambiar a {rol}
                                    </button>
                                  )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 ${
                            usuario.activo
                              ? "bg-green-900/40 text-green-300 border-green-700/50"
                              : "bg-red-900/40 text-red-300 border-red-700/50"
                          }`}
                        >
                          {usuario.activo ? (
                            <UserCheck className="h-4 w-4" />
                          ) : (
                            <UserX className="h-4 w-4" />
                          )}
                          <span className="ml-1">
                            {usuario.activo ? "Activo" : "Inactivo"}
                          </span>
                        </span>
                        <div className="relative group">
                          <button className="p-1 text-slate-400 hover:text-slate-300 transition-colors">
                            <Settings className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10">
                            <div className="bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden">
                              <button
                                onClick={() =>
                                  handleCambiarEstado(usuario, !usuario.activo)
                                }
                                className="block w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                              >
                                {usuario.activo ? "Desactivar" : "Activar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                            usuario._count?.ventas && usuario._count.ventas > 0
                              ? "bg-blue-900/40 text-blue-300 border-blue-700/50"
                              : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                          }`}
                        >
                          {usuario._count?.ventas || 0} ventas
                        </span>
                        <br />
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                            usuario._count?.anulaciones &&
                            usuario._count.anulaciones > 0
                              ? "bg-orange-900/40 text-orange-300 border-orange-700/50"
                              : "bg-slate-700/50 text-slate-300 border-slate-600/50"
                          }`}
                        >
                          {usuario._count?.anulaciones || 0} anulaciones
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => abrirModalEditar(usuario)}
                          className="text-blue-400 hover:text-blue-300 p-2 hover:bg-blue-900/30 rounded-xl transition-all duration-200"
                          title="Editar usuario"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => abrirModalContrasena(usuario)}
                          className="text-yellow-400 hover:text-yellow-300 p-2 hover:bg-yellow-900/30 rounded-xl transition-all duration-200"
                          title="Cambiar contraseña"
                        >
                          <Key className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => abrirModalEliminar(usuario)}
                          className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                          title="Eliminar usuario"
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
      <NuevoUsuarioForm
        isOpen={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onSubmit={handleCrearUsuario}
        loading={loading}
        error={error}
      />

      <EditarUsuarioForm
        isOpen={modalEditar}
        onClose={() => setModalEditar(false)}
        onSubmit={handleActualizarUsuario}
        usuario={usuarioSeleccionado}
        loading={loading}
        error={error}
      />

      <CambiarContrasenaForm
        isOpen={modalContrasena}
        onClose={() => setModalContrasena(false)}
        onSubmit={handleActualizarUsuario}
        usuario={usuarioSeleccionado}
        loading={loading}
        error={error}
      />

      {/* Modal Confirmar Eliminar */}
      {modalConfirmarEliminar && usuarioSeleccionado && (
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
                ¿Estás seguro de que deseas eliminar al usuario{" "}
                <span className="font-semibold text-slate-100">
                  {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido}
                </span>
                ?
              </p>
              {((usuarioSeleccionado._count?.ventas &&
                usuarioSeleccionado._count.ventas > 0) ||
                (usuarioSeleccionado._count?.anulaciones &&
                  usuarioSeleccionado._count.anulaciones > 0)) && (
                <div className="bg-orange-900/40 border border-orange-700/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-orange-400 mr-3 flex-shrink-0" />
                    <p className="text-sm text-orange-300">
                      Este usuario tiene{" "}
                      {usuarioSeleccionado._count?.ventas || 0} ventas y{" "}
                      {usuarioSeleccionado._count?.anulaciones || 0} anulaciones
                      registradas. No podrás eliminarlo.
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
                  onClick={handleEliminarUsuario}
                  disabled={isEliminarDisabled(usuarioSeleccionado)}
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
