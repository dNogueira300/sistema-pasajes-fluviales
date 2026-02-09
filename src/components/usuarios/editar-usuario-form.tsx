// components/usuarios/editar-usuario-form.tsx
"use client";
import { useState, useEffect, Fragment } from "react";
import { ChevronsUpDown, Check, AlertTriangle, Ship, Edit3 } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { Usuario, UserRole, ActualizarUsuarioData } from "@/types";
import EmbarcacionSelector from "@/components/operadores/EmbarcacionSelector";
import Modal from "@/components/ui/Modal";

// Extender el tipo Usuario para incluir campos de operador
interface UsuarioConOperador extends Usuario {
  embarcacionAsignadaId?: string | null;
  estadoOperador?: string | null;
  embarcacionAsignada?: {
    id: string;
    nombre: string;
    capacidad: number;
  } | null;
}

interface EditarUsuarioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, datos: ActualizarUsuarioData) => Promise<boolean>;
  usuario: UsuarioConOperador | null;
  loading?: boolean;
  error?: string | null;
}

const rolesUsuario = [
  {
    id: "VENDEDOR" as UserRole,
    nombre: "Vendedor",
    descripcion: "Puede realizar ventas y gestionar clientes",
    color: "text-blue-400",
  },
  {
    id: "ADMINISTRADOR" as UserRole,
    nombre: "Administrador",
    descripcion: "Acceso completo al sistema",
    color: "text-purple-400",
  },
  {
    id: "OPERADOR_EMBARCACION" as UserRole,
    nombre: "Operador de Embarcación",
    descripcion: "Control de embarque y pasajeros",
    color: "text-green-400",
  },
];

export default function EditarUsuarioForm({
  isOpen,
  onClose,
  onSubmit,
  usuario,
  loading = false,
}: EditarUsuarioFormProps) {
  const [formulario, setFormulario] = useState<ActualizarUsuarioData>({
    email: "",
    username: "",
    nombre: "",
    apellido: "",
    role: "VENDEDOR",
    activo: true,
    embarcacionAsignadaId: null,
    estadoOperador: "ACTIVO",
  });

  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  const [mostrarConfirmacionDesactivar, setMostrarConfirmacionDesactivar] =
    useState(false);
  const [mostrarConfirmacionActualizar, setMostrarConfirmacionActualizar] =
    useState(false);

  // Efecto para cargar datos del usuario cuando se abre el modal
  useEffect(() => {
    if (isOpen && usuario) {
      setFormulario({
        email: usuario.email,
        username: usuario.username,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        role: usuario.role,
        activo: usuario.activo,
        embarcacionAsignadaId: usuario.embarcacionAsignadaId || null,
        estadoOperador: (usuario.estadoOperador as "ACTIVO" | "INACTIVO") || "ACTIVO",
      });
      setErroresValidacion({});
    }
  }, [isOpen, usuario]);

  const validarFormulario = (): boolean => {
    const errores: { [key: string]: string } = {};

    // Validar email
    if (!formulario.email?.trim()) {
      errores.email = "El email es obligatorio";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formulario.email)) {
        errores.email = "Formato de email inválido";
      }
    }

    // Validar username
    if (!formulario.username?.trim()) {
      errores.username = "El username es obligatorio";
    } else if (formulario.username.trim().length < 3) {
      errores.username = "El username debe tener al menos 3 caracteres";
    }

    // Validar nombre
    if (!formulario.nombre?.trim()) {
      errores.nombre = "El nombre es obligatorio";
    } else if (formulario.nombre.trim().length < 2) {
      errores.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (formulario.nombre.trim().length > 50) {
      errores.nombre = "El nombre no puede tener más de 50 caracteres";
    }

    // Validar apellido
    if (!formulario.apellido?.trim()) {
      errores.apellido = "El apellido es obligatorio";
    } else if (formulario.apellido.trim().length < 2) {
      errores.apellido = "El apellido debe tener al menos 2 caracteres";
    } else if (formulario.apellido.trim().length > 50) {
      errores.apellido = "El apellido no puede tener más de 50 caracteres";
    }

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario || !validarFormulario()) return;

    setMostrarConfirmacionActualizar(true);
  };

  const confirmarActualizacion = async () => {
    if (!usuario) return;

    const resultado = await onSubmit(usuario.id, formulario);

    if (resultado) {
      onClose();
    } else {
      setMostrarConfirmacionActualizar(false);
    }
  };

  const cancelarConfirmacionActualizar = () => {
    setMostrarConfirmacionActualizar(false);
  };

  const handleInputChange = (
    field: keyof ActualizarUsuarioData,
    value: string | UserRole | boolean
  ) => {
    setFormulario((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validación en tiempo real para nombre y apellido
    if (field === "nombre" && typeof value === "string") {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0 && trimmedValue.length < 2) {
        setErroresValidacion((prev) => ({
          ...prev,
          nombre: "El nombre debe tener al menos 2 caracteres",
        }));
      } else if (trimmedValue.length > 50) {
        setErroresValidacion((prev) => ({
          ...prev,
          nombre: "El nombre no puede tener más de 50 caracteres",
        }));
      } else {
        setErroresValidacion((prev) => ({
          ...prev,
          nombre: "",
        }));
      }
    } else if (field === "apellido" && typeof value === "string") {
      const trimmedValue = value.trim();
      if (trimmedValue.length > 0 && trimmedValue.length < 2) {
        setErroresValidacion((prev) => ({
          ...prev,
          apellido: "El apellido debe tener al menos 2 caracteres",
        }));
      } else if (trimmedValue.length > 50) {
        setErroresValidacion((prev) => ({
          ...prev,
          apellido: "El apellido no puede tener más de 50 caracteres",
        }));
      } else {
        setErroresValidacion((prev) => ({
          ...prev,
          apellido: "",
        }));
      }
    } else {
      // Limpiar error de validación cuando el usuario empiece a escribir en otros campos
      if (erroresValidacion[field]) {
        setErroresValidacion((prev) => ({
          ...prev,
          [field]: "",
        }));
      }
    }
  };

  const handleActivoChange = (checked: boolean) => {
    // Si está intentando desactivar el usuario (cambiar de true a false)
    if (formulario.activo && !checked) {
      setMostrarConfirmacionDesactivar(true);
    } else {
      handleInputChange("activo", checked);
    }
  };

  const confirmarDesactivacion = () => {
    handleInputChange("activo", false);
    setMostrarConfirmacionDesactivar(false);
  };

  const cancelarDesactivacion = () => {
    setMostrarConfirmacionDesactivar(false);
  };

  if (!usuario) return null;

  const rolSeleccionado =
    rolesUsuario.find((r) => r.id === formulario.role) || rolesUsuario[0];

  // Check if there are changes compared to original usuario
  const hasChanges = usuario && (
    formulario.email !== usuario.email ||
    formulario.username !== usuario.username ||
    formulario.nombre !== usuario.nombre ||
    formulario.apellido !== usuario.apellido ||
    formulario.role !== usuario.role ||
    formulario.activo !== usuario.activo ||
    formulario.embarcacionAsignadaId !== (usuario.embarcacionAsignadaId || null) ||
    formulario.estadoOperador !== (usuario.estadoOperador || "ACTIVO")
  );

  const footerContent = (
    <div className="flex justify-end space-x-4">
      <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="px-6 py-3 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="editar-usuario-form"
        disabled={
          loading ||
          !formulario.email?.trim() ||
          !formulario.username?.trim() ||
          !formulario.nombre?.trim() ||
          !formulario.apellido?.trim()
        }
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Guardando...</span>
          </div>
        ) : (
          "Actualizar Usuario"
        )}
      </button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Editar Usuario"
        hasChanges={hasChanges}
        footer={footerContent}
      >
        <form id="editar-usuario-form" onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200 border-b border-slate-600/50 pb-2">
                Información Personal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.nombre || ""}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                      erroresValidacion.nombre
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-slate-600/50 focus:border-blue-500"
                    }`}
                    placeholder="Ej: Juan"
                  />
                  {erroresValidacion.nombre && (
                    <p className="mt-1 text-sm text-red-400">
                      {erroresValidacion.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.apellido || ""}
                    onChange={(e) =>
                      handleInputChange("apellido", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                      erroresValidacion.apellido
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-slate-600/50 focus:border-blue-500"
                    }`}
                    placeholder="Ej: Pérez"
                  />
                  {erroresValidacion.apellido && (
                    <p className="mt-1 text-sm text-red-400">
                      {erroresValidacion.apellido}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Credenciales de Acceso */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200 border-b border-slate-600/50 pb-2">
                Credenciales de Acceso
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formulario.email || ""}
                  onChange={(e) =>
                    handleInputChange("email", e.target.value.toLowerCase())
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                    erroresValidacion.email
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-slate-600/50 focus:border-blue-500"
                  }`}
                  placeholder="usuario@ejemplo.com"
                />
                {erroresValidacion.email && (
                  <p className="mt-1 text-sm text-red-400">
                    {erroresValidacion.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={formulario.username || ""}
                  onChange={(e) =>
                    handleInputChange(
                      "username",
                      e.target.value.toLowerCase()
                    )
                  }
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                    erroresValidacion.username
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-slate-600/50 focus:border-blue-500"
                  }`}
                  placeholder="usuario123"
                />
                {erroresValidacion.username && (
                  <p className="mt-1 text-sm text-red-400">
                    {erroresValidacion.username}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Mínimo 3 caracteres, se convertirá a minúsculas
                  automáticamente
                </p>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-yellow-300 mb-2">
                  Cambio de contraseña
                </h4>
                <p className="text-xs text-yellow-200">
                  La contraseña actual no se mostrará por seguridad. Para
                  cambiarla, usa el botón Cambiar Contraseña en la lista de
                  usuarios.
                </p>
              </div>
            </div>

            {/* Configuración del Usuario */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-slate-200 border-b border-slate-600/50 pb-2">
                Configuración del Usuario
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rol del Usuario
                </label>
                <Listbox
                  value={rolSeleccionado}
                  onChange={(rol) => handleInputChange("role", rol.id)}
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm">
                      <span className="flex items-center">
                        <span className="block truncate text-slate-100">
                          {rolSeleccionado.nombre}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">
                          - {rolSeleccionado.descripcion}
                        </span>
                      </span>
                      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                        <ChevronsUpDown
                          className="h-5 w-5 text-slate-400"
                          aria-hidden="true"
                        />
                      </span>
                    </Listbox.Button>
                    <Transition
                      as={Fragment}
                      leave="transition ease-in duration-100"
                      leaveFrom="opacity-100"
                      leaveTo="opacity-0"
                    >
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-slate-800 border border-slate-600/50 shadow-2xl backdrop-blur-md">
                        {rolesUsuario.map((rol) => (
                          <Listbox.Option
                            key={rol.id}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                                active ? "bg-slate-700/50" : ""
                              }`
                            }
                            value={rol}
                          >
                            {({ selected }) => (
                              <>
                                <span className="flex items-center">
                                  <span
                                    className={`block truncate ${
                                      selected
                                        ? `font-semibold ${rol.color}`
                                        : "font-normal text-slate-200"
                                    }`}
                                  >
                                    {rol.nombre}
                                  </span>
                                  <span className="ml-2 text-xs text-slate-400">
                                    - {rol.descripcion}
                                  </span>
                                </span>
                                {selected ? (
                                  <span
                                    className={`absolute inset-y-0 right-0 flex items-center pr-3 ${rol.color}`}
                                  >
                                    <Check
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                ) : null}
                              </>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </Transition>
                  </div>
                </Listbox>
                <div className="mt-2 text-xs text-slate-400">
                  <div className="space-y-1">
                    <div>
                      <strong>Administrador:</strong> Acceso completo al
                      sistema, puede gestionar usuarios, embarcaciones, rutas
                      y ventas
                    </div>
                    <div>
                      <strong>Vendedor:</strong> Puede realizar ventas,
                      gestionar clientes y ver reportes básicos
                    </div>
                    <div>
                      <strong>Operador de Embarcación:</strong> Control de
                      embarque y gestión de pasajeros en la embarcación asignada
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección de Embarcación - Solo visible para OPERADOR_EMBARCACION */}
              {formulario.role === "OPERADOR_EMBARCACION" && (
                <div className="space-y-4 p-4 bg-green-900/20 border border-green-700/30 rounded-xl">
                  <div className="flex items-center gap-2 text-green-300">
                    <Ship className="h-5 w-5" />
                    <h4 className="font-medium">Asignación de Embarcación</h4>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Embarcación Asignada
                    </label>
                    <EmbarcacionSelector
                      value={formulario.embarcacionAsignadaId || ""}
                      onChange={(embarcacionId) =>
                        setFormulario((prev) => ({
                          ...prev,
                          embarcacionAsignadaId: embarcacionId || null,
                        }))
                      }
                      excludeOperadorId={usuario?.id}
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      Seleccione la embarcación que operará este usuario
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Estado del Operador
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="estadoOperadorEdit"
                          value="ACTIVO"
                          checked={formulario.estadoOperador === "ACTIVO"}
                          onChange={() =>
                            setFormulario((prev) => ({
                              ...prev,
                              estadoOperador: "ACTIVO",
                            }))
                          }
                          className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 focus:ring-green-500"
                        />
                        <span className="text-sm text-green-400">Activo</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="estadoOperadorEdit"
                          value="INACTIVO"
                          checked={formulario.estadoOperador === "INACTIVO"}
                          onChange={() =>
                            setFormulario((prev) => ({
                              ...prev,
                              estadoOperador: "INACTIVO",
                            }))
                          }
                          className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-slate-400">Inactivo</span>
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      Solo los operadores activos pueden controlar embarques
                    </p>
                  </div>

                  {/* Info de embarcación actual si existe */}
                  {usuario?.embarcacionAsignada && (
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                      <p className="text-xs text-slate-400 mb-1">Embarcación actual:</p>
                      <p className="text-sm text-slate-200 font-medium">
                        {usuario.embarcacionAsignada.nombre}
                        <span className="text-slate-400 font-normal ml-2">
                          (Cap: {usuario.embarcacionAsignada.capacidad})
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formulario.activo}
                    onChange={(e) => handleActivoChange(e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <div>
                    <span className="text-sm font-medium text-slate-300">
                      Usuario activo
                    </span>
                    <p className="text-xs text-slate-400">
                      El usuario podrá iniciar sesión y usar el sistema
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Información adicional sobre el uso actual */}
            {((usuario._count?.ventas ?? 0) > 0 ||
              (usuario._count?.anulaciones ?? 0) > 0) && (
              <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-300 mb-2">
                  Información de actividad
                </h4>
                <div className="text-xs text-blue-200 space-y-1">
                  <div>Ventas realizadas: {usuario._count?.ventas ?? 0}</div>
                  <div>
                    Anulaciones registradas:{" "}
                    {usuario._count?.anulaciones ?? 0}
                  </div>
                  <div className="mt-2 text-blue-300">
                    <strong>Nota:</strong> Desactivar este usuario no afectará
                    las ventas existentes, pero le impedirá acceder al
                    sistema.
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Modal de confirmación para desactivar usuario */}
      {mostrarConfirmacionDesactivar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-slate-600/50">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-yellow-900/30 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Confirmar desactivación
                </h3>
              </div>

              <p className="text-slate-300 mb-6">
                ¿Estás seguro de que deseas desactivar este usuario?
                <br />
                <br />
                <span className="text-sm text-slate-400">
                  El usuario{" "}
                  <strong className="text-slate-200">
                    {usuario?.nombre} {usuario?.apellido}
                  </strong>{" "}
                  no podrá iniciar sesión ni acceder al sistema hasta que sea
                  reactivado.
                </span>
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelarDesactivacion}
                  className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarDesactivacion}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all duration-200"
                >
                  Sí, desactivar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para actualizar usuario */}
      {mostrarConfirmacionActualizar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-slate-600/50">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-900/30 p-3 rounded-xl">
                  <Edit3 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Confirmar actualización
                </h3>
              </div>

              <p className="text-slate-300 mb-4">
                ¿Estás seguro de que deseas actualizar los datos de este usuario?
              </p>

              <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nombre:</span>
                    <span className="text-slate-200 font-medium">
                      {formulario.nombre} {formulario.apellido}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-200">{formulario.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Username:</span>
                    <span className="text-slate-200">@{formulario.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rol:</span>
                    <span className={`font-medium ${
                      formulario.role === "ADMINISTRADOR"
                        ? "text-purple-400"
                        : formulario.role === "OPERADOR_EMBARCACION"
                        ? "text-green-400"
                        : "text-blue-400"
                    }`}>
                      {rolesUsuario.find(r => r.id === formulario.role)?.nombre || formulario.role}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estado:</span>
                    <span className={formulario.activo ? "text-green-400" : "text-red-400"}>
                      {formulario.activo ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelarConfirmacionActualizar}
                  disabled={loading}
                  className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarActualizacion}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Guardando...</span>
                    </div>
                  ) : (
                    "Sí, actualizar"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
