// components/rutas/editar-ruta-form.tsx
"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import {
  Ruta,
  ActualizarRutaConEmbarcaciones,
  CrearEmbarcacionRutaData,
  EmbarcacionRuta,
} from "@/types";
import { useEmbarcacionRutas } from "@/hooks/use-embarcacion-rutas";
import SeleccionarEmbarcaciones from "./seleccionar-embarcaciones";

interface EditarRutaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: string,
    datos: ActualizarRutaConEmbarcaciones
  ) => Promise<boolean>;
  ruta: Ruta | null;
  loading?: boolean;
  error?: string | null;
}

interface DatosRuta {
  nombre: string;
  puertoOrigen: string;
  puertoDestino: string;
  precio: number;
  activa: boolean;
  embarcaciones: CrearEmbarcacionRutaData[];
}

export default function EditarRutaForm({
  isOpen,
  onClose,
  onSubmit,
  ruta,
  loading = false,
}: EditarRutaFormProps) {
  const { obtenerEmbarcacionesPorRuta } = useEmbarcacionRutas();
  const [formulario, setFormulario] = useState<DatosRuta>({
    nombre: "",
    puertoOrigen: "",
    puertoDestino: "",
    precio: 0,
    activa: true,
    embarcaciones: [],
  });

  const [embarcacionesOriginales, setEmbarcacionesOriginales] = useState<
    EmbarcacionRuta[]
  >([]);

  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  // Cargar embarcaciones existentes cuando se abre el modal
  useEffect(() => {
    const cargarEmbarcacionesExistentes = async () => {
      if (ruta?.id) {
        const embarcacionesRuta = await obtenerEmbarcacionesPorRuta(ruta.id);
        if (embarcacionesRuta) {
          setEmbarcacionesOriginales(embarcacionesRuta);

          // Convertir a formato del formulario
          const embarcacionesFormulario = embarcacionesRuta.map(
            (er: EmbarcacionRuta) => ({
              embarcacionId: er.embarcacionId,
              rutaId: er.rutaId,
              horasSalida: er.horasSalida,
              diasOperacion: er.diasOperacion,
              activa: er.activa,
            })
          );

          setFormulario((prev) => ({
            ...prev,
            embarcaciones: embarcacionesFormulario,
          }));
        }
      }
    };

    if (isOpen && ruta) {
      cargarEmbarcacionesExistentes();
    }
  }, [isOpen, ruta, obtenerEmbarcacionesPorRuta]);

  // Efecto para cargar datos de la ruta cuando se abre el modal
  useEffect(() => {
    if (isOpen && ruta) {
      setFormulario({
        nombre: ruta.nombre,
        puertoOrigen: ruta.puertoOrigen,
        puertoDestino: ruta.puertoDestino,
        precio: ruta.precio,
        activa: ruta.activa,
        embarcaciones: [], // Se carga por separado en el efecto anterior
      });
      setErroresValidacion({});
    }
  }, [isOpen, ruta]);

  const validarFormulario = (): boolean => {
    const errores: { [key: string]: string } = {};

    if (!formulario.nombre.trim()) {
      errores.nombre = "El nombre de la ruta es obligatorio";
    }

    if (!formulario.puertoOrigen.trim()) {
      errores.puertoOrigen = "El puerto de origen es obligatorio";
    }

    if (!formulario.puertoDestino.trim()) {
      errores.puertoDestino = "El puerto de destino es obligatorio";
    }

    if (
      formulario.puertoOrigen.trim() &&
      formulario.puertoDestino.trim() &&
      formulario.puertoOrigen.trim().toLowerCase() ===
        formulario.puertoDestino.trim().toLowerCase()
    ) {
      errores.puertoDestino =
        "El puerto de destino debe ser diferente al puerto de origen";
    }

    if (!formulario.precio || formulario.precio <= 0) {
      errores.precio = "El precio debe ser mayor a 0";
    }

    // Validar embarcaciones
    if (formulario.embarcaciones.length === 0) {
      errores.embarcaciones = "Debe asignar al menos una embarcación a la ruta";
    } else {
      const embarcacionesConErrores = formulario.embarcaciones.some((emb) => {
        return (
          !emb.embarcacionId ||
          emb.horasSalida.length === 0 ||
          emb.horasSalida.some((hora) => !hora.trim()) ||
          emb.diasOperacion.length === 0
        );
      });

      if (embarcacionesConErrores) {
        errores.embarcaciones =
          "Todas las embarcaciones deben tener una embarcación seleccionada, al menos un horario y al menos un día de operación";
      }
    }

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!ruta || !validarFormulario()) return;

    // Preparar datos para actualización
    const datosActualizacion: ActualizarRutaConEmbarcaciones = {
      nombre: formulario.nombre,
      puertoOrigen: formulario.puertoOrigen,
      puertoDestino: formulario.puertoDestino,
      precio: formulario.precio,
      activa: formulario.activa,
      embarcaciones: {
        // Por simplicidad, eliminamos todas las existentes y creamos las nuevas
        // En una implementación más sofisticada, se podría hacer un diff
        eliminar: embarcacionesOriginales.map((er) => er.id),
        crear: formulario.embarcaciones,
      },
    };

    const resultado = await onSubmit(ruta.id, datosActualizacion);

    if (resultado) {
      onClose();
    }
  };

  const handleInputChange = (
    field: keyof Omit<DatosRuta, "embarcaciones">,
    value: string | number | boolean
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

  const handleEmbarcacionesChange = (
    embarcaciones: CrearEmbarcacionRutaData[]
  ) => {
    setFormulario((prev) => ({
      ...prev,
      embarcaciones,
    }));

    // Limpiar error de embarcaciones si hay al menos una
    if (erroresValidacion.embarcaciones && embarcaciones.length > 0) {
      setErroresValidacion((prev) => ({
        ...prev,
        embarcaciones: "",
      }));
    }
  };

  const handlePrecioChange = (value: string) => {
    // Permitir solo números y punto decimal
    const numValue = parseFloat(value) || 0;
    handleInputChange("precio", numValue);
  };

  if (!isOpen || !ruta) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl drop-shadow-2xl border border-slate-600/50">
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 sticky top-0 bg-slate-800/95 backdrop-blur-md rounded-t-2xl z-20">
          <h2 className="text-xl font-semibold text-slate-100">Editar Ruta</h2>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Información básica de la ruta */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-slate-100 border-b border-slate-600/50 pb-2">
                Información de la Ruta
              </h3>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nombre de la Ruta *
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
                  placeholder="Ej: Iquitos - Yurimaguas"
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
                    Puerto de Origen *
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.puertoOrigen}
                    onChange={(e) =>
                      handleInputChange("puertoOrigen", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                      erroresValidacion.puertoOrigen
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-slate-600/50 focus:border-blue-500"
                    }`}
                    placeholder="Ej: Iquitos"
                  />
                  {erroresValidacion.puertoOrigen && (
                    <p className="mt-1 text-sm text-red-400">
                      {erroresValidacion.puertoOrigen}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Puerto de Destino *
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.puertoDestino}
                    onChange={(e) =>
                      handleInputChange("puertoDestino", e.target.value)
                    }
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                      erroresValidacion.puertoDestino
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-slate-600/50 focus:border-blue-500"
                    }`}
                    placeholder="Ej: Yurimaguas"
                  />
                  {erroresValidacion.puertoDestino && (
                    <p className="mt-1 text-sm text-red-400">
                      {erroresValidacion.puertoDestino}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Precio *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formulario.precio}
                    onChange={(e) => handlePrecioChange(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 placeholder-slate-400 backdrop-blur-sm transition-all duration-200 ${
                      erroresValidacion.precio
                        ? "border-red-500/50 focus:border-red-500"
                        : "border-slate-600/50 focus:border-blue-500"
                    }`}
                    placeholder="0.00"
                  />
                </div>
                {erroresValidacion.precio && (
                  <p className="mt-1 text-sm text-red-400">
                    {erroresValidacion.precio}
                  </p>
                )}
                <p className="mt-1 text-xs text-slate-400">
                  Precio por pasaje en soles peruanos
                </p>
              </div>

              {/* Toggle Button para Estado Activo */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Estado de la Ruta
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleInputChange("activa", !formulario.activa)
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-lg ${
                      formulario.activa
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-slate-600 hover:bg-slate-500"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                        formulario.activa ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-sm font-medium transition-colors duration-200 ${
                      formulario.activa ? "text-green-400" : "text-slate-400"
                    }`}
                  >
                    {formulario.activa ? "Activa para ventas" : "Inactiva"}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Las rutas activas estarán disponibles para seleccionar en las
                  ventas
                </p>
              </div>
            </div>

            {/* Selección de embarcaciones */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-slate-100 border-b border-slate-600/50 pb-2">
                Asignación de Embarcaciones
              </h3>

              <SeleccionarEmbarcaciones
                embarcacionesSeleccionadas={formulario.embarcaciones}
                onChange={handleEmbarcacionesChange}
                rutaId={ruta.id}
              />

              {erroresValidacion.embarcaciones && (
                <p className="text-sm text-red-400">
                  {erroresValidacion.embarcaciones}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600/50">
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
                  formulario.precio <= 0 ||
                  formulario.embarcaciones.length === 0
                }
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </div>
                ) : (
                  "Actualizar Ruta"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
