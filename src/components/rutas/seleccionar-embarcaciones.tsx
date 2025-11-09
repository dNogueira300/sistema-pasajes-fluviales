// components/rutas/seleccionar-embarcaciones.tsx - Versión optimizada
"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Ship, Clock, Calendar, AlertTriangle } from "lucide-react";
import { useEmbarcaciones } from "@/hooks/use-embarcaciones";
import {
  Embarcacion,
  CrearEmbarcacionRutaData,
  DIAS_SEMANA,
  DiaSemana,
} from "@/types";

interface SeleccionarEmbarcacionesProps {
  embarcacionesSeleccionadas: CrearEmbarcacionRutaData[];
  onChange: (embarcaciones: CrearEmbarcacionRutaData[]) => void;
  rutaId?: string; // Para modo edición
  mostrarBotonAgregar?: boolean; // Nueva prop para ocultar/mostrar botón
}

interface EmbarcacionFormulario extends CrearEmbarcacionRutaData {
  tempId: string; // ID temporal para el formulario
}

interface ErrorValidacion {
  tempId: string;
  disponible: boolean;
  mensaje: string;
  rutasAsignadas?: Array<{
    id: string;
    nombre: string;
    trayecto: string;
  }>;
}

export default function SeleccionarEmbarcaciones({
  embarcacionesSeleccionadas,
  onChange,
  rutaId,
  mostrarBotonAgregar = true, // Por defecto se muestra
}: SeleccionarEmbarcacionesProps) {
  const { obtenerEmbarcacionesActivas, loading } = useEmbarcaciones();
  const [embarcacionesDisponibles, setEmbarcacionesDisponibles] = useState<
    Embarcacion[]
  >([]);
  const [embarcacionesFormulario, setEmbarcacionesFormulario] = useState<
    EmbarcacionFormulario[]
  >([]);
  const [erroresValidacion, setErroresValidacion] = useState<ErrorValidacion[]>([]);

  // Cargar embarcaciones disponibles
  useEffect(() => {
    const cargarEmbarcaciones = async () => {
      const resultado = await obtenerEmbarcacionesActivas();
      if (resultado) {
        setEmbarcacionesDisponibles(resultado);
      }
    };

    cargarEmbarcaciones();
  }, [obtenerEmbarcacionesActivas]);

  // Sincronizar con embarcaciones seleccionadas externas
  useEffect(() => {
    const embarcacionesConId = embarcacionesSeleccionadas.map((emb, index) => ({
      ...emb,
      tempId: `temp-${index}-${Date.now()}`,
    }));
    setEmbarcacionesFormulario(embarcacionesConId);
  }, [embarcacionesSeleccionadas]);

  // Validar disponibilidad de embarcaciones en tiempo real
  useEffect(() => {
    const validarDisponibilidad = async () => {
      const errores: ErrorValidacion[] = [];

      for (const embForm of embarcacionesFormulario) {
        if (!embForm.embarcacionId) continue;

        try {
          const params = new URLSearchParams({
            embarcacionId: embForm.embarcacionId,
          });

          if (rutaId) {
            params.append("rutaId", rutaId);
          }

          const response = await fetch(
            `/api/embarcacion-rutas/validar-disponibilidad?${params.toString()}`
          );
          const data = await response.json();

          if (!data.disponible) {
            errores.push({
              tempId: embForm.tempId,
              disponible: false,
              mensaje: data.detalles || "Embarcación no disponible",
              rutasAsignadas: data.rutasAsignadas || [],
            });
          }
        } catch (error) {
          console.error("Error validando disponibilidad:", error);
        }
      }

      setErroresValidacion(errores);
    };

    // Debounce: esperar 500ms después de que el usuario deje de seleccionar
    const timer = setTimeout(() => {
      validarDisponibilidad();
    }, 500);

    return () => clearTimeout(timer);
  }, [embarcacionesFormulario, rutaId]);

  const agregarEmbarcacion = () => {
    const nuevaEmbarcacion: EmbarcacionFormulario = {
      tempId: `temp-${Date.now()}`,
      embarcacionId: "",
      rutaId: rutaId || "", // Usar rutaId pasado como prop o string vacío
      horasSalida: [""],
      diasOperacion: [],
      activa: true,
    };

    const nuevasEmbarcaciones = [...embarcacionesFormulario, nuevaEmbarcacion];
    setEmbarcacionesFormulario(nuevasEmbarcaciones);
    onChange(nuevasEmbarcaciones);
  };

  const eliminarEmbarcacion = (tempId: string) => {
    const nuevasEmbarcaciones = embarcacionesFormulario.filter(
      (emb) => emb.tempId !== tempId
    );
    setEmbarcacionesFormulario(nuevasEmbarcaciones);
    onChange(nuevasEmbarcaciones);
  };

  const actualizarEmbarcacion = (
    tempId: string,
    cambios: Partial<EmbarcacionFormulario>
  ) => {
    const nuevasEmbarcaciones = embarcacionesFormulario.map((emb) =>
      emb.tempId === tempId ? { ...emb, ...cambios } : emb
    );
    setEmbarcacionesFormulario(nuevasEmbarcaciones);
    onChange(nuevasEmbarcaciones);
  };

  const agregarHora = (tempId: string) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion) {
      const nuevasHoras = [...embarcacion.horasSalida, ""];
      actualizarEmbarcacion(tempId, { horasSalida: nuevasHoras });
    }
  };

  const eliminarHora = (tempId: string, indiceHora: number) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion && embarcacion.horasSalida.length > 1) {
      const nuevasHoras = embarcacion.horasSalida.filter(
        (_, index) => index !== indiceHora
      );
      actualizarEmbarcacion(tempId, { horasSalida: nuevasHoras });
    }
  };

  const actualizarHora = (tempId: string, indiceHora: number, hora: string) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion) {
      const nuevasHoras = embarcacion.horasSalida.map((h, index) =>
        index === indiceHora ? hora : h
      );
      actualizarEmbarcacion(tempId, { horasSalida: nuevasHoras });
    }
  };

  const toggleDia = (tempId: string, dia: DiaSemana) => {
    const embarcacion = embarcacionesFormulario.find(
      (emb) => emb.tempId === tempId
    );
    if (embarcacion) {
      const nuevosDisas = embarcacion.diasOperacion.includes(dia)
        ? embarcacion.diasOperacion.filter((d) => d !== dia)
        : [...embarcacion.diasOperacion, dia];
      actualizarEmbarcacion(tempId, { diasOperacion: nuevosDisas });
    }
  };

  const obtenerEmbarcacionesYaSeleccionadas = () => {
    return embarcacionesFormulario
      .map((emb) => emb.embarcacionId)
      .filter(Boolean);
  };

  const obtenerNombreEmbarcacion = (id: string) => {
    const embarcacion = embarcacionesDisponibles.find((emb) => emb.id === id);
    return embarcacion?.nombre || "Embarcación no encontrada";
  };

  const obtenerErrorValidacion = (tempId: string): ErrorValidacion | undefined => {
    return erroresValidacion.find((error) => error.tempId === tempId);
  };

  return (
    <div className="space-y-6">
      {/* Header condicional - solo se muestra si mostrarBotonAgregar es true */}
      {mostrarBotonAgregar && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-slate-100">
            Embarcaciones Asignadas
          </h3>
          <button
            type="button"
            onClick={agregarEmbarcacion}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Embarcación</span>
          </button>
        </div>
      )}

      {embarcacionesFormulario.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Ship className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No hay embarcaciones asignadas a esta ruta</p>
          <p className="text-sm">
            {mostrarBotonAgregar
              ? "Haz clic en Agregar Embarcación para comenzar"
              : "Usa el botón Agregar Embarcación de arriba"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {embarcacionesFormulario.map((embarcacionForm) => {
            const embarcacionesYaSeleccionadas =
              obtenerEmbarcacionesYaSeleccionadas();
            const embarcacionesDisponiblesFiltradas =
              embarcacionesDisponibles.filter(
                (emb) =>
                  !embarcacionesYaSeleccionadas.includes(emb.id) ||
                  emb.id === embarcacionForm.embarcacionId
              );

            return (
              <div
                key={embarcacionForm.tempId}
                className="bg-slate-700/30 border border-slate-600/50 rounded-xl p-6 space-y-6"
              >
                {/* Header con selección de embarcación y toggle activo */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Embarcación *
                    </label>
                    <div className="relative">
                      <select
                        value={embarcacionForm.embarcacionId}
                        onChange={(e) =>
                          actualizarEmbarcacion(embarcacionForm.tempId, {
                            embarcacionId: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 pr-10 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-700/50 text-slate-100 backdrop-blur-sm transition-all duration-200 appearance-none cursor-pointer hover:bg-slate-700/70"
                        required
                      >
                        <option value="" className="bg-slate-800 text-slate-400">
                          Seleccionar embarcación
                        </option>
                        {embarcacionesDisponiblesFiltradas.map((embarcacion) => (
                          <option
                            key={embarcacion.id}
                            value={embarcacion.id}
                            className="bg-slate-800 text-slate-100 py-2"
                          >
                            {embarcacion.nombre} - Capacidad: {embarcacion.capacidad}
                          </option>
                        ))}
                      </select>
                      {/* Icono de flecha personalizado */}
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="h-5 w-5 text-slate-400"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Mensaje de error de validación de disponibilidad */}
                    {embarcacionForm.embarcacionId && obtenerErrorValidacion(embarcacionForm.tempId) && (
                      <div className="mt-2 bg-red-900/30 border border-red-700/50 rounded-lg p-3">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-xs text-red-300 font-medium">
                              {obtenerErrorValidacion(embarcacionForm.tempId)?.mensaje}
                            </p>
                            {obtenerErrorValidacion(embarcacionForm.tempId)?.rutasAsignadas &&
                             obtenerErrorValidacion(embarcacionForm.tempId)!.rutasAsignadas!.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs text-red-400 font-medium mb-1">
                                  Asignada a:
                                </p>
                                <ul className="space-y-1">
                                  {obtenerErrorValidacion(embarcacionForm.tempId)!.rutasAsignadas!.map((ruta) => (
                                    <li key={ruta.id} className="text-xs text-red-200">
                                      • {ruta.nombre} ({ruta.trayecto})
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center">
                    {/* Botón eliminar */}
                    <button
                      type="button"
                      onClick={() =>
                        eliminarEmbarcacion(embarcacionForm.tempId)
                      }
                      className="p-2 text-red-400 hover:bg-red-900/30 rounded-xl transition-all duration-200"
                      title="Eliminar asignación"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Horarios de salida */}
                <div>
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-slate-300">
                      <Clock className="inline h-4 w-4 mr-2" />
                      Horarios de Salida *
                    </label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {embarcacionForm.horasSalida.map((hora, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="time"
                          value={hora}
                          onChange={(e) =>
                            actualizarHora(
                              embarcacionForm.tempId,
                              index,
                              e.target.value
                            )
                          }
                          className="flex-1 px-3 py-2 border border-slate-600/50 rounded-lg focus:ring-2 focus:ring-blue-500 bg-slate-700/50 text-slate-100 text-sm"
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Días de operación */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Días de Operación *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                    {DIAS_SEMANA.map((dia) => (
                      <button
                        key={dia.value}
                        type="button"
                        onClick={() =>
                          toggleDia(embarcacionForm.tempId, dia.value)
                        }
                        className={`px-3 py-2 text-sm rounded-lg border transition-all duration-200 ${
                          embarcacionForm.diasOperacion.includes(dia.value)
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-600/50"
                        }`}
                      >
                        {dia.label}
                      </button>
                    ))}
                  </div>
                  {embarcacionForm.diasOperacion.length === 0 && (
                    <p className="text-red-400 text-sm mt-2">
                      Debe seleccionar al menos un día de operación
                    </p>
                  )}
                </div>

                {/* Información de la embarcación seleccionada */}
                {embarcacionForm.embarcacionId && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600/30">
                    <h4 className="text-sm font-medium text-slate-200 mb-2">
                      Información de la Embarcación
                    </h4>
                    <div className="text-sm text-slate-400">
                      <p>
                        <strong>Nombre:</strong>{" "}
                        {obtenerNombreEmbarcacion(
                          embarcacionForm.embarcacionId
                        )}
                      </p>
                      <p>
                        <strong>Capacidad:</strong>{" "}
                        {
                          embarcacionesDisponibles.find(
                            (emb) => emb.id === embarcacionForm.embarcacionId
                          )?.capacidad
                        }{" "}
                        pasajeros
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resumen */}
      {embarcacionesFormulario.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-600/30">
          <h4 className="text-sm font-medium text-slate-200 mb-2">
            Resumen de Asignaciones
          </h4>
          <div className="text-sm text-slate-400 space-y-1">
            <p>
              <strong>Total de embarcaciones:</strong>{" "}
              {embarcacionesFormulario.length}
            </p>
            <p>
              <strong>Capacidad total:</strong>{" "}
              {embarcacionesFormulario.reduce((total, embForm) => {
                const embarcacion = embarcacionesDisponibles.find(
                  (emb) => emb.id === embForm.embarcacionId
                );
                return total + (embarcacion?.capacidad || 0);
              }, 0)}{" "}
              pasajeros
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
