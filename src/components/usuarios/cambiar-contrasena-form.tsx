// components/usuarios/cambiar-contrasena-form.tsx
"use client";
import { useState, useEffect } from "react";
import { X, Eye, EyeOff, Key } from "lucide-react";
import { Usuario, ActualizarUsuarioData } from "@/types";

interface CambiarContrasenaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, datos: ActualizarUsuarioData) => Promise<boolean>;
  usuario: Usuario | null;
  loading?: boolean;
  error?: string | null;
}

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

  const resetFormulario = () => {
    setFormulario({
      password: "",
      confirmarPassword: "",
    });
    setErroresValidacion({});
    setMostrarContrasena(false);
  };

  const validarFormulario = (): boolean => {
    const errores: { [key: string]: string } = {};

    // Validar contraseña
    if (!formulario.password) {
      errores.password = "La nueva contraseña es obligatoria";
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
    if (!formulario.confirmarPassword) {
      errores.confirmarPassword = "Debes confirmar la nueva contraseña";
    } else if (formulario.password !== formulario.confirmarPassword) {
      errores.confirmarPassword = "Las contraseñas no coinciden";
    }

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!usuario || !validarFormulario()) return;

    const resultado = await onSubmit(usuario.id, {
      password: formulario.password,
    });

    if (resultado) {
      resetFormulario();
      onClose();
    }
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

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetFormulario();
    }
  }, [isOpen]);

  if (!isOpen || !usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-md w-full shadow-2xl drop-shadow-2xl border border-slate-600/50">
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-600 p-2 rounded-lg">
              <Key className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">
              Cambiar Contraseña
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

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

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div className="flex justify-end space-x-4 pt-6">
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
                disabled={
                  loading ||
                  !formulario.password ||
                  !formulario.confirmarPassword ||
                  formulario.password !== formulario.confirmarPassword
                }
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
          </form>
        </div>
      </div>
    </div>
  );
}
