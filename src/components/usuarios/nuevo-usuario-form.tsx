// components/usuarios/nuevo-usuario-form.tsx
"use client";
import { useState, useEffect, Fragment } from "react";
import { X, ChevronsUpDown, Check, Eye, EyeOff } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { UserRole, CrearUsuarioData } from "@/types";

interface NuevoUsuarioFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (datos: CrearUsuarioData) => Promise<boolean>;
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
];

export default function NuevoUsuarioForm({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: NuevoUsuarioFormProps) {
  const [formulario, setFormulario] = useState<CrearUsuarioData>({
    email: "",
    username: "",
    password: "",
    nombre: "",
    apellido: "",
    role: "VENDEDOR",
    activo: true,
  });

  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [passwordsCoinciden, setPasswordsCoinciden] = useState(true);

  const resetFormulario = () => {
    setFormulario({
      email: "",
      username: "",
      password: "",
      nombre: "",
      apellido: "",
      role: "VENDEDOR",
      activo: true,
    });
    setErroresValidacion({});
    setMostrarContrasena(false);
    setConfirmarContrasena("");
    setPasswordsCoinciden(true);
  };

  const validarFormulario = (): boolean => {
    const errores: { [key: string]: string } = {};

    // Validar email
    if (!formulario.email.trim()) {
      errores.email = "El email es obligatorio";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formulario.email)) {
        errores.email = "Formato de email inválido";
      }
    }

    // Validar username
    if (!formulario.username.trim()) {
      errores.username = "El username es obligatorio";
    } else if (formulario.username.trim().length < 3) {
      errores.username = "El username debe tener al menos 3 caracteres";
    }

    // Validar contraseña
    if (!formulario.password) {
      errores.password = "La contraseña es obligatoria";
    } else if (formulario.password.length < 8) {
      errores.password = "La contraseña debe tener al menos 8 caracteres";
    } else {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
      if (!passwordRegex.test(formulario.password)) {
        errores.password =
          "Debe contener al menos 1 mayúscula, 1 minúscula y 1 número";
      }
    }

    // Validar confirmación de contraseña
    if (formulario.password !== confirmarContrasena) {
      errores.confirmarContrasena = "Las contraseñas no coinciden";
    }

    // Validar nombre
    if (!formulario.nombre.trim()) {
      errores.nombre = "El nombre es obligatorio";
    } else if (formulario.nombre.trim().length < 2) {
      errores.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (formulario.nombre.trim().length > 50) {
      errores.nombre = "El nombre no puede tener más de 50 caracteres";
    }

    // Validar apellido
    if (!formulario.apellido.trim()) {
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

    if (!validarFormulario()) {
      return;
    }

    const resultado = await onSubmit(formulario);

    if (resultado) {
      resetFormulario();
      onClose();
    }
  };

  const handleInputChange = (
    field: keyof CrearUsuarioData,
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

  // Validación en tiempo real de coincidencia de contraseñas
  useEffect(() => {
    if (confirmarContrasena.length > 0) {
      setPasswordsCoinciden(formulario.password === confirmarContrasena);
    } else {
      setPasswordsCoinciden(true);
    }
  }, [formulario.password, confirmarContrasena]);

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetFormulario();
    }
  }, [isOpen]);

  const rolSeleccionado =
    rolesUsuario.find((r) => r.id === formulario.role) || rolesUsuario[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl drop-shadow-2xl border border-slate-600/50 flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-slate-800/95 backdrop-blur-md z-20 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-100">
            Nuevo Usuario
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <form id="nuevo-usuario-form" onSubmit={handleSubmit}>
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
                      value={formulario.nombre}
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
                      value={formulario.apellido}
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
                    value={formulario.email}
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
                    value={formulario.username}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarContrasena ? "text" : "password"}
                        required
                        value={formulario.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                          erroresValidacion.password
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-slate-600/50 focus:border-blue-500"
                        }`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarContrasena(!mostrarContrasena)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {mostrarContrasena ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {erroresValidacion.password && (
                      <p className="mt-1 text-sm text-red-400">
                        {erroresValidacion.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Confirmar Contraseña *
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarContrasena ? "text" : "password"}
                        required
                        value={confirmarContrasena}
                        onChange={(e) => {
                          setConfirmarContrasena(e.target.value);
                          if (erroresValidacion.confirmarContrasena) {
                            setErroresValidacion((prev) => ({
                              ...prev,
                              confirmarContrasena: "",
                            }));
                          }
                        }}
                        className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                          erroresValidacion.confirmarContrasena
                            ? "border-red-500/50 focus:border-red-500"
                            : "border-slate-600/50 focus:border-blue-500"
                        }`}
                        placeholder="••••••••"
                      />
                    </div>
                    {erroresValidacion.confirmarContrasena && (
                      <p className="mt-1 text-sm text-red-400">
                        {erroresValidacion.confirmarContrasena}
                      </p>
                    )}
                    {!passwordsCoinciden && confirmarContrasena.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2 bg-red-900/30 border border-red-700/50 rounded-lg p-2">
                        <svg
                          className="h-4 w-4 text-red-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        <p className="text-xs text-red-300">
                          Las contraseñas no coinciden
                        </p>
                      </div>
                    )}
                    {passwordsCoinciden && confirmarContrasena.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2 bg-green-900/30 border border-green-700/50 rounded-lg p-2">
                        <svg
                          className="h-4 w-4 text-green-400 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <p className="text-xs text-green-300">
                          Las contraseñas coinciden
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-blue-300 mb-2">
                    Requisitos de contraseña
                  </h4>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>• Mínimo 8 caracteres</li>
                    <li>• Al menos 1 letra mayúscula</li>
                    <li>• Al menos 1 letra minúscula</li>
                    <li>• Al menos 1 número</li>
                  </ul>
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
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={formulario.activo}
                      onChange={(e) =>
                        handleInputChange("activo", e.target.checked)
                      }
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
            </div>
          </form>
        </div>

        {/* Footer con botones de acción */}
        <div className="border-t border-slate-600/50 bg-slate-800/95 backdrop-blur-md p-6 flex-shrink-0">
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
              form="nuevo-usuario-form"
              disabled={
                loading ||
                !formulario.email.trim() ||
                !formulario.username.trim() ||
                !formulario.password ||
                !formulario.nombre.trim() ||
                !formulario.apellido.trim() ||
                formulario.password !== confirmarContrasena
              }
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creando...</span>
                </div>
              ) : (
                "Crear Usuario"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
