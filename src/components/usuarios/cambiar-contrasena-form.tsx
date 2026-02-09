// components/usuarios/cambiar-contrasena-form.tsx
"use client";
import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, Key, AlertTriangle, Check } from "lucide-react";
import { Usuario, ActualizarUsuarioData } from "@/types";
import Modal from "@/components/ui/Modal";

interface CambiarContrasenaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, datos: ActualizarUsuarioData) => Promise<boolean>;
  usuario: Usuario | null;
  loading?: boolean;
  error?: string | null;
}

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  {
    id: "length",
    label: "Mínimo 12 caracteres",
    test: (password) => password.length >= 8,
  },
  {
    id: "uppercase",
    label: "Al menos 1 letra mayúscula",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "Al menos 1 letra minúscula",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "Al menos 1 número",
    test: (password) => /\d/.test(password),
  },
];

export default function CambiarContrasenaForm({
  isOpen,
  onClose,
  onSubmit,
  usuario,
  loading = false,
}: CambiarContrasenaFormProps) {
  const [formulario, setFormulario] = useState({
    password: "",
    confirmarPassword: "",
  });

  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [passwordsCoinciden, setPasswordsCoinciden] = useState(true);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  // Validación en tiempo real de requisitos de contraseña
  const passwordValidation = useMemo(() => {
    return passwordRequirements.map((req) => ({
      ...req,
      passed: req.test(formulario.password),
    }));
  }, [formulario.password]);

  const allRequirementsPassed = passwordValidation.every((req) => req.passed);

  const resetFormulario = () => {
    setFormulario({
      password: "",
      confirmarPassword: "",
    });
    setErroresValidacion({});
    setMostrarContrasena(false);
    setPasswordsCoinciden(true);
    setMostrarConfirmacion(false);
  };

  const validarFormulario = (): boolean => {
    const errores: { [key: string]: string } = {};

    // Validar contraseña
    if (!formulario.password) {
      errores.password = "La nueva contraseña es obligatoria";
    } else if (!allRequirementsPassed) {
      errores.password = "La contraseña no cumple con todos los requisitos";
    }

    // Validar confirmación de contraseña
    if (!formulario.confirmarPassword) {
      errores.confirmarPassword = "Debes confirmar la nueva contraseña";
    } else if (formulario.password !== formulario.confirmarPassword) {
      errores.confirmarPassword = "Las contraseñas no coinciden";
    }

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario || !validarFormulario()) return;
    setMostrarConfirmacion(true);
  };

  const confirmarCambio = async () => {
    if (!usuario) return;

    const resultado = await onSubmit(usuario.id, {
      password: formulario.password,
    });

    if (resultado) {
      resetFormulario();
      onClose();
    } else {
      setMostrarConfirmacion(false);
    }
  };

  const cancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormulario((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error de validación cuando el usuario empiece a escribir
    if (erroresValidacion[field]) {
      setErroresValidacion((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validación en tiempo real de coincidencia de contraseñas
  useEffect(() => {
    if (formulario.confirmarPassword.length > 0) {
      setPasswordsCoinciden(
        formulario.password === formulario.confirmarPassword,
      );
    } else {
      setPasswordsCoinciden(true);
    }
  }, [formulario.password, formulario.confirmarPassword]);

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetFormulario();
    }
  }, [isOpen]);

  if (!usuario) return null;

  const canSubmit =
    formulario.password &&
    formulario.confirmarPassword &&
    allRequirementsPassed &&
    formulario.password === formulario.confirmarPassword;

  // Check if there are changes
  const hasChanges = formulario.password !== "" || formulario.confirmarPassword !== "";

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
        form="cambiar-contrasena-form"
        disabled={loading || !canSubmit}
        className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Cambiando...</span>
          </div>
        ) : (
          "Cambiar Contraseña"
        )}
      </button>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Cambiar Contraseña"
        icon={
          <div className="bg-yellow-600 p-2 rounded-lg">
            <Key className="h-5 w-5 text-white" />
          </div>
        }
        maxWidth="md"
        hasChanges={hasChanges}
        footer={footerContent}
      >
        <div className="p-6">
          {/* Información del usuario */}
          <div className="bg-slate-700/50 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-medium text-slate-300 mb-2">
              Cambiar contraseña para:
            </h3>
            <div className="space-y-1">
              <p className="text-slate-100 font-medium">
                {usuario.nombre} {usuario.apellido}
              </p>
              <p className="text-sm text-slate-400">{usuario.email}</p>
              <p className="text-sm text-slate-400">@{usuario.username}</p>
            </div>
          </div>

          <form
            id="cambiar-contrasena-form"
            onSubmit={handleSubmitClick}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nueva Contraseña *
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
                Confirmar Nueva Contraseña *
              </label>
              <div className="relative">
                <input
                  type={mostrarContrasena ? "text" : "password"}
                  required
                  value={formulario.confirmarPassword}
                  onChange={(e) =>
                    handleInputChange("confirmarPassword", e.target.value)
                  }
                  className={`w-full px-4 py-3 pr-12 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                    erroresValidacion.confirmarPassword
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-slate-600/50 focus:border-blue-500"
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {erroresValidacion.confirmarPassword && (
                <p className="mt-1 text-sm text-red-400">
                  {erroresValidacion.confirmarPassword}
                </p>
              )}
              {!passwordsCoinciden &&
                formulario.confirmarPassword.length > 0 && (
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
              {passwordsCoinciden &&
                formulario.confirmarPassword.length > 0 && (
                  <div className="mt-2 flex items-center space-x-2 bg-green-900/30 border border-green-700/50 rounded-lg p-2">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                    <p className="text-xs text-green-300">
                      Las contraseñas coinciden
                    </p>
                  </div>
                )}
            </div>

            {/* Validación en tiempo real de requisitos */}
            <div className="bg-blue-900/20 border border-blue-700/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-blue-300 mb-3">
                Requisitos de contraseña
              </h4>
              <ul className="space-y-2">
                {passwordValidation.map((req) => (
                  <li
                    key={req.id}
                    className={`flex items-center space-x-2 text-xs transition-colors duration-200 ${
                      req.passed ? "text-green-400" : "text-slate-400"
                    }`}
                  >
                    {req.passed ? (
                      <Check className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <div className="h-4 w-4 flex-shrink-0 rounded-full border border-slate-500" />
                    )}
                    <span>{req.label}</span>
                  </li>
                ))}
              </ul>
              {allRequirementsPassed && formulario.password.length > 0 && (
                <div className="mt-3 pt-3 border-t border-blue-700/30">
                  <p className="text-xs text-green-400 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    La contraseña cumple con todos los requisitos
                  </p>
                </div>
              )}
            </div>

            <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-yellow-300 mb-2">
                Importante
              </h4>
              <p className="text-xs text-yellow-200">
                El usuario deberá usar la nueva contraseña en su próximo inicio
                de sesión. Asegúrate de comunicarle la nueva contraseña de forma
                segura.
              </p>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modal de confirmación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-slate-600/50">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-yellow-900/30 p-3 rounded-xl">
                  <AlertTriangle className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">
                  Confirmar cambio de contraseña
                </h3>
              </div>

              <p className="text-slate-300 mb-6">
                ¿Estás seguro de que deseas cambiar la contraseña de este
                usuario?
                <br />
                <br />
                <span className="text-sm text-slate-400">
                  El usuario{" "}
                  <strong className="text-slate-200">
                    {usuario?.nombre} {usuario?.apellido}
                  </strong>{" "}
                  deberá usar la nueva contraseña en su próximo inicio de
                  sesión.
                </span>
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={cancelarConfirmacion}
                  disabled={loading}
                  className="px-4 py-2 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarCambio}
                  disabled={loading}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Cambiando...</span>
                    </div>
                  ) : (
                    "Sí, cambiar contraseña"
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
