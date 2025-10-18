// components/rutas/editar-ruta-form.tsx - Versión con scroll optimizado
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { X, AlertTriangle, CheckCircle, Plus } from "lucide-react";
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
  validationErrors?: string[];
}

interface DatosRutaBasicos {
  nombre: string;
  puertoOrigen: string;
  puertoDestino: string;
  precio: number;
  activa: boolean;
}

export default function EditarRutaForm({
  isOpen,
  onClose,
  onSubmit,
  ruta,
  loading = false,
  error,
  validationErrors = [],
}: EditarRutaFormProps) {
  const { obtenerEmbarcacionesPorRuta } = useEmbarcacionRutas();

  // Estados separados
  const [datosBasicos, setDatosBasicos] = useState<DatosRutaBasicos>({
    nombre: "",
    puertoOrigen: "",
    puertoDestino: "",
    precio: 0,
    activa: true,
  });

  const [embarcaciones, setEmbarcaciones] = useState<
    CrearEmbarcacionRutaData[]
  >([]);

  const [embarcacionesOriginales, setEmbarcacionesOriginales] = useState<
    EmbarcacionRuta[]
  >([]);

  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  const [mostrarErroresEmbarcaciones, setMostrarErroresEmbarcaciones] =
    useState(false);
  const [errorDetallado, setErrorDetallado] = useState<string | null>(null);
  const [debugMode] = useState(false);

  // Refs para el control de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const embarcacionesContainerRef = useRef<HTMLDivElement>(null);

  // Debug: Log de props recibidas
  useEffect(() => {
    if (debugMode) {
      console.log("📊 EditarRutaForm Props:", {
        isOpen,
        ruta: ruta ? { id: ruta.id, nombre: ruta.nombre } : null,
        loading,
        error,
        validationErrors,
      });
    }
  }, [isOpen, ruta, loading, error, validationErrors, debugMode]);

  // Cargar embarcaciones existentes cuando se abre el modal
  useEffect(() => {
    const cargarEmbarcacionesExistentes = async () => {
      if (ruta?.id) {
        try {
          console.log("🔄 Cargando embarcaciones para ruta:", ruta.id);
          const embarcacionesRuta = await obtenerEmbarcacionesPorRuta(ruta.id);

          if (embarcacionesRuta) {
            console.log("✅ Embarcaciones cargadas:", embarcacionesRuta.length);
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

            setEmbarcaciones(embarcacionesFormulario);
          } else {
            console.log("⚠️ No se pudieron cargar embarcaciones");
          }
        } catch (err) {
          console.error("❌ Error cargando embarcaciones:", err);
          setErrorDetallado(`Error cargando embarcaciones: ${err}`);
        }
      }
    };

    if (isOpen && ruta) {
      cargarEmbarcacionesExistentes();
    }
  }, [isOpen, ruta, obtenerEmbarcacionesPorRuta]);

  // Efecto para mostrar errores de validación automáticamente
  useEffect(() => {
    if (validationErrors && validationErrors.length > 0) {
      console.log(
        "🚨 Detectados errores de validación, mostrando automáticamente:",
        validationErrors
      );
      setMostrarErroresEmbarcaciones(true);
    }
  }, [validationErrors]);

  // Efecto para cargar datos de la ruta cuando se abre el modal
  useEffect(() => {
    if (isOpen && ruta) {
      console.log("📝 Cargando datos de ruta:", ruta);
      setDatosBasicos({
        nombre: ruta.nombre,
        puertoOrigen: ruta.puertoOrigen,
        puertoDestino: ruta.puertoDestino,
        precio: ruta.precio,
        activa: ruta.activa,
      });
      setErroresValidacion({});
      setMostrarErroresEmbarcaciones(false);
      setErrorDetallado(null);
    }
  }, [isOpen, ruta]);

  const validarFormulario = (): boolean => {
    const errores: { [key: string]: string } = {};

    if (!datosBasicos.nombre.trim()) {
      errores.nombre = "El nombre de la ruta es obligatorio";
    }

    if (!datosBasicos.puertoOrigen.trim()) {
      errores.puertoOrigen = "El puerto de origen es obligatorio";
    }

    if (!datosBasicos.puertoDestino.trim()) {
      errores.puertoDestino = "El puerto de destino es obligatorio";
    }

    if (
      datosBasicos.puertoOrigen.trim() &&
      datosBasicos.puertoDestino.trim() &&
      datosBasicos.puertoOrigen.trim().toLowerCase() ===
        datosBasicos.puertoDestino.trim().toLowerCase()
    ) {
      errores.puertoDestino =
        "El puerto de destino debe ser diferente al puerto de origen";
    }

    if (!datosBasicos.precio || datosBasicos.precio <= 0) {
      errores.precio = "El precio debe ser mayor a 0";
    }

    // Validar embarcaciones
    if (embarcaciones.length === 0) {
      errores.embarcaciones = "Debe asignar al menos una embarcación a la ruta";
    } else {
      const embarcacionesConErrores = embarcaciones.some((emb) => {
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

      // Verificar embarcaciones duplicadas
      const embarcacionIds = embarcaciones
        .map((emb) => emb.embarcacionId)
        .filter(Boolean);
      const duplicados = embarcacionIds.filter(
        (id, index) => embarcacionIds.indexOf(id) !== index
      );
      if (duplicados.length > 0) {
        errores.embarcaciones =
          "No se puede asignar la misma embarcación múltiples veces";
      }
    }

    console.log("🔍 Validación de formulario:", {
      errores,
      datosBasicos,
      embarcaciones,
    });
    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("🚀 Iniciando submit de edición de ruta");
    setErrorDetallado(null);

    if (!ruta) {
      setErrorDetallado("No hay ruta seleccionada para editar");
      console.error("❌ No hay ruta seleccionada");
      return;
    }

    if (!validarFormulario()) {
      console.log("❌ Formulario no válido");
      setMostrarErroresEmbarcaciones(true);
      return;
    }

    // Preparar datos para actualización
    const datosActualizacion: ActualizarRutaConEmbarcaciones = {
      nombre: datosBasicos.nombre,
      puertoOrigen: datosBasicos.puertoOrigen,
      puertoDestino: datosBasicos.puertoDestino,
      precio: datosBasicos.precio,
      activa: datosBasicos.activa,
      embarcaciones: {
        // Por simplicidad, eliminamos todas las existentes y creamos las nuevas
        eliminar: embarcacionesOriginales.map((er) => er.id),
        crear: embarcaciones,
      },
    };

    console.log("📤 Datos a enviar:", datosActualizacion);

    try {
      const resultado = await onSubmit(ruta.id, datosActualizacion);
      console.log("📥 Resultado del submit:", resultado);

      if (resultado) {
        console.log("✅ Edición exitosa, cerrando modal");
        onClose();
      } else {
        console.log("❌ Edición falló");
        if (validationErrors && validationErrors.length > 0) {
          setMostrarErroresEmbarcaciones(true);
          console.log("🔍 Errores de validación:", validationErrors);
        }
        if (error) {
          setErrorDetallado(error);
          console.log("🔍 Error general:", error);
        }
      }
    } catch (err) {
      console.error("💥 Error durante submit:", err);
      setErrorDetallado(`Error durante la actualización: ${err}`);
    }
  };

  const handleInputChange = useCallback(
    (field: keyof DatosRutaBasicos, value: string | number | boolean) => {
      setDatosBasicos((prev) => ({
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
    },
    [erroresValidacion]
  );

  const handleEmbarcacionesChange = useCallback(
    (nuevasEmbarcaciones: CrearEmbarcacionRutaData[]) => {
      console.log("🔄 Embarcaciones cambiadas:", nuevasEmbarcaciones);
      setEmbarcaciones(nuevasEmbarcaciones);

      // Limpiar error de embarcaciones si hay al menos una
      if (erroresValidacion.embarcaciones && nuevasEmbarcaciones.length > 0) {
        setErroresValidacion((prev) => ({
          ...prev,
          embarcaciones: "",
        }));
      }

      // Verificar si se han solucionado los problemas de validación
      const embarcacionIds = nuevasEmbarcaciones
        .map((emb) => emb.embarcacionId)
        .filter(Boolean);
      const tieneDuplicados =
        embarcacionIds.filter(
          (id, index) => embarcacionIds.indexOf(id) !== index
        ).length > 0;
      const tieneEmbarcacionesIncompletas = nuevasEmbarcaciones.some(
        (emb) =>
          !emb.embarcacionId ||
          emb.horasSalida.length === 0 ||
          emb.horasSalida.some((hora) => !hora.trim()) ||
          emb.diasOperacion.length === 0
      );

      // Si no hay problemas obvios en el formulario, resetear los errores de validación del servidor
      if (
        !tieneDuplicados &&
        !tieneEmbarcacionesIncompletas &&
        validationErrors &&
        validationErrors.length > 0
      ) {
        console.log(
          "🧹 Limpiando errores de validación del servidor - problemas aparentemente solucionados"
        );
      }
    },
    [erroresValidacion.embarcaciones, validationErrors]
  );

  const handlePrecioChange = (value: string) => {
    // Permitir solo números y punto decimal
    const numValue = parseFloat(value) || 0;
    handleInputChange("precio", numValue);
  };

  // Función para agregar embarcación desde el botón fijo
  const handleAgregarEmbarcacion = useCallback(() => {
    const nuevaEmbarcacion: CrearEmbarcacionRutaData = {
      embarcacionId: "",
      rutaId: ruta?.id || "",
      horasSalida: [""],
      diasOperacion: [],
      activa: true,
    };

    const nuevasEmbarcaciones = [...embarcaciones, nuevaEmbarcacion];
    setEmbarcaciones(nuevasEmbarcaciones);

    // Scroll hacia abajo al agregar nueva embarcación
    setTimeout(() => {
      if (embarcacionesContainerRef.current) {
        embarcacionesContainerRef.current.scrollTop =
          embarcacionesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [embarcaciones, ruta?.id]);

  if (!isOpen || !ruta) return null;

  const hayErroresValidacion =
    (validationErrors && validationErrors.length > 0) ||
    Object.keys(erroresValidacion).length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl drop-shadow-2xl border border-slate-600/50">
        {/* Header fijo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-slate-800/95 backdrop-blur-md rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-slate-100">
              Editar Ruta
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenido scrolleable principal */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="space-y-8">
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
                    value={datosBasicos.nombre}
                    onChange={(e) =>
                      handleInputChange("nombre", e.target.value)
                    }
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
                      Origen *
                    </label>
                    <input
                      type="text"
                      required
                      value={datosBasicos.puertoOrigen}
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
                      Destino *
                    </label>
                    <input
                      type="text"
                      required
                      value={datosBasicos.puertoDestino}
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
                      value={datosBasicos.precio}
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
                        handleInputChange("activa", !datosBasicos.activa)
                      }
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 shadow-lg ${
                        datosBasicos.activa
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-slate-600 hover:bg-slate-500"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${
                          datosBasicos.activa
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                    <span
                      className={`text-sm font-medium transition-colors duration-200 ${
                        datosBasicos.activa
                          ? "text-green-400"
                          : "text-slate-400"
                      }`}
                    >
                      {datosBasicos.activa ? "Activa para ventas" : "Inactiva"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Las rutas activas estarán disponibles para seleccionar en
                    las ventas
                  </p>
                </div>
              </div>

              {/* Selección de embarcaciones con botón fijo */}
              <div className="space-y-6">
                {/* Header con botón fijo */}
                <div className="flex items-center justify-between sticky top-0 bg-slate-800/95 backdrop-blur-md z-10 py-2 -mx-6 px-6 border-b border-slate-600/50">
                  <h3 className="text-lg font-medium text-slate-100">
                    Asignación de Embarcaciones
                  </h3>
                  <button
                    type="button"
                    onClick={handleAgregarEmbarcacion}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Agregar Embarcación</span>
                  </button>
                </div>

                {/* Contenedor de embarcaciones con scroll propio */}
                <div
                  ref={embarcacionesContainerRef}
                  className="max-h-96 overflow-y-auto bg-slate-700/20 rounded-xl p-4 border border-slate-600/30"
                >
                  <SeleccionarEmbarcaciones
                    embarcacionesSeleccionadas={embarcaciones}
                    onChange={handleEmbarcacionesChange}
                    rutaId={ruta.id}
                    mostrarBotonAgregar={false} // Ocultamos el botón interno
                  />
                </div>

                {erroresValidacion.embarcaciones && (
                  <p className="text-sm text-red-400">
                    {erroresValidacion.embarcaciones}
                  </p>
                )}
              </div>

              {/* Errores de validación globales */}
              {(error ||
                errorDetallado ||
                (validationErrors && validationErrors.length > 0)) && (
                <div className="mb-6 space-y-3">
                  {(error || errorDetallado) && (
                    <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                        <div>
                          <p className="text-red-300 font-medium">
                            Error general
                          </p>
                          <p className="text-red-200 text-sm mt-1">
                            {errorDetallado || error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  {validationErrors &&
                    validationErrors.length > 0 &&
                    mostrarErroresEmbarcaciones && (
                      <div className="bg-orange-900/40 border border-orange-700/50 rounded-xl p-4 backdrop-blur-sm">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-orange-400 mr-3 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-orange-300 font-medium">
                              Errores de validación de embarcaciones
                            </p>
                            <p className="text-orange-200 text-sm mt-1">
                              Las siguientes embarcaciones ya están asignadas a
                              otras rutas y no se pueden usar:
                            </p>
                            <ul className="text-orange-200 text-sm mt-2 space-y-1">
                              {validationErrors.map((errorMsg, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{errorMsg}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="mt-3 text-xs text-orange-300 bg-orange-900/20 p-2 rounded-lg">
                              💡 <strong>Solución:</strong> Selecciona
                              embarcaciones diferentes o desactiva las
                              embarcaciones problemáticas en el componente de
                              selección.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Espaciado adicional */}
              <div className="h-6"></div>
            </div>
          </div>
        </div>

        {/* Footer fijo */}
        <div className="flex justify-end space-x-4 p-6 border-t border-slate-600/50 bg-slate-800/95 backdrop-blur-md flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              !datosBasicos.nombre.trim() ||
              datosBasicos.precio <= 0 ||
              embarcaciones.length === 0 ||
              hayErroresValidacion
            }
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Guardando...</span>
              </>
            ) : hayErroresValidacion ? (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Revisar errores</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Actualizar Ruta</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
