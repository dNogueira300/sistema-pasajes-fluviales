// components/rutas/nueva-ruta-form.tsx - Versión con dos pasos
"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  X,
  AlertTriangle,
  CheckCircle,
  Plus,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { CrearRutaConEmbarcaciones, CrearEmbarcacionRutaData } from "@/types";
import SeleccionarEmbarcaciones from "./seleccionar-embarcaciones";

interface NuevaRutaFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (datos: CrearRutaConEmbarcaciones) => Promise<boolean>;
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

export default function NuevaRutaForm({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error,
  validationErrors = [],
}: NuevaRutaFormProps) {
  // Estado del paso actual (1 o 2)
  const [pasoActual, setPasoActual] = useState(1);

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

  const [erroresValidacion, setErroresValidacion] = useState<{
    [key: string]: string;
  }>({});

  const [mostrarErroresEmbarcaciones, setMostrarErroresEmbarcaciones] =
    useState(false);

  // Refs para el control de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const embarcacionesContainerRef = useRef<HTMLDivElement>(null);

  const resetFormulario = useCallback(() => {
    setDatosBasicos({
      nombre: "",
      puertoOrigen: "",
      puertoDestino: "",
      precio: 0,
      activa: true,
    });
    setEmbarcaciones([]);
    setErroresValidacion({});
    setMostrarErroresEmbarcaciones(false);
    setPasoActual(1);
  }, []);

  const validarPaso1 = (): boolean => {
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

    if (datosBasicos.precio > 1000) {
      errores.precio = "El precio no puede ser mayor a 1000 soles";
    }

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const validarPaso2 = (): boolean => {
    const errores: { [key: string]: string } = {};

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

    setErroresValidacion(errores);
    return Object.keys(errores).length === 0;
  };

  const handleSiguientePaso = () => {
    if (pasoActual === 1) {
      if (validarPaso1()) {
        setPasoActual(2);
        // Limpiar errores al cambiar de paso
        setErroresValidacion({});
      }
    }
  };

  const handlePasoAnterior = () => {
    if (pasoActual === 2) {
      setPasoActual(1);
      // Limpiar errores al cambiar de paso
      setErroresValidacion({});
      setMostrarErroresEmbarcaciones(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pasoActual === 1) {
      handleSiguientePaso();
      return;
    }

    if (!validarPaso2()) {
      setMostrarErroresEmbarcaciones(true);
      return;
    }

    // Combinamos los datos para enviar
    const datosCompletos: CrearRutaConEmbarcaciones = {
      ...datosBasicos,
      embarcaciones,
    };

    const resultado = await onSubmit(datosCompletos);

    if (resultado) {
      resetFormulario();
      onClose();
    } else {
      if (validationErrors && validationErrors.length > 0) {
        setMostrarErroresEmbarcaciones(true);
      }
    }
  };

  const handleInputChange = useCallback(
    (field: keyof DatosRutaBasicos, value: string | number | boolean) => {
      setDatosBasicos((prev) => ({
        ...prev,
        [field]: value,
      }));

      // Limpiar errores del campo actual
      if (erroresValidacion[field]) {
        setErroresValidacion((prev) => {
          const nuevosErrores = { ...prev };
          delete nuevosErrores[field];
          return nuevosErrores;
        });
      }

      // Si se cambia origen o destino, limpiar errores de ambos puertos
      if (field === "puertoOrigen" || field === "puertoDestino") {
        setErroresValidacion((prev) => {
          const nuevosErrores = { ...prev };
          delete nuevosErrores.puertoOrigen;
          delete nuevosErrores.puertoDestino;
          return nuevosErrores;
        });
      }
    },
    [erroresValidacion]
  );

  const handleEmbarcacionesChange = useCallback(
    (nuevasEmbarcaciones: CrearEmbarcacionRutaData[]) => {
      setEmbarcaciones(nuevasEmbarcaciones);

      // Limpiar errores si corresponde
      if (erroresValidacion.embarcaciones && nuevasEmbarcaciones.length > 0) {
        setErroresValidacion((prev) => {
          const nuevosErrores = { ...prev };
          delete nuevosErrores.embarcaciones;
          return nuevosErrores;
        });
      }

      if (mostrarErroresEmbarcaciones) {
        setMostrarErroresEmbarcaciones(false);
      }
    },
    [erroresValidacion.embarcaciones, mostrarErroresEmbarcaciones]
  );

  const handlePrecioChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    handleInputChange("precio", numValue);
  };

  const handleAgregarEmbarcacion = useCallback(() => {
    const nuevaEmbarcacion: CrearEmbarcacionRutaData = {
      embarcacionId: "",
      rutaId: "",
      horasSalida: [""],
      diasOperacion: [],
      activa: true,
    };

    const nuevasEmbarcaciones = [...embarcaciones, nuevaEmbarcacion];
    setEmbarcaciones(nuevasEmbarcaciones);

    setTimeout(() => {
      if (embarcacionesContainerRef.current) {
        embarcacionesContainerRef.current.scrollTop =
          embarcacionesContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [embarcaciones]);

  useEffect(() => {
    if (error && error.toLowerCase().includes("nombre")) {
      setErroresValidacion((prev) => ({
        ...prev,
        nombre: error,
      }));
      setPasoActual(1); // Volver al paso 1 si hay error en el nombre
    }
  }, [error]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        resetFormulario();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, resetFormulario]);

  if (!isOpen) return null;

  const hayErroresValidacion =
    (validationErrors && validationErrors.length > 0) ||
    Object.keys(erroresValidacion).length > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/95 backdrop-blur-md rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl drop-shadow-2xl border border-slate-600/50">
        {/* Header fijo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-600/50 bg-slate-800/95 backdrop-blur-md rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Nueva Ruta</h2>
            <p className="text-sm text-slate-400 mt-1">
              Paso {pasoActual} de 2:{" "}
              {pasoActual === 1
                ? "Información de la Ruta"
                : "Asignación de Embarcaciones"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center justify-center p-4 border-b border-slate-600/30 bg-slate-700/30">
          <div className="flex items-center space-x-4">
            {/* Paso 1 */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold transition-all duration-200 ${
                  pasoActual === 1
                    ? "bg-blue-600 text-white"
                    : "bg-green-600 text-white"
                }`}
              >
                {pasoActual > 1 ? <CheckCircle className="h-5 w-5" /> : "1"}
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  pasoActual === 1 ? "text-blue-400" : "text-green-400"
                }`}
              >
                Información
              </span>
            </div>

            {/* Línea divisoria */}
            <div className="w-16 h-0.5 bg-slate-600"></div>

            {/* Paso 2 */}
            <div className="flex items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold transition-all duration-200 ${
                  pasoActual === 2
                    ? "bg-blue-600 text-white"
                    : "bg-slate-600 text-slate-400"
                }`}
              >
                2
              </div>
              <span
                className={`ml-2 text-sm font-medium ${
                  pasoActual === 2 ? "text-blue-400" : "text-slate-400"
                }`}
              >
                Embarcaciones
              </span>
            </div>
          </div>
        </div>

        {/* Contenido scrolleable */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div className="p-6">
            <form id="nueva-ruta-form" onSubmit={handleSubmit}>
              {/* PASO 1: Información de la Ruta */}
              {pasoActual === 1 && (
                <div className="space-y-6">
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
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 z-10">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000"
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
                      Precio entre 0.01 y 1000 soles peruanos
                    </p>
                  </div>

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
                        {datosBasicos.activa
                          ? "Activa para ventas"
                          : "Inactiva"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      Las rutas activas estarán disponibles para seleccionar en
                      las ventas
                    </p>
                  </div>
                </div>
              )}

              {/* PASO 2: Asignación de Embarcaciones */}
              {pasoActual === 2 && (
                <div className="space-y-6">
                  {/* Header con botón fijo */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-100">
                      Embarcaciones para la Ruta
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

                  {/* Contenedor de embarcaciones */}
                  <div
                    ref={embarcacionesContainerRef}
                    className="max-h-96 overflow-y-auto bg-slate-700/20 rounded-xl p-4 border border-slate-600/30"
                  >
                    <SeleccionarEmbarcaciones
                      embarcacionesSeleccionadas={embarcaciones}
                      onChange={handleEmbarcacionesChange}
                      mostrarBotonAgregar={false}
                    />
                  </div>

                  {erroresValidacion.embarcaciones && (
                    <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-4 backdrop-blur-sm">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                        <p className="text-red-300 text-sm">
                          {erroresValidacion.embarcaciones}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Errores de validación globales */}
                  {(error ||
                    (validationErrors && validationErrors.length > 0)) && (
                    <div className="space-y-3">
                      {error && !error.toLowerCase().includes("nombre") && (
                        <div className="bg-red-900/40 border border-red-700/50 rounded-xl p-4 backdrop-blur-sm">
                          <div className="flex items-center">
                            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 flex-shrink-0" />
                            <div>
                              <p className="text-red-300 font-medium">
                                Error general
                              </p>
                              <p className="text-red-200 text-sm mt-1">
                                {error}
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
                                <ul className="text-orange-200 text-sm mt-2 space-y-1">
                                  {validationErrors.map((errorMsg, index) => (
                                    <li
                                      key={index}
                                      className="flex items-start"
                                    >
                                      <span className="mr-2">•</span>
                                      <span>{errorMsg}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Footer con botones de navegación */}
        <div className="flex justify-between p-6 border-t border-slate-600/50 bg-slate-800/95 backdrop-blur-md flex-shrink-0">
          <div>
            {pasoActual === 2 && (
              <button
                type="button"
                onClick={handlePasoAnterior}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Anterior</span>
              </button>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
              Cancelar
            </button>

            {pasoActual === 1 ? (
              <button
                type="button"
                onClick={handleSiguientePaso}
                disabled={
                  loading ||
                  !datosBasicos.nombre.trim() ||
                  !datosBasicos.puertoOrigen.trim() ||
                  !datosBasicos.puertoDestino.trim() ||
                  datosBasicos.precio <= 0
                }
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
              >
                <span>Siguiente</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="submit"
                form="nueva-ruta-form"
                disabled={
                  loading || embarcaciones.length === 0 || hayErroresValidacion
                }
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl active:shadow-lg shadow-lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Crear Ruta</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
