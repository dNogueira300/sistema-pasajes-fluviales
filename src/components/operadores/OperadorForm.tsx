"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  X,
  Ship,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import EmbarcacionSelector from "./EmbarcacionSelector";
import ConfirmModal from "@/components/ui/ConfirmModal";

const formSchema = z.object({
  nombre: z.string().min(2, "Mínimo 2 caracteres").max(100),
  apellido: z.string().min(2, "Mínimo 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  username: z.string().min(4, "Mínimo 4 caracteres").max(50),
  embarcacionAsignadaId: z.string().optional(),
  estadoOperador: z.enum(["ACTIVO", "INACTIVO"]),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface OperadorFormProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  defaultValues?: {
    nombre?: string;
    apellido?: string;
    email?: string;
    username?: string;
    embarcacionAsignadaId?: string;
    estadoOperador?: string;
    id?: string;
  };
  onSubmit: (data: FormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function OperadorForm({
  isOpen,
  onClose,
  mode,
  defaultValues,
  onSubmit,
  isSubmitting,
}: OperadorFormProps) {
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);
  const hasInitialized = useRef(false);

  const schema =
    mode === "create"
      ? formSchema
          .refine((d) => d.password && d.password.length >= 8, {
            message: "Mínimo 8 caracteres",
            path: ["password"],
          })
          .refine((d) => d.password && /[A-Z]/.test(d.password), {
            message: "Debe tener una mayúscula",
            path: ["password"],
          })
          .refine((d) => d.password && /[a-z]/.test(d.password), {
            message: "Debe tener una minúscula",
            path: ["password"],
          })
          .refine((d) => d.password && /[0-9]/.test(d.password), {
            message: "Debe tener un número",
            path: ["password"],
          })
          .refine((d) => d.password === d.confirmPassword, {
            message: "Las contraseñas no coinciden",
            path: ["confirmPassword"],
          })
      : formSchema;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: defaultValues?.nombre || "",
      apellido: defaultValues?.apellido || "",
      email: defaultValues?.email || "",
      username: defaultValues?.username || "",
      embarcacionAsignadaId: defaultValues?.embarcacionAsignadaId || "",
      estadoOperador:
        (defaultValues?.estadoOperador as "ACTIVO" | "INACTIVO") || "ACTIVO",
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password");
  const nombreValue = watch("nombre");
  const apellidoValue = watch("apellido");

  // Reset form SOLO cuando se abre el modal (no cuando se cierra)
  useEffect(() => {
    if (isOpen && !hasInitialized.current) {
      hasInitialized.current = true;
      setStep(1);
      setShowConfirmModal(false);
      setPendingData(null);
      reset({
        nombre: defaultValues?.nombre || "",
        apellido: defaultValues?.apellido || "",
        email: defaultValues?.email || "",
        username: defaultValues?.username || "",
        embarcacionAsignadaId: defaultValues?.embarcacionAsignadaId || "",
        estadoOperador:
          (defaultValues?.estadoOperador as "ACTIVO" | "INACTIVO") || "ACTIVO",
        password: "",
        confirmPassword: "",
      });
    }
    if (!isOpen) {
      hasInitialized.current = false;
    }
  }, [isOpen, defaultValues, reset]);

  // Escape to close (solo si no hay modal de confirmación abierto)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showConfirmModal) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose, showConfirmModal]);

  const goToStep2 = useCallback(async () => {
    const fieldsToValidate: (keyof FormData)[] = ["nombre", "apellido", "email", "username"];
    if (mode === "create") {
      fieldsToValidate.push("password", "confirmPassword");
    }
    const valid = await trigger(fieldsToValidate);
    if (valid) setStep(2);
  }, [trigger, mode]);

  // Manejar el submit - mostrar modal de confirmación
  const onFormSubmit = handleSubmit(async (data) => {
    setPendingData(data);
    setShowConfirmModal(true);
  });

  // Confirmar y guardar - NO cambiar el step aquí
  const handleConfirmSave = async () => {
    if (pendingData) {
      try {
        await onSubmit(pendingData);
        // Solo cerrar después de éxito
        setShowConfirmModal(false);
        setPendingData(null);
      } catch {
        // Si hay error, solo cerrar el modal de confirmación
        setShowConfirmModal(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-2xl border border-slate-600/50">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-600/50 sticky top-0 bg-slate-800/95 backdrop-blur-md rounded-t-2xl z-10">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                {mode === "create" ? "Nuevo Operador" : "Editar Operador"}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Paso {step} de 2 —{" "}
                {step === 1 ? "Datos Personales" : "Asignación de Embarcación"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2 px-6 pt-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === 1
                  ? "bg-blue-600/20 text-blue-400 border border-blue-600/40"
                  : "bg-green-600/20 text-green-400 border border-green-600/40"
              }`}
            >
              {step > 1 ? <CheckCircle className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
              Datos Personales
            </div>
            <ChevronRight className="h-4 w-4 text-slate-500" />
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === 2
                  ? "bg-blue-600/20 text-blue-400 border border-blue-600/40"
                  : "bg-slate-700/50 text-slate-500 border border-slate-600/40"
              }`}
            >
              <Ship className="h-3.5 w-3.5" />
              Embarcación
            </div>
          </div>

          {/* Form */}
          <form onSubmit={onFormSubmit} className="p-6">
            {/* Step 1: Datos personales */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Nombre *
                    </label>
                    <input
                      {...register("nombre")}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      placeholder="Nombre del operador"
                    />
                    {errors.nombre && (
                      <p className="mt-1 text-xs text-red-400">{errors.nombre.message}</p>
                    )}
                  </div>

                  {/* Apellido */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Apellido *
                    </label>
                    <input
                      {...register("apellido")}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      placeholder="Apellido del operador"
                    />
                    {errors.apellido && (
                      <p className="mt-1 text-xs text-red-400">{errors.apellido.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Email *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        {...register("email")}
                        type="email"
                        className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Username *
                    </label>
                    <input
                      {...register("username")}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      placeholder="Nombre de usuario"
                      disabled={mode === "edit"}
                    />
                    {errors.username && (
                      <p className="mt-1 text-xs text-red-400">{errors.username.message}</p>
                    )}
                  </div>

                  {/* Password - solo create */}
                  {mode === "create" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Contraseña *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            {...register("password")}
                            type={showPassword ? "text" : "password"}
                            className="w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Contraseña segura"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {errors.password && (
                          <p className="mt-1 text-xs text-red-400">
                            {errors.password.message}
                          </p>
                        )}
                        <PasswordStrengthIndicator password={passwordValue || ""} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                          Confirmar Contraseña *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            {...register("confirmPassword")}
                            type={showConfirmPassword ? "text" : "password"}
                            className="w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                            placeholder="Repetir contraseña"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="mt-1 text-xs text-red-400">
                            {errors.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Next button */}
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Embarcación */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Embarcación */}
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Embarcación Asignada
                  </label>
                  <EmbarcacionSelector
                    value={watch("embarcacionAsignadaId") || ""}
                    onChange={(id) => setValue("embarcacionAsignadaId", id)}
                    error={errors.embarcacionAsignadaId?.message}
                    excludeOperadorId={defaultValues?.id}
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Estado del Operador
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer px-4 py-3 bg-slate-700/30 border border-slate-600 rounded-xl hover:border-green-600/50 transition-colors">
                      <input
                        {...register("estadoOperador")}
                        type="radio"
                        value="ACTIVO"
                        className="w-4 h-4 text-green-500 bg-slate-700 border-slate-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-green-400 font-medium">Activo</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer px-4 py-3 bg-slate-700/30 border border-slate-600 rounded-xl hover:border-red-600/50 transition-colors">
                      <input
                        {...register("estadoOperador")}
                        type="radio"
                        value="INACTIVO"
                        className="w-4 h-4 text-red-500 bg-slate-700 border-slate-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-slate-400 font-medium">Inactivo</span>
                    </label>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700/50 border border-slate-600 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Save className="h-4 w-4" />
                    {mode === "create" ? "Crear Operador" : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Modal de confirmación */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setPendingData(null);
        }}
        onConfirm={handleConfirmSave}
        title={mode === "create" ? "Confirmar Creación" : "Confirmar Cambios"}
        message={
          mode === "create"
            ? `¿Estás seguro de crear el operador "${nombreValue} ${apellidoValue}"?`
            : `¿Estás seguro de guardar los cambios del operador "${nombreValue} ${apellidoValue}"?`
        }
        confirmText={mode === "create" ? "Crear Operador" : "Guardar Cambios"}
        cancelText="Cancelar"
        variant="info"
        isLoading={isSubmitting}
      />
    </>
  );
}
