// components/embarcaciones/nueva-embarcacion-form.tsx
"use client";
import { useState, useEffect, Fragment } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Listbox, Transition } from "@headlessui/react";
import { EstadoEmbarcacion, CrearEmbarcacionData } from "@/types";
import Modal from "@/components/ui/Modal";

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

  // Track changes for hasChanges prop
  const hasChanges =
    formulario.nombre.trim() !== "" ||
    formulario.capacidad > 0 ||
    formulario.tipo !== "" ||
    formulario.estado !== "ACTIVA";

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

    // VALIDACIÓN ACTUALIZADA DE CAPACIDAD
    if (!formulario.capacidad || formulario.capacidad < 10) {
      errores.capacidad = "La capacidad debe ser al menos 10 pasajeros";
    } else if (formulario.capacidad > 200) {
      errores.capacidad = "La capacidad no puede ser mayor a 200 pasajeros";
    } else {
      // Validar máximo 3 dígitos
      const capacidadString = formulario.capacidad.toString();
      if (capacidadString.length > 3) {
        errores.capacidad = "La capacidad debe tener máximo 3 dígitos";
      }
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
    // Validar que solo tenga números
    const regex = /^\d*$/;

    if (!regex.test(value) && value !== "") {
      return; // No permitir caracteres no numéricos
    }

    // Validar máximo 3 dígitos
    if (value.length > 3 && value !== "") {
      return;
    }

    // Validar que no sea mayor a 200
    const numValue = parseInt(value) || 0;
    if (numValue > 200) {
      return;
    }

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
        form="nueva-embarcacion-form"
        disabled={
          loading ||
          !formulario.nombre.trim() ||
          formulario.capacidad < 10 ||
          formulario.capacidad > 200 ||
          formulario.capacidad.toString().length > 3 // Nueva validación
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
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nueva Embarcación"
      hasChanges={hasChanges}
      footer={footer}
    >
      <div className="p-6">
        <form id="nueva-embarcacion-form" onSubmit={handleSubmit} className="space-y-6">
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
                min="10"
                max="200"
                required
                value={formulario.capacidad || ""}
                onChange={(e) => handleCapacidadChange(e.target.value)}
                onBlur={(e) => {
                  // Validación adicional al perder foco
                  if (e.target.value && parseInt(e.target.value) < 10) {
                    setErroresValidacion((prev) => ({
                      ...prev,
                      capacidad: "La capacidad mínima es 10 pasajeros",
                    }));
                  }
                }}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                  erroresValidacion.capacidad
                    ? "border-red-500/50 focus:border-red-500"
                    : "border-slate-600/50 focus:border-blue-500"
                }`}
                placeholder="10"
              />
              {erroresValidacion.capacidad && (
                <p className="mt-1 text-sm text-red-400">
                  {erroresValidacion.capacidad}
                </p>
              )}
              <p className="mt-1 text-sm text-slate-400">
                Entre 10 y 200 pasajeros (máximo 3 dígitos)
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
        </form>
      </div>
    </Modal>
  );
}
