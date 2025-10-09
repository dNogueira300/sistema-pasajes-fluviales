// components/embarcaciones/nueva-embarcacion-form.tsx
"use client";
import { useState, useEffect, Fragment } from "react";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { EstadoEmbarcacion, CrearEmbarcacionData } from "@/types";

interface NuevaEmbarcacionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (datos: CrearEmbarcacionData) => Promise<boolean>;
  loading?: boolean;
  error?: string | null;
}

const tiposEmbarcacion = [
  { id: "", nombre: "Seleccionar tipo" },
  { id: "Ponguero", nombre: "Ponguero" },
  { id: "Lancha", nombre: "Lancha" },
  { id: "Ferry", nombre: "Ferry" },
  { id: "Yate", nombre: "Yate" },
  { id: "Otro", nombre: "Otro" },
];

const estadosEmbarcacion = [
  {
    id: "ACTIVA" as EstadoEmbarcacion,
    nombre: "Activa",
    descripcion: "Lista para operar",
    color: "text-green-400",
  },
  {
    id: "MANTENIMIENTO" as EstadoEmbarcacion,
    nombre: "En Mantenimiento",
    descripcion: "Requiere reparación",
    color: "text-orange-400",
  },
  {
    id: "INACTIVA" as EstadoEmbarcacion,
    nombre: "Inactiva",
    descripcion: "Fuera de servicio",
    color: "text-slate-400",
  },
];

export default function NuevaEmbarcacionForm({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
}: NuevaEmbarcacionFormProps) {
  const [formulario, setFormulario] = useState<CrearEmbarcacionData>({
    nombre: "",
    capacidad: 0,
    estado: "ACTIVA",
    tipo: "",
  });

  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  const resetFormulario = () => {
    setFormulario({
      nombre: "",
      capacidad: 0,
      estado: "ACTIVA",
      tipo: "",
    });
    setErroresValidacion({});
  };

  const validarFormulario = (): boolean => {
    const errores: { [key: string]: string } = {};

    if (!formulario.nombre.trim()) {
      errores.nombre = "El nombre de la embarcación es obligatorio";
    }

    if (!formulario.capacidad || formulario.capacidad <= 0) {
      errores.capacidad = "La capacidad debe ser mayor a 0";
    }

    if (formulario.capacidad > 500) {
      errores.capacidad = "La capacidad no puede ser mayor a 500 pasajeros";
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
    field: keyof CrearEmbarcacionData,
    value: string | number | EstadoEmbarcacion
  ) => {
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

  const handleCapacidadChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    handleInputChange("capacidad", numValue);
  };

  // Resetear formulario cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      resetFormulario();
    }
  }, [isOpen]);

  const tipoSeleccionado =
    tiposEmbarcacion.find((t) => t.id === formulario.tipo) ||
    tiposEmbarcacion[0];
  const estadoSeleccionado =
    estadosEmbarcacion.find((e) => e.id === formulario.estado) ||
    estadosEmbarcacion[0];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl drop-shadow-2xl border border-slate-600/50">
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 sticky top-0 bg-slate-800/95 backdrop-blur-md rounded-t-2xl">
          <h2 className="text-xl font-semibold text-slate-100">
            Nueva Embarcación
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre de la Embarcación *
              </label>
              <input
                type="text"
                required
                value={formulario.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                  erroresValidacion.nombre
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-slate-600/50 focus:border-blue-500"
                }`}
                placeholder="Ej: Estrella del Amazonas"
              />
              {erroresValidacion.nombre && (
                <p className="mt-1 text-sm text-red-400">
                  {erroresValidacion.nombre}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Capacidad de Pasajeros *
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  required
                  value={formulario.capacidad}
                  onChange={(e) => handleCapacidadChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                    erroresValidacion.capacidad
                      ? "border-red-500/50 focus:border-red-500"
                      : "border-slate-600/50 focus:border-blue-500"
                  }`}
                  placeholder="0"
                />
                {erroresValidacion.capacidad && (
                  <p className="mt-1 text-sm text-red-400">
                    {erroresValidacion.capacidad}
                  </p>
                )}
                <p className="mt-1 text-sm text-slate-400">
                  Número máximo de pasajeros que puede transportar
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de Embarcación
                </label>
                <Listbox
                  value={tipoSeleccionado}
                  onChange={(tipo) => handleInputChange("tipo", tipo.id)}
                >
                  <div className="relative">
                    <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm">
                      <span className="block truncate text-slate-100">
                        {tipoSeleccionado.nombre}
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
                        {tiposEmbarcacion.map((tipo) => (
                          <Listbox.Option
                            key={tipo.id}
                            className={({ active }) =>
                              `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                                active
                                  ? "bg-slate-700/50 text-blue-300"
                                  : "text-slate-200"
                              }`
                            }
                            value={tipo}
                          >
                            {({ selected }) => (
                              <>
                                <span
                                  className={`block truncate ${
                                    selected
                                      ? "font-semibold text-blue-300"
                                      : "font-normal"
                                  }`}
                                >
                                  {tipo.nombre}
                                </span>
                                {selected ? (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-400">
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
                <p className="mt-1 text-sm text-slate-400">
                  Opcional - Especifica el tipo de embarcación
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Estado Inicial
              </label>
              <Listbox
                value={estadoSeleccionado}
                onChange={(estado) => handleInputChange("estado", estado.id)}
              >
                <div className="relative">
                  <Listbox.Button className="relative w-full cursor-pointer rounded-xl bg-slate-700/50 border border-slate-600/50 py-3 pl-4 pr-10 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 backdrop-blur-sm">
                    <span className="flex items-center">
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-3 ${estadoSeleccionado.color.replace(
                          "text-",
                          "bg-"
                        )}`}
                      />
                      <span className="block truncate text-slate-100">
                        {estadoSeleccionado.nombre}
                      </span>
                      <span className="ml-2 text-xs text-slate-400">
                        - {estadoSeleccionado.descripcion}
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
                      {estadosEmbarcacion.map((estado) => (
                        <Listbox.Option
                          key={estado.id}
                          className={({ active }) =>
                            `relative cursor-pointer select-none py-3 pl-4 pr-10 ${
                              active ? "bg-slate-700/50" : ""
                            }`
                          }
                          value={estado}
                        >
                          {({ selected }) => (
                            <>
                              <span className="flex items-center">
                                <span
                                  className={`inline-block w-2 h-2 rounded-full mr-3 ${estado.color.replace(
                                    "text-",
                                    "bg-"
                                  )}`}
                                />
                                <span
                                  className={`block truncate ${
                                    selected
                                      ? `font-semibold ${estado.color}`
                                      : "font-normal text-slate-200"
                                  }`}
                                >
                                  {estado.nombre}
                                </span>
                                <span className="ml-2 text-xs text-slate-400">
                                  - {estado.descripcion}
                                </span>
                              </span>
                              {selected ? (
                                <span
                                  className={`absolute inset-y-0 right-0 flex items-center pr-3 ${estado.color}`}
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
              <div className="mt-2 text-sm text-slate-400">
                <div className="space-y-1">
                  <div>
                    <strong>Activa:</strong> La embarcación puede ser asignada a
                    rutas y realizar viajes
                  </div>
                  <div>
                    <strong>Mantenimiento:</strong> La embarcación está en
                    reparación o inspección
                  </div>
                  <div>
                    <strong>Inactiva:</strong> La embarcación no está en uso
                    temporalmente
                  </div>
                </div>
              </div>
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
                  !formulario.nombre.trim() ||
                  formulario.capacidad <= 0
                }
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  "Crear Embarcación"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
