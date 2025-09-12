// components/puertos/EditarPuertoForm.tsx
"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Puerto } from "@/types";

interface EditarPuertoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, datos: DatosPuerto) => Promise<boolean>;
  puerto: Puerto | null;
  loading?: boolean;
  error?: string | null;
}

interface DatosPuerto {
  nombre: string;
  descripcion: string;
  direccion: string;
  activo: boolean;
}

export default function EditarPuertoForm({
  isOpen,
  onClose,
  onSubmit,
  puerto,
  loading = false,
}: EditarPuertoFormProps) {
  const [formulario, setFormulario] = useState<DatosPuerto>({
    nombre: "",
    descripcion: "",
    direccion: "",
    activo: true,
  });

  // Efecto para cargar datos del puerto cuando se abre el modal
  useEffect(() => {
    if (isOpen && puerto) {
      setFormulario({
        nombre: puerto.nombre,
        descripcion: puerto.descripcion || "",
        direccion: puerto.direccion || "",
        activo: puerto.activo,
      });
    }
  }, [isOpen, puerto]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!puerto) return;

    const resultado = await onSubmit(puerto.id, formulario);

    if (resultado) {
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

  if (!isOpen || !puerto) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">
            Editar Puerto de Embarque
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Puerto *
              </label>
              <input
                type="text"
                required
                value={formulario.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Ej: Puerto Masusa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={formulario.descripcion}
                onChange={(e) =>
                  handleInputChange("descripcion", e.target.value)
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 resize-none"
                placeholder="Descripción del puerto (opcional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dirección
              </label>
              <input
                type="text"
                value={formulario.direccion}
                onChange={(e) => handleInputChange("direccion", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Ej: Jr. Nanay 123, Iquitos"
              />
            </div>

            {/* Toggle Button para Estado Activo */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Estado del Puerto
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() =>
                    handleInputChange("activo", !formulario.activo)
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formulario.activo
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform ${
                      formulario.activo ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-sm font-medium ${
                    formulario.activo ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {formulario.activo ? "Activo para ventas" : "Inactivo"}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Los puertos activos estarán disponibles para seleccionar en las
                ventas
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formulario.nombre.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:shadow-md"
              >
                {loading ? "Guardando..." : "Actualizar Puerto"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
