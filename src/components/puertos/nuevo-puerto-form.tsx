// components/puertos/NuevoPuertoForm.tsx
"use client";
import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";

interface NuevoPuertoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (datos: DatosPuerto) => Promise<boolean>;
  loading?: boolean;
  error?: string | null;
}

interface DatosPuerto {
  nombre: string;
  descripcion: string;
  direccion: string;
  activo: boolean;
}

export default function NuevoPuertoForm({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: NuevoPuertoFormProps) {
  const [formulario, setFormulario] = useState<DatosPuerto>({
    nombre: "",
    descripcion: "",
    direccion: "",
    activo: true,
  });

  const resetFormulario = () => {
    setFormulario({
      nombre: "",
      descripcion: "",
      direccion: "",
      activo: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resultado = await onSubmit(formulario);

    if (resultado) {
      resetFormulario();
      onClose();
    }
  };

  const handleInputChange = (
    field: keyof DatosPuerto,
    value: string | boolean
  ) => {
    setFormulario((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetFormulario();
    }
  }, [isOpen]);

  // Track changes: true when any field is non-empty or activo is false
  const hasChanges =
    formulario.nombre.trim() !== "" ||
    formulario.descripcion.trim() !== "" ||
    formulario.direccion.trim() !== "" ||
    formulario.activo === false;

  const footer = (
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
        form="nuevo-puerto-form"
        disabled={loading || !formulario.nombre.trim()}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
      >
        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Guardando...</span>
          </div>
        ) : (
          "Crear Puerto"
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Puerto de Embarque"
      footer={footer}
      hasChanges={hasChanges}
      maxWidth="2xl"
    >
      <div className="p-6">
        <form id="nuevo-puerto-form" onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Puerto *
            </label>
            <input
              type="text"
              required
              value={formulario.nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
              placeholder="Ej: Puerto Masusa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción
            </label>
            <textarea
              value={formulario.descripcion}
              onChange={(e) =>
                handleInputChange("descripcion", e.target.value)
              }
              rows={3}
              className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 resize-none backdrop-blur-sm transition-all duration-200"
              placeholder="Descripción del puerto (opcional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={formulario.direccion}
              onChange={(e) => handleInputChange("direccion", e.target.value)}
              className="w-full px-4 py-3 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200"
              placeholder="Ej: Jr. Nanay 123, Iquitos"
            />
          </div>

          {/* Toggle Button para Estado Activo con tema oscuro */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Estado del Puerto
            </label>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() =>
                  handleInputChange("activo", !formulario.activo)
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-lg ${
                  formulario.activo
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-slate-600 hover:bg-slate-500"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                    formulario.activo ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span
                className={`text-sm font-medium transition-colors duration-200 ${
                  formulario.activo ? "text-green-400" : "text-slate-400"
                }`}
              >
                {formulario.activo ? "Activo para ventas" : "Inactivo"}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Los puertos activos estarán disponibles para seleccionar en las
              ventas
            </p>
          </div>
        </form>
      </div>
    </Modal>
  );
}
